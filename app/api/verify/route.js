import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIntegrityHash } from '@/lib/security';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing purchase token' }, { status: 400 });
        }

        const purchases = await query(`
            SELECT p.*, d.title, d.preview_image, u.name as buyer_name 
            FROM purchases p
            JOIN designs d ON p.design_id = d.id
            JOIN users u ON p.user_id = u.id
            WHERE p.purchase_token = ?
        `, [token]);

        if (purchases.length === 0) {
            return NextResponse.json({ error: 'Invalid or unknown purchase token' }, { status: 404 });
        }

        const p = purchases[0];

        // Verify Integrity
        const purchaseData = {
            order_id: p.order_id,
            user_id: p.user_id,
            design_id: p.design_id,
            price: p.price,
            purchase_token: p.purchase_token
        };
        const isIntact = verifyIntegrityHash(purchaseData, p.integrity_hash);

        if (!isIntact) {
            return NextResponse.json({ 
                error: 'TAMPERED: The purchase data has been manipulated and fails integrity check.',
                is_tampered: true
            }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            is_tampered: false,
            purchase: {
                purchase_token: p.purchase_token,
                order_id: p.order_id,
                buyer: p.buyer_name,
                design: p.title,
                price: p.price,
                preview: p.preview_image,
                purchased_at: p.purchased_at
            }
        });

    } catch (error) {
        console.error('Verify purchase error:', error);
        return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
    }
}
