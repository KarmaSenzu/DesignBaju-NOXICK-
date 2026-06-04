import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

// GET — Seed sample product variants for testing
export async function GET(request) {
    try {
        // Auth: only developer can seed variants
        const auth = await authenticateRequest(request, { allowedRoles: ['developer'] });
        if (isAuthError(auth)) return auth;

        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Seed endpoint disabled in production' }, { status: 403 });
        }

        const sampleVariants = [
            // Design 1 - Urban Street Vibes (Kaos)
            { product_id: 1, color_name: 'Hitam', color_code: '#1a1a2e', image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80' },
            { product_id: 1, color_name: 'Putih', color_code: '#F5F5F5', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
            { product_id: 1, color_name: 'Maroon', color_code: '#800000', image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80' },
            { product_id: 1, color_name: 'Navy', color_code: '#1B2A4A', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80' },
            // Design 2 - Minimalist Nature (Kaos)
            { product_id: 2, color_name: 'Sage Green', color_code: '#9CAF88', image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec515c7?w=600&q=80' },
            { product_id: 2, color_name: 'Cream', color_code: '#F5F0E1', image_url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80' },
            { product_id: 2, color_name: 'Dusty Pink', color_code: '#D4A5A5', image_url: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600&q=80' },
            // Design 3 - Retro Wave Collection (Kaos)
            { product_id: 3, color_name: 'Hitam', color_code: '#0D0D0D', image_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80' },
            { product_id: 3, color_name: 'Deep Purple', color_code: '#2D1B69', image_url: 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=600&q=80' },
            { product_id: 3, color_name: 'Neon Pink', color_code: '#FF6EC7', image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80' },
            // Design 9 - Japanese Wave Art (Kaos)
            { product_id: 9, color_name: 'Indigo', color_code: '#3F51B5', image_url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&q=80' },
            { product_id: 9, color_name: 'Putih', color_code: '#FAFAFA', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
            { product_id: 9, color_name: 'Abu-abu', color_code: '#757575', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80' },
            // Design 13 - Skull & Roses Gothic (Kaos)
            { product_id: 13, color_name: 'Hitam', color_code: '#0A0A0A', image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80' },
            { product_id: 13, color_name: 'Blood Red', color_code: '#8B0000', image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80' },
            { product_id: 13, color_name: 'Charcoal', color_code: '#36454F', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80' },
            // Design 7 - Holographic Sticker Pack (Sticker)
            { product_id: 7, color_name: 'Holographic', color_code: '#E0B0FF', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80' },
            { product_id: 7, color_name: 'Gold Foil', color_code: '#FFD700', image_url: 'https://images.unsplash.com/photo-1572566929650-3301a5732f52?w=600&q=80' },
            // Design 19 - Vaporwave Aesthetic (Kaos)
            { product_id: 19, color_name: 'Pastel Pink', color_code: '#FFB6C1', image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80' },
            { product_id: 19, color_name: 'Lilac', color_code: '#C8A2C8', image_url: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600&q=80' },
            { product_id: 19, color_name: 'Sky Blue', color_code: '#87CEEB', image_url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80' },
        ];

        // Clear existing variants first
        await query('DELETE FROM product_variants');

        // Insert all variants
        for (const v of sampleVariants) {
            await query(
                'INSERT INTO product_variants (product_id, color_name, color_code, image_url) VALUES (?, ?, ?, ?)',
                [v.product_id, v.color_name, v.color_code, v.image_url]
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: `Seeded ${sampleVariants.length} product variants`,
            count: sampleVariants.length
        });
    } catch (error) {
        console.error('Seed variants error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
