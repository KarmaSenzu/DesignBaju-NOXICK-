import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyIntegrityHash } from '@/lib/security';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

export async function GET(request) {
    try {
        // Auth: logged-in users can only view their own purchases
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        // Always use authenticated user's ID — ignore query param for regular users
        const userId = user.role === 'user' ? user.id : (new URL(request.url).searchParams.get('user_id') || user.id);

        const purchases = await query(`
            SELECT p.*, d.title, d.preview_image, d.file_formats, d.design_file 
            FROM purchases p
            JOIN designs d ON p.design_id = d.id
            WHERE p.user_id = ?
            ORDER BY p.purchased_at DESC
        `, [parseInt(userId)]);

        // Verify integrity of each purchase record
        const verifiedPurchases = purchases.map(p => {
            const purchaseData = {
                order_id: p.order_id,
                user_id: p.user_id,
                design_id: p.design_id,
                price: p.price,
                purchase_token: p.purchase_token
            };
            const isIntact = verifyIntegrityHash(purchaseData, p.integrity_hash);
            
            return {
                ...p,
                is_tampered: !isIntact,
                file_formats: typeof p.file_formats === 'string' ? JSON.parse(p.file_formats || '[]') : (p.file_formats || [])
            };
        });

        return NextResponse.json(verifiedPurchases);
    } catch (error) {
        console.error('Get purchases error:', error);
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }
}
