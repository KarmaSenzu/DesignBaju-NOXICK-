import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';
import path from 'path';
import { promises as fs } from 'fs';

// Safely unlink a local file path stored in DB.
// - public/uploads/* (web-served) → unlinked relative to public dir
// - storage/* (protected source files) → unlinked relative to project root
// External URLs (http/https) and empty values are ignored.
async function unlinkIfLocal(filePath) {
    if (!filePath || typeof filePath !== 'string') return;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return;

    const projectRoot = process.cwd();
    let absolute;

    if (filePath.startsWith('/uploads/')) {
        absolute = path.join(projectRoot, 'public', filePath);
    } else if (filePath.startsWith('/storage/') || filePath.startsWith('storage/')) {
        absolute = path.join(projectRoot, filePath.replace(/^\//, ''));
    } else {
        // Unknown shape — skip to avoid surprise deletes
        return;
    }

    // Path-traversal guard: ensure resolved path stays within project
    const resolved = path.resolve(absolute);
    const allowedPublic = path.resolve(projectRoot, 'public');
    const allowedStorage = path.resolve(projectRoot, 'storage');
    if (!resolved.startsWith(allowedPublic) && !resolved.startsWith(allowedStorage)) return;

    try {
        await fs.unlink(resolved);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn('Failed to unlink file:', resolved, err.message);
        }
    }
}

export async function POST(request) {
    try {
        // Auth: only manager/developer can create designs
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { title, description, price, category_id, tags, file_formats, preview_image, design_file } = body;

        if (!title || !description || !price || !category_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const tagsJson = JSON.stringify(tags || []);
        const formatsJson = JSON.stringify(file_formats || []);
        const mockupJson = JSON.stringify(body.mockup_images || (preview_image ? [preview_image] : []));

        const result = await query(
            `INSERT INTO designs (title, description, price, category_id, tags, preview_image, design_file, mockup_images, file_formats, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, parseInt(price), parseInt(category_id), tagsJson, preview_image || '', design_file || null, mockupJson, formatsJson, auth.user.name || 'Manager']
        );

        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Create design error:', error);
        return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Public endpoint — no auth required for browsing catalog
        const designs = await query('SELECT d.*, c.name as category_name FROM designs d LEFT JOIN categories c ON d.category_id = c.id ORDER BY d.created_at DESC');
        return NextResponse.json(designs);
    } catch (error) {
        console.error('Get designs error:', error);
        return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        // Auth: only manager/developer can edit designs
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { id, title, description, price, category_id, tags, file_formats, preview_image, design_file, mockup_images } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing design id' }, { status: 400 });
        }

        // Check design exists
        const existing = await query('SELECT id FROM designs WHERE id = ?', [parseInt(id)]);
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        // Build dynamic update query
        const updates = [];
        const params = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (price !== undefined) { updates.push('price = ?'); params.push(parseInt(price)); }
        if (category_id !== undefined) { updates.push('category_id = ?'); params.push(parseInt(category_id)); }
        if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
        if (file_formats !== undefined) { updates.push('file_formats = ?'); params.push(JSON.stringify(file_formats)); }
        if (preview_image !== undefined) { updates.push('preview_image = ?'); params.push(preview_image); }
        if (design_file !== undefined) { updates.push('design_file = ?'); params.push(design_file); }
        if (body.mockup_images !== undefined) { updates.push('mockup_images = ?'); params.push(JSON.stringify(body.mockup_images)); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        params.push(parseInt(id));
        await query(`UPDATE designs SET ${updates.join(', ')} WHERE id = ?`, params);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update design error:', error);
        return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        // Auth: only manager/developer can delete designs
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing design id' }, { status: 400 });
        }

        // Fetch the full design row so we can clean files after DB delete
        const existing = await query(
            'SELECT id, preview_image, design_file, mockup_images FROM designs WHERE id = ?',
            [parseInt(id)]
        );
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }
        const design = existing[0];

        // Collect all variant images for this design before removing them
        const variantRows = await query(
            'SELECT image_url, gallery_images FROM product_variants WHERE product_id = ?',
            [parseInt(id)]
        );

        // Cascade delete variants
        await query('DELETE FROM product_variants WHERE product_id = ?', [parseInt(id)]);
        await query('DELETE FROM designs WHERE id = ?', [parseInt(id)]);

        // After successful DB delete, clean up local files (best-effort, never fails the response)
        try {
            const filesToRemove = new Set();
            if (design.preview_image) filesToRemove.add(design.preview_image);
            if (design.design_file) filesToRemove.add(design.design_file);

            const parseList = (raw) => {
                try {
                    if (!raw) return [];
                    if (typeof raw === 'string') return JSON.parse(raw);
                    if (Array.isArray(raw)) return raw;
                    return [];
                } catch { return []; }
            };

            for (const m of parseList(design.mockup_images)) filesToRemove.add(m);
            for (const v of variantRows) {
                if (v.image_url) filesToRemove.add(v.image_url);
                for (const g of parseList(v.gallery_images)) filesToRemove.add(g);
            }

            await Promise.all([...filesToRemove].map(unlinkIfLocal));
        } catch (cleanupErr) {
            console.warn('File cleanup error (non-fatal):', cleanupErr.message);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete design error:', error);
        return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
    }
}
