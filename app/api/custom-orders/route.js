import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

// Fixed DP prices per product type
const PRODUCT_DP_PRICES = {
    'Baju': 50000,
    'Celana': 50000,
    'Jaket & Sweater': 75000,
    '1 Set (Baju + Celana)': 100000,
    'Custom Lainnya': 50000,
};

// GET — Fetch custom orders
export async function GET(request) {
    try {
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        let sql = `SELECT co.*, u.name as user_name, u.email as user_email 
                    FROM custom_orders co 
                    LEFT JOIN users u ON co.user_id = u.id`;
        const params = [];

        if (user.role === 'user') {
            sql += ' WHERE co.user_id = ?';
            params.push(user.id);
        }

        sql += ' ORDER BY co.created_at DESC';

        const orders = await query(sql, params);
        return NextResponse.json(orders);
    } catch (error) {
        console.error('Get custom orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch custom orders' }, { status: 500 });
    }
}

// POST — Create a new custom order
export async function POST(request) {
    try {
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        const body = await request.json();
        const { product_type, description, deadline, phone, contact_info, reference_image } = body;

        if (!product_type || !description || !phone) {
            return NextResponse.json({ error: 'Jenis produk, deskripsi, dan nomor telepon wajib diisi' }, { status: 400 });
        }

        // Get DP amount from fixed price list
        const dpAmount = PRODUCT_DP_PRICES[product_type] || 50000;

        // Generate custom order ID
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderId = `CUST-${dateStr}-${randomSuffix}`;

        await query(
            `INSERT INTO custom_orders (id, user_id, product_type, description, budget, deadline, phone, contact_info, reference_image, dp_amount, total_amount, remaining_amount, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [orderId, user.id, product_type, description, dpAmount, deadline || null, phone, contact_info || null, reference_image || null, dpAmount, 0, 0]
        );

        return NextResponse.json({
            success: true,
            order: {
                id: orderId,
                dp_amount: dpAmount,
                product_type,
                description,
                phone,
            },
        });
    } catch (error) {
        console.error('Create custom order error:', error);
        return NextResponse.json({ error: 'Failed to create custom order' }, { status: 500 });
    }
}

// PUT — Update custom order (status, total_amount by manager, etc.)
export async function PUT(request) {
    try {
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        const body = await request.json();
        const { id, status, total_amount, midtrans_dp_id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
        }

        const orders = await query('SELECT user_id, dp_amount, product_type FROM custom_orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orders[0];
        const isOwner = order.user_id === user.id;
        const isManager = user.role === 'manager' || user.role === 'developer';

        // Manager sets total_amount (final deal price)
        if (total_amount !== undefined && total_amount !== null) {
            if (!isManager) {
                return NextResponse.json({ error: 'Hanya manager yang bisa set harga deal' }, { status: 403 });
            }

            const dp = order.dp_amount;
            const remaining = parseInt(total_amount) - dp;

            await query(
                'UPDATE custom_orders SET total_amount = ?, remaining_amount = ?, status = ? WHERE id = ?',
                [parseInt(total_amount), remaining, 'in_progress', id]
            );

            // Notify user
            await query(
                'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
                [order.user_id, 'custom_order', '💰 Harga Final Ditetapkan', `Custom order #${id} (${order.product_type}): Harga final Rp ${parseInt(total_amount).toLocaleString('id-ID')}. Sisa bayar: Rp ${remaining.toLocaleString('id-ID')}`, id]
            );

            return NextResponse.json({ success: true, remaining_amount: remaining });
        }

        // Status update
        if (status) {
            const validStatuses = ['pending', 'dp_paid', 'in_progress', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }

            const managerOnlyStatuses = ['in_progress', 'completed'];
            if (managerOnlyStatuses.includes(status) && !isManager) {
                return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
            }

            if (!isManager && !isOwner) {
                return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
            }

            const updates = ['status = ?'];
            const params = [status];

            if (midtrans_dp_id) { updates.push('midtrans_dp_id = ?'); params.push(midtrans_dp_id); }

            params.push(id);
            await query(`UPDATE custom_orders SET ${updates.join(', ')} WHERE id = ?`, params);

            // Notify user when manager completes order
            if (status === 'completed' && isManager) {
                await query(
                    'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
                    [order.user_id, 'custom_order', '✅ Custom Order Selesai!', `Custom order #${id} (${order.product_type}) sudah selesai! Terima kasih telah memesan.`, id]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update custom order error:', error);
        return NextResponse.json({ error: 'Failed to update custom order' }, { status: 500 });
    }
}
