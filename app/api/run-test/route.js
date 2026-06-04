import { NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken, generateIntegrityHash } from '@/lib/security';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_key_change_in_production';

/**
 * TEST ENDPOINT — Runs the full end-to-end test scenario
 * GET /api/run-test
 * 
 * Skenario:
 * 1. Manager login → buat 2 desain baju dengan variant warna
 * 2. User A beli Desain 1 (Hitam, Size L)
 * 3. User B beli Desain 1 (Putih, Size M)
 * 4. User C beli Desain 2 (Merah XL + Biru L)
 * 5. Verifikasi semua data
 */
export async function GET(request) {
    const results = [];
    const errors = [];
    const state = {};

    // Security: developer-only, non-production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 });
    }

    function log(step, msg) {
        results.push({ step, message: msg, status: 'ok' });
    }
    function logErr(step, msg) {
        errors.push({ step, message: msg });
        results.push({ step, message: msg, status: 'error' });
    }

    try {
        const auth = await authenticateRequest(request, { allowedRoles: ['developer'] });
        if (isAuthError(auth)) return auth;

        // ═══════════════════════════════════════════════════════
        // PHASE 1: SETUP — Login Manager & Create Designs
        // ═══════════════════════════════════════════════════════

        // Cleanup previous test data
        log('0.0', '🧹 Cleaning up previous test data...');
        try {
            await query("DELETE FROM purchases WHERE order_id LIKE 'ORDT-%'");
            await query("DELETE FROM order_items WHERE order_id LIKE 'ORDT-%'");
            await query("DELETE FROM orders WHERE id LIKE 'ORDT-%'");
            await query("DELETE FROM product_variants WHERE product_id IN (SELECT id FROM designs WHERE title LIKE 'TEST -%')");
            await query("DELETE FROM designs WHERE title LIKE 'TEST -%'");
            await query("DELETE FROM users WHERE email LIKE 'test%@test.com'");
            log('0.1', '✅ Previous test data cleaned up');
        } catch (e) {
            log('0.1', `⚠️ Cleanup warning (non-fatal): ${e.message}`);
        }

        // Step 1: Verify manager exists
        log('1.0', '🔐 Verifying manager account...');
        const managers = await query("SELECT id, name, email, role FROM users WHERE email = 'manager@designbaju.com'");
        if (managers.length === 0) {
            logErr('1.0', 'Manager account not found! Run seed.js first.');
            return NextResponse.json({ success: false, results, errors });
        }
        const manager = managers[0];
        state.managerId = manager.id;
        log('1.1', `✅ Manager found: ${manager.name} (ID=${manager.id}, role=${manager.role})`);

        // Generate manager JWT for internal use
        const managerToken = jwt.sign(
            { id: manager.id, email: manager.email, role: manager.role, name: manager.name },
            JWT_SECRET, { expiresIn: '1h' }
        );

        // Step 2: Get Kaos category
        const categories = await query("SELECT id, name FROM categories WHERE name = 'Baju'");
        if (categories.length === 0) {
            logErr('1.2', 'Category "Baju" not found!');
            return NextResponse.json({ success: false, results, errors });
        }
        const kaosId = categories[0].id;
        log('1.2', `✅ Category "Baju" found: ID=${kaosId}`);

        // Step 3: Create Design 1 — Kaos Streetwear
        const design1Result = await query(
            `INSERT INTO designs (title, description, price, category_id, tags, preview_image, mockup_images, file_formats, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'TEST - Kaos Streetwear Edition',
                'Desain kaos streetwear untuk pengujian. Tersedia dalam warna Hitam dan Putih.',
                175000,
                kaosId,
                JSON.stringify(['test', 'streetwear', 'kaos']),
                'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
                JSON.stringify(['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80']),
                JSON.stringify(['PSD', 'PNG', 'SVG']),
                'Manager'
            ]
        );
        state.design1Id = design1Result.insertId;
        log('2.1', `✅ Desain 1 dibuat: ID=${state.design1Id} "Kaos Streetwear Edition" (Rp 175.000)`);

        // Step 4: Create Design 2 — Kaos Minimalist
        const design2Result = await query(
            `INSERT INTO designs (title, description, price, category_id, tags, preview_image, mockup_images, file_formats, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'TEST - Kaos Minimalist Art',
                'Desain kaos minimalist untuk pengujian. Tersedia dalam warna Merah dan Biru.',
                150000,
                kaosId,
                JSON.stringify(['test', 'minimalist', 'kaos']),
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
                JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80']),
                JSON.stringify(['PSD', 'AI', 'PNG']),
                'Manager'
            ]
        );
        state.design2Id = design2Result.insertId;
        log('2.2', `✅ Desain 2 dibuat: ID=${state.design2Id} "Kaos Minimalist Art" (Rp 150.000)`);

        // Step 5: Create Variants for Design 1 (Hitam & Putih)
        const v1a = await query(
            'INSERT INTO product_variants (product_id, color_name, color_code, image_url) VALUES (?, ?, ?, ?)',
            [state.design1Id, 'Hitam', '#1A1A2E', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80']
        );
        const v1b = await query(
            'INSERT INTO product_variants (product_id, color_name, color_code, image_url) VALUES (?, ?, ?, ?)',
            [state.design1Id, 'Putih', '#F5F5F5', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80']
        );
        log('3.1', `✅ Desain 1 variants: Hitam (ID=${v1a.insertId}), Putih (ID=${v1b.insertId})`);

        // Step 6: Create Variants for Design 2 (Merah & Biru)
        const v2a = await query(
            'INSERT INTO product_variants (product_id, color_name, color_code, image_url) VALUES (?, ?, ?, ?)',
            [state.design2Id, 'Merah', '#DC2626', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80']
        );
        const v2b = await query(
            'INSERT INTO product_variants (product_id, color_name, color_code, image_url) VALUES (?, ?, ?, ?)',
            [state.design2Id, 'Biru', '#2563EB', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80']
        );
        log('3.2', `✅ Desain 2 variants: Merah (ID=${v2a.insertId}), Biru (ID=${v2b.insertId})`);

        // Verify variants
        const allVariants1 = await query('SELECT * FROM product_variants WHERE product_id = ?', [state.design1Id]);
        const allVariants2 = await query('SELECT * FROM product_variants WHERE product_id = ?', [state.design2Id]);
        log('3.3', `✅ Verified: Desain 1 has ${allVariants1.length} variants, Desain 2 has ${allVariants2.length} variants`);

        // ═══════════════════════════════════════════════════════
        // PHASE 2: REGISTER 3 TEST USERS
        // ═══════════════════════════════════════════════════════

        const ts = Date.now();
        const hash = await bcrypt.hash('test123456', 10);
        const testUsers = [
            { name: 'Test User A', email: `testa_${ts}@test.com` },
            { name: 'Test User B', email: `testb_${ts}@test.com` },
            { name: 'Test User C', email: `testc_${ts}@test.com` },
        ];

        state.users = [];
        for (const u of testUsers) {
            const result = await query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [u.name, u.email, hash, 'user']
            );
            const userId = result.insertId;
            const token = jwt.sign(
                { id: userId, email: u.email, role: 'user', name: u.name },
                JWT_SECRET, { expiresIn: '1h' }
            );
            state.users.push({ id: userId, name: u.name, email: u.email, token });
            log('4', `✅ ${u.name} registered: ID=${userId}, email=${u.email}`);
        }

        // ═══════════════════════════════════════════════════════
        // PHASE 3: PURCHASES — 3 Orders with different scenarios
        // ═══════════════════════════════════════════════════════

        const pool = getPool();
        state.orders = [];

        // --- Order 1: User A buys Design 1 (Hitam, Size L) ---
        {
            const user = state.users[0];
            const orderId = `ORDT-${String(ts).slice(-6)}A`;
            const designPrice = 175000; // Server-validated price

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                await conn.execute(
                    `INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)`,
                    [orderId, user.id, designPrice, 'pending', 'Bank Transfer']
                );

                await conn.execute(
                    `INSERT INTO order_items (order_id, design_id, title, price, notes, selected_color, selected_size) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, state.design1Id, 'TEST - Kaos Streetwear Edition', designPrice, 'Tolong packing rapi ya', 'Hitam', 'L']
                );

                // Generate purchase record
                const purchaseToken = generateToken(32);
                const purchaseData = { order_id: orderId, user_id: user.id, design_id: state.design1Id, price: designPrice, purchase_token: purchaseToken };
                const integrityHash = generateIntegrityHash(purchaseData);

                await conn.execute(
                    `INSERT INTO purchases (purchase_token, order_id, user_id, design_id, price, integrity_hash) VALUES (?, ?, ?, ?, ?, ?)`,
                    [purchaseToken, orderId, user.id, state.design1Id, designPrice, integrityHash]
                );

                await conn.commit();
                state.orders.push({ orderId, userId: user.id, userName: user.name });
                log('5.1', `✅ ${user.name} → Order ${orderId}: Desain 1 (Hitam, L) = Rp 175.000`);
            } catch (e) {
                await conn.rollback();
                logErr('5.1', `❌ Order User A failed: ${e.message}`);
            } finally {
                conn.release();
            }
        }

        // --- Order 2: User B buys Design 1 (Putih, Size M) ---
        {
            const user = state.users[1];
            const orderId = `ORDT-${String(ts).slice(-6)}B`;
            const designPrice = 175000;

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                await conn.execute(
                    `INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)`,
                    [orderId, user.id, designPrice, 'pending', 'E-Wallet']
                );

                await conn.execute(
                    `INSERT INTO order_items (order_id, design_id, title, price, notes, selected_color, selected_size) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, state.design1Id, 'TEST - Kaos Streetwear Edition', designPrice, null, 'Putih', 'M']
                );

                const purchaseToken = generateToken(32);
                const purchaseData = { order_id: orderId, user_id: user.id, design_id: state.design1Id, price: designPrice, purchase_token: purchaseToken };
                const integrityHash = generateIntegrityHash(purchaseData);

                await conn.execute(
                    `INSERT INTO purchases (purchase_token, order_id, user_id, design_id, price, integrity_hash) VALUES (?, ?, ?, ?, ?, ?)`,
                    [purchaseToken, orderId, user.id, state.design1Id, designPrice, integrityHash]
                );

                await conn.commit();
                state.orders.push({ orderId, userId: user.id, userName: user.name });
                log('5.2', `✅ ${user.name} → Order ${orderId}: Desain 1 (Putih, M) = Rp 175.000`);
            } catch (e) {
                await conn.rollback();
                logErr('5.2', `❌ Order User B failed: ${e.message}`);
            } finally {
                conn.release();
            }
        }

        // --- Order 3: User C buys Design 2 (Merah XL + Biru L) ---
        {
            const user = state.users[2];
            const orderId = `ORDT-${String(ts).slice(-6)}C`;
            const designPrice = 150000;
            const totalPrice = designPrice * 2; // 2 items

            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                await conn.execute(
                    `INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)`,
                    [orderId, user.id, totalPrice, 'pending', 'Credit Card']
                );

                // Item 1: Merah XL
                await conn.execute(
                    `INSERT INTO order_items (order_id, design_id, title, price, notes, selected_color, selected_size) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, state.design2Id, 'TEST - Kaos Minimalist Art (Merah)', designPrice, 'Warna merah yang terang ya', 'Merah', 'XL']
                );

                const pt1 = generateToken(32);
                const pd1 = { order_id: orderId, user_id: user.id, design_id: state.design2Id, price: designPrice, purchase_token: pt1 };
                const ih1 = generateIntegrityHash(pd1);
                await conn.execute(
                    `INSERT INTO purchases (purchase_token, order_id, user_id, design_id, price, integrity_hash) VALUES (?, ?, ?, ?, ?, ?)`,
                    [pt1, orderId, user.id, state.design2Id, designPrice, ih1]
                );

                // Item 2: Biru L
                await conn.execute(
                    `INSERT INTO order_items (order_id, design_id, title, price, notes, selected_color, selected_size) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, state.design2Id, 'TEST - Kaos Minimalist Art (Biru)', designPrice, 'Biru navy', 'Biru', 'L']
                );

                const pt2 = generateToken(32);
                const pd2 = { order_id: orderId, user_id: user.id, design_id: state.design2Id, price: designPrice, purchase_token: pt2 };
                const ih2 = generateIntegrityHash(pd2);
                await conn.execute(
                    `INSERT INTO purchases (purchase_token, order_id, user_id, design_id, price, integrity_hash) VALUES (?, ?, ?, ?, ?, ?)`,
                    [pt2, orderId, user.id, state.design2Id, designPrice, ih2]
                );

                await conn.commit();
                state.orders.push({ orderId, userId: user.id, userName: user.name });
                log('5.3', `✅ ${user.name} → Order ${orderId}: Desain 2 (Merah XL + Biru L) = Rp 300.000`);
            } catch (e) {
                await conn.rollback();
                logErr('5.3', `❌ Order User C failed: ${e.message}`);
            } finally {
                conn.release();
            }
        }

        // ═══════════════════════════════════════════════════════
        // PHASE 4: VERIFICATION
        // ═══════════════════════════════════════════════════════

        // Verify Orders
        log('6.0', '🔍 Verifying orders in database...');
        for (const o of state.orders) {
            const orderRows = await query(
                `SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
                [o.orderId]
            );
            if (orderRows.length === 0) {
                logErr('6.1', `❌ Order ${o.orderId} NOT FOUND in database!`);
                continue;
            }
            const order = orderRows[0];
            const items = await query(
                `SELECT oi.*, d.preview_image FROM order_items oi LEFT JOIN designs d ON oi.design_id = d.id WHERE oi.order_id = ?`,
                [o.orderId]
            );

            log('6.1', `📦 Order ${order.id}: status=${order.status}, total=Rp ${Number(order.total_price).toLocaleString('id-ID')}, user=${order.user_name}, items=${items.length}`);
            
            for (const item of items) {
                const colorInfo = item.selected_color ? ` 🎨${item.selected_color}` : '';
                const sizeInfo = item.selected_size ? ` 📏${item.selected_size}` : '';
                const notesInfo = item.notes ? ` 📝"${item.notes}"` : '';
                log('6.1', `  └─ ${item.title} Rp ${Number(item.price).toLocaleString('id-ID')}${colorInfo}${sizeInfo}${notesInfo}`);
            }

            // Verify status is 'pending'
            if (order.status !== 'pending') {
                logErr('6.2', `❌ Order ${order.id} status should be 'pending' but is '${order.status}'`);
            }
        }

        // Verify Purchases & Integrity
        log('7.0', '🔐 Verifying purchase integrity (HMAC)...');
        for (const user of state.users) {
            const purchases = await query(
                `SELECT p.*, d.title as design_title FROM purchases p JOIN designs d ON p.design_id = d.id WHERE p.user_id = ? ORDER BY p.purchased_at DESC`,
                [user.id]
            );
            
            log('7.1', `👤 ${user.name}: ${purchases.length} purchase record(s)`);
            
            for (const p of purchases) {
                const purchaseData = {
                    order_id: p.order_id,
                    user_id: p.user_id,
                    design_id: p.design_id,
                    price: p.price,
                    purchase_token: p.purchase_token
                };
                const computedHash = generateIntegrityHash(purchaseData);
                const isIntact = computedHash === p.integrity_hash;
                
                if (isIntact) {
                    log('7.1', `  └─ ✅ VERIFIED: ${p.design_title} (token: ${p.purchase_token.substring(0, 12)}...)`);
                } else {
                    logErr('7.1', `  └─ ❌ TAMPERED: ${p.design_title} (hash mismatch!)`);
                }
            }
        }

        // Verify Notifications
        log('8.0', '🔔 Checking notifications...');
        const managerNotifs = await query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [manager.id]
        );
        log('8.1', `Manager has ${managerNotifs.length} notification(s)`);

        // Verify User Isolation (each user only sees own orders)
        log('9.0', '🔒 Verifying user data isolation...');
        for (const user of state.users) {
            const userOrders = await query(
                'SELECT id FROM orders WHERE user_id = ?',
                [user.id]
            );
            const expectedOrder = state.orders.find(o => o.userId === user.id);
            const hasOwnOrder = userOrders.some(o => o.id === expectedOrder?.orderId);
            
            if (hasOwnOrder) {
                log('9.1', `✅ ${user.name} can see own order (${expectedOrder.orderId})`);
            } else {
                logErr('9.1', `❌ ${user.name} CANNOT see own order!`);
            }

            // Check they don't have other users' orders
            const otherOrders = state.orders.filter(o => o.userId !== user.id);
            for (const other of otherOrders) {
                const found = userOrders.some(o => o.id === other.orderId);
                if (found) {
                    logErr('9.2', `❌ ${user.name} can see ${other.userName}'s order (${other.orderId})! SECURITY ISSUE!`);
                }
            }
        }

        // Verify Variants are accessible
        log('10.0', '🎨 Verifying variant data...');
        const v1 = await query('SELECT * FROM product_variants WHERE product_id = ?', [state.design1Id]);
        const v2 = await query('SELECT * FROM product_variants WHERE product_id = ?', [state.design2Id]);
        log('10.1', `Desain 1 "${state.design1Id}": ${v1.map(v => `${v.color_name}(${v.color_code})`).join(', ')}`);
        log('10.2', `Desain 2 "${state.design2Id}": ${v2.map(v => `${v.color_name}(${v.color_code})`).join(', ')}`);

        // ═══════════════════════════════════════════════════════
        // PHASE 5: MANAGER ACTIONS — Update status to 'paid'
        // ═══════════════════════════════════════════════════════

        log('11.0', '📝 Manager updating order statuses to "paid"...');
        for (const o of state.orders) {
            await query('UPDATE orders SET status = ? WHERE id = ?', ['paid', o.orderId]);
            log('11.1', `✅ Order ${o.orderId} → status: paid`);
        }

        // Final verification
        log('12.0', '🔍 Final verification...');
        for (const o of state.orders) {
            const [row] = await query('SELECT id, status, total_price FROM orders WHERE id = ?', [o.orderId]);
            if (row) {
                log('12.1', `✅ ${row.id}: status=${row.status}, total=Rp ${Number(row.total_price).toLocaleString('id-ID')}`);
            }
        }

        // ═══════════════════════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════════════════════

        const passed = results.filter(r => r.status === 'ok').length;
        const failed = errors.length;

        return NextResponse.json({
            success: failed === 0,
            summary: {
                total_steps: results.length,
                passed,
                failed,
                designs_created: 2,
                variants_created: 4,
                users_registered: 3,
                orders_created: state.orders.length,
                design1_id: state.design1Id,
                design2_id: state.design2Id,
                order_ids: state.orders.map(o => o.orderId),
                user_ids: state.users.map(u => ({ id: u.id, name: u.name, email: u.email })),
            },
            results,
            errors,
        });

    } catch (error) {
        logErr('FATAL', `Unhandled error: ${error.message}\n${error.stack}`);
        return NextResponse.json({
            success: false,
            results,
            errors,
            fatal: error.message,
        }, { status: 500 });
    }
}
