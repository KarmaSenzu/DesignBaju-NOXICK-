import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

// GET — Fetch variants (public)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        let sql = 'SELECT * FROM product_variants';
        const params = [];

        if (productId) {
            sql += ' WHERE product_id = ?';
            params.push(parseInt(productId));
        }

        sql += ' ORDER BY sort_order ASC, id ASC';

        const variants = await query(sql, params);

        // Parse gallery_images JSON
        const parsed = variants.map(v => ({
            ...v,
            gallery_images: (() => {
                try {
                    if (typeof v.gallery_images === 'string') return JSON.parse(v.gallery_images);
                    if (Array.isArray(v.gallery_images)) return v.gallery_images;
                    return [];
                } catch { return []; }
            })(),
        }));

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Get variants error:', error);
        return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
    }
}

// POST — Create a new variant (manager/developer only)
export async function POST(request) {
    try {
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { product_id, color_name, color_code, image_url, gallery_images, sort_order, is_default } = body;

        if (!product_id || !color_name || !color_code || !image_url) {
            return NextResponse.json({ error: 'Missing required fields: product_id, color_name, color_code, image_url' }, { status: 400 });
        }

        // If is_default, unset other defaults for this product
        if (is_default) {
            await query('UPDATE product_variants SET is_default = FALSE WHERE product_id = ?', [parseInt(product_id)]);
        }

        const galleryJson = JSON.stringify(gallery_images || []);

        const result = await query(
            `INSERT INTO product_variants (product_id, color_name, color_code, image_url, gallery_images, sort_order, is_default) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [parseInt(product_id), color_name, color_code, image_url, galleryJson, sort_order || 0, is_default ? 1 : 0]
        );

        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Create variant error:', error);
        return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
    }
}

// PUT — Update an existing variant (manager/developer only)
export async function PUT(request) {
    try {
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { id, color_name, color_code, image_url, gallery_images, sort_order, is_default } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing variant id' }, { status: 400 });
        }

        // Check variant exists
        const existing = await query('SELECT id, product_id FROM product_variants WHERE id = ?', [parseInt(id)]);
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        // If setting as default, unset others
        if (is_default) {
            await query('UPDATE product_variants SET is_default = FALSE WHERE product_id = ?', [existing[0].product_id]);
        }

        // Build dynamic update
        const updates = [];
        const params = [];

        if (color_name !== undefined) { updates.push('color_name = ?'); params.push(color_name); }
        if (color_code !== undefined) { updates.push('color_code = ?'); params.push(color_code); }
        if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
        if (gallery_images !== undefined) { updates.push('gallery_images = ?'); params.push(JSON.stringify(gallery_images)); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
        if (is_default !== undefined) { updates.push('is_default = ?'); params.push(is_default ? 1 : 0); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        params.push(parseInt(id));
        await query(`UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?`, params);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update variant error:', error);
        return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
    }
}

// DELETE — Delete a variant (manager/developer only)
export async function DELETE(request) {
    try {
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing variant id' }, { status: 400 });
        }

        await query('DELETE FROM product_variants WHERE id = ?', [parseInt(id)]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete variant error:', error);
        return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
    }
}
