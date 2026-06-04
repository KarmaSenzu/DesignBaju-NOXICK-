import { NextResponse } from 'next/server';
import { createTransaction } from '@/lib/midtrans';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

// POST — Create Midtrans Snap transaction token
export async function POST(request) {
    try {
        // Auth: only logged-in users can create payment transactions
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { order_id, gross_amount, items, customer } = body;

        if (!order_id || !gross_amount) {
            return NextResponse.json({ error: 'Missing order_id or gross_amount' }, { status: 400 });
        }

        const result = await createTransaction({
            orderId: order_id,
            grossAmount: gross_amount,
            items: items || [{ id: order_id, title: 'Order Payment', price: gross_amount, quantity: 1 }],
            customer: customer || {},
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to create transaction' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            token: result.token,
            redirect_url: result.redirect_url,
        });
    } catch (error) {
        console.error('Payment create error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
