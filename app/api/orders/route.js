import { NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db';
import { generateToken, generateIntegrityHash } from '@/lib/security';
import { notifyManagerNewOrder } from '@/lib/fonnte';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

export async function POST(request) {
    try {
        // Auth: any logged-in user can create orders
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        const body = await request.json();
        const { items, payment_method, discount, promo_code, status: requestedStatus } = body;

        // Use authenticated user's ID, not from request body
        const user_id = user.id;

        // Determine initial order status
        const allowedStatuses = ['pending', 'paid'];
        const orderStatus = allowedStatuses.includes(requestedStatus) ? requestedStatus : 'pending';

        if (!items || !items.length) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Server-side price validation: query actual prices from DB
        let serverTotalPrice = 0;
        const validatedItems = [];

        for (const item of items) {
            const designId = parseInt(item.design_id);
            if (isNaN(designId)) {
                return NextResponse.json(
                    { error: `Invalid design_id: ${item.design_id}` },
                    { status: 400 }
                );
            }

            // Query the actual price from database
            const designs = await query('SELECT id, title, price FROM designs WHERE id = ?', [designId]);
            
            if (designs.length === 0) {
                return NextResponse.json(
                    { error: `Desain dengan ID ${designId} tidak ditemukan` },
                    { status: 400 }
                );
            }
            const serverPrice = designs[0].price;

            serverTotalPrice += serverPrice;
            // Use server title as base, but keep client title if it contains color/variant info
            const serverTitle = designs.length > 0 ? designs[0].title : item.title;
            const finalTitle = item.selected_color ? (item.title || serverTitle) : serverTitle;
            validatedItems.push({
                ...item,
                design_id: designId,
                price: serverPrice,
                title: finalTitle,
            });
        }

        // Check if any design is already sold (1 item per design rule)
        for (const item of validatedItems) {
            const existingOrders = await query(`
                SELECT oi.design_id FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.design_id = ? AND o.status NOT IN ('cancelled')
                LIMIT 1
            `, [item.design_id]);

            if (existingOrders.length > 0) {
                return NextResponse.json(
                    { error: `Desain "${item.title}" sudah terjual (sold out). Silakan pilih desain lain.` },
                    { status: 409 }
                );
            }
        }

        const orderId = `ORD-${Date.now().toString().slice(-6)}`;

        // Use database transaction to ensure atomicity
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Insert order with server-validated price
            await connection.execute(
                `INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)`,
                [orderId, parseInt(user_id), serverTotalPrice, orderStatus, payment_method || null]
            );

            // Insert order items and create secure purchase identities
            for (const item of validatedItems) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, design_id, title, price, notes, selected_color, selected_size) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, item.design_id, item.title, item.price, item.notes || null, item.selected_color || null, item.selected_size || null]
                );

                // Generate secure purchase identity
                const purchaseToken = generateToken(32);
                const purchaseData = {
                    order_id: orderId,
                    user_id: parseInt(user_id),
                    design_id: item.design_id,
                    price: item.price,
                    purchase_token: purchaseToken
                };
                const integrityHash = generateIntegrityHash(purchaseData);

                await connection.execute(
                    `INSERT INTO purchases (purchase_token, order_id, user_id, design_id, price, integrity_hash) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [purchaseToken, orderId, parseInt(user_id), item.design_id, item.price, integrityHash]
                );
            }

            await connection.commit();
        } catch (txError) {
            await connection.rollback();
            throw txError;
        } finally {
            connection.release();
        }

        // --- Notification + WhatsApp (outside transaction) ---
        const users = await query('SELECT name FROM users WHERE id = ?', [parseInt(user_id)]);
        const userName = users.length > 0 ? users[0].name : 'Unknown';

        // Create in-app notification for all managers
        const managers = await query("SELECT id FROM users WHERE role IN ('manager', 'developer')");
        for (const mgr of managers) {
            await query(
                'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
                [mgr.id, 'order', '📥 Order Baru Masuk', `Order #${orderId} dari ${userName} sebesar Rp ${Number(serverTotalPrice).toLocaleString('id-ID')} (${validatedItems.length} item)`, orderId]
            );
        }

        // Send WhatsApp notification to manager
        notifyManagerNewOrder({
            id: orderId,
            user_name: userName,
            items: validatedItems,
            total_price: serverTotalPrice,
        }).catch(err => console.error('WA notification failed:', err));

        return NextResponse.json({ success: true, order_id: orderId });
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        // Auth: logged-in users can view their own orders, managers/developers can see all
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        let ordersResult;
        if (user.role === 'user') {
            // Regular users can ONLY see their own orders
            ordersResult = await query(
                `SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.user_id = ? ORDER BY o.created_at DESC`,
                [user.id]
            );
        } else if (userId) {
            // Manager/developer filtering by specific user
            ordersResult = await query(
                `SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.user_id = ? ORDER BY o.created_at DESC`,
                [parseInt(userId)]
            );
        } else {
            // Manager/developer viewing all orders
            ordersResult = await query(
                `SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`
            );
        }

        // For each order, get items with design preview info
        const ordersWithItems = await Promise.all(
            ordersResult.map(async (order) => {
                const items = await query(
                    `SELECT oi.*, d.preview_image, d.file_formats 
                     FROM order_items oi 
                     LEFT JOIN designs d ON oi.design_id = d.id 
                     WHERE oi.order_id = ?`,
                    [order.id]
                );

                return {
                    ...order,
                    user_name: order.user_name || 'Unknown',
                    created_at: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : null,
                    items: items.map(item => ({
                        design_id: item.design_id,
                        title: item.title,
                        price: item.price,
                        notes: item.notes || null,
                        selected_color: item.selected_color || null,
                        selected_size: item.selected_size || null,
                        preview_image: item.preview_image || null,
                        file_formats: typeof item.file_formats === 'string'
                            ? JSON.parse(item.file_formats || '[]')
                            : (item.file_formats || []),
                    })),
                };
            })
        );

        return NextResponse.json(ordersWithItems);
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        // Auth: only manager/developer can update order status
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const validStatuses = ['pending', 'paid', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
