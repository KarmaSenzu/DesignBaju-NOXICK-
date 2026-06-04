import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isTransactionPaid, verifyNotification } from '@/lib/midtrans';
import { notifyManagerNewOrder, notifyManagerCustomOrderDP } from '@/lib/fonnte';

// POST — Midtrans webhook callback
export async function POST(request) {
    try {
        const body = await request.json();

        // Verify webhook signature with Midtrans
        const verification = await verifyNotification(body);
        if (!verification.success) {
            console.error('[Webhook] Signature verification failed:', verification.error);
            return NextResponse.json({ error: 'Invalid notification signature' }, { status: 403 });
        }

        const { orderId: order_id, transactionStatus: transaction_status, fraudStatus: fraud_status, grossAmount: gross_amount } = verification;

        console.log('[Webhook] Verified:', { order_id, transaction_status, fraud_status });

        // Only process successful payments
        const isPaid = isTransactionPaid(transaction_status) && fraud_status !== 'deny';

        if (!isPaid) {
            console.log('[Webhook] Transaction not paid yet, status:', transaction_status);
            return NextResponse.json({ success: true, message: 'Noted, not paid yet' });
        }

        // Determine if this is a regular order or custom order DP/remaining
        if (order_id.startsWith('ORD-')) {
            // Regular order — update status to completed
            await query('UPDATE orders SET status = ? WHERE id = ?', ['paid', order_id]);

            // Fetch order details for notification
            const orders = await query(
                `SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
                [order_id]
            );
            if (orders.length > 0) {
                const order = orders[0];
                const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order_id]);

                // Send WA notification
                await notifyManagerNewOrder({ ...order, items });

                // Create in-app notification for managers
                const managers = await query("SELECT id FROM users WHERE role IN ('manager', 'developer')");
                for (const mgr of managers) {
                    await query(
                        'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
                        [mgr.id, 'order', '📥 Order Baru', `Order #${order_id} dari ${order.user_name} sebesar Rp ${Number(gross_amount).toLocaleString('id-ID')}`, order_id]
                    );
                }
            }

        } else if (order_id.startsWith('CUSTDP-')) {
            // Custom order DP payment
            const custId = order_id.replace('CUSTDP-', '');
            await query(
                'UPDATE custom_orders SET status = ?, midtrans_dp_id = ? WHERE id = ?',
                ['dp_paid', order_id, custId]
            );

            // Fetch custom order for WA notification
            const custOrders = await query(
                'SELECT co.*, u.name as user_name FROM custom_orders co LEFT JOIN users u ON co.user_id = u.id WHERE co.id = ?',
                [custId]
            );
            if (custOrders.length > 0) {
                await notifyManagerCustomOrderDP(custOrders[0]);

                const managers = await query("SELECT id FROM users WHERE role IN ('manager', 'developer')");
                for (const mgr of managers) {
                    await query(
                        'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
                        [mgr.id, 'custom_order', '🎨 Custom Order DP Masuk', `Custom Order #${custId} dari ${custOrders[0].user_name} - DP Rp ${Number(custOrders[0].dp_amount).toLocaleString('id-ID')}`, custId]
                    );
                }
            }

        } else if (order_id.startsWith('CUSTFULL-')) {
            // Custom order remaining payment
            const custId = order_id.replace('CUSTFULL-', '');
            await query(
                'UPDATE custom_orders SET status = ?, remaining_amount = 0, midtrans_full_id = ? WHERE id = ?',
                ['completed', order_id, custId]
            );

            // Notify managers
            const custOrders = await query(
                'SELECT co.*, u.name as user_name FROM custom_orders co LEFT JOIN users u ON co.user_id = u.id WHERE co.id = ?',
                [custId]
            );
            if (custOrders.length > 0) {
                const managers = await query("SELECT id FROM users WHERE role IN ('manager', 'developer')");
                for (const mgr of managers) {
                    await query(
                        'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
                        [mgr.id, 'payment', '💰 Pelunasan Custom Order', `Custom Order #${custId} dari ${custOrders[0].user_name} sudah LUNAS`, custId]
                    );
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
