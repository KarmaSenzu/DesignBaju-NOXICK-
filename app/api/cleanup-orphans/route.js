import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * Cleanup orphan files — manager/developer only.
 *
 * Scans these directories for files no longer referenced by any DB row:
 *   - public/uploads/previews/   (preview images, mockup images, variant images)
 *   - public/uploads/designs/    (legacy/older path)
 *   - storage/designs/           (protected source files)
 *
 * GET  → dry-run: returns the list of orphan files that would be deleted
 * POST → actually deletes them
 *
 * External URLs (https://images.unsplash.com/...) are not stored on disk so they're ignored.
 */

const SCAN_DIRS = [
    { abs: 'public/uploads/previews', urlPrefix: '/uploads/previews/' },
    { abs: 'public/uploads/designs', urlPrefix: '/uploads/designs/' },
    { abs: 'storage/designs', urlPrefix: '/storage/designs/' },
];

async function listFiles(absDir) {
    try {
        const entries = await fs.readdir(absDir, { withFileTypes: true });
        return entries.filter(e => e.isFile()).map(e => e.name);
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
}

function extractFilenames(value) {
    if (!value) return [];
    if (typeof value !== 'string') {
        // Could already be parsed JSON
        if (Array.isArray(value)) return value.flatMap(extractFilenames);
        return [];
    }
    // Try to parse as JSON array first
    let candidates = [value];
    if (value.startsWith('[')) {
        try {
            const arr = JSON.parse(value);
            if (Array.isArray(arr)) candidates = arr;
        } catch { /* fall through */ }
    }
    const out = [];
    for (const c of candidates) {
        if (typeof c !== 'string') continue;
        // Skip external URLs
        if (c.startsWith('http://') || c.startsWith('https://')) continue;
        // Take only the basename — the file's name on disk
        out.push(path.basename(c));
    }
    return out;
}

async function collectReferencedFilenames() {
    const referenced = new Set();

    // designs.preview_image, designs.design_file, designs.mockup_images
    const designs = await query('SELECT preview_image, design_file, mockup_images FROM designs');
    for (const d of designs) {
        for (const f of extractFilenames(d.preview_image)) referenced.add(f);
        for (const f of extractFilenames(d.design_file)) referenced.add(f);
        for (const f of extractFilenames(d.mockup_images)) referenced.add(f);
    }

    // product_variants.image_url, product_variants.gallery_images
    const variants = await query('SELECT image_url, gallery_images FROM product_variants');
    for (const v of variants) {
        for (const f of extractFilenames(v.image_url)) referenced.add(f);
        for (const f of extractFilenames(v.gallery_images)) referenced.add(f);
    }

    // custom_orders.reference_image (uploaded references shouldn't be auto-deleted while order is active)
    try {
        const customs = await query('SELECT reference_image FROM custom_orders');
        for (const c of customs) {
            for (const f of extractFilenames(c.reference_image)) referenced.add(f);
        }
    } catch {
        // table or column may differ — ignore
    }

    return referenced;
}

async function findOrphans() {
    const referenced = await collectReferencedFilenames();
    const projectRoot = process.cwd();
    const orphans = [];

    for (const { abs, urlPrefix } of SCAN_DIRS) {
        const dir = path.join(projectRoot, abs);
        const filenames = await listFiles(dir);
        for (const name of filenames) {
            if (!referenced.has(name)) {
                orphans.push({
                    filename: name,
                    directory: abs,
                    url: urlPrefix + name,
                    absolute: path.join(dir, name),
                });
            }
        }
    }

    return { orphans, referencedCount: referenced.size };
}

// GET → dry-run preview
export async function GET(request) {
    try {
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const { orphans, referencedCount } = await findOrphans();

        return NextResponse.json({
            success: true,
            mode: 'dry-run',
            referenced_count: referencedCount,
            orphan_count: orphans.length,
            orphans: orphans.map(o => ({
                filename: o.filename,
                directory: o.directory,
                url: o.url,
            })),
        });
    } catch (error) {
        console.error('Cleanup orphans (dry-run) error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST → actually delete
export async function POST(request) {
    try {
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const { orphans, referencedCount } = await findOrphans();

        const projectRoot = path.resolve(process.cwd());
        const deleted = [];
        const failed = [];

        for (const o of orphans) {
            // Path-traversal guard
            const resolved = path.resolve(o.absolute);
            if (!resolved.startsWith(projectRoot)) {
                failed.push({ ...o, error: 'path outside project' });
                continue;
            }
            try {
                await fs.unlink(resolved);
                deleted.push(o.filename);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    deleted.push(o.filename); // already gone, treat as success
                } else {
                    failed.push({ filename: o.filename, error: err.message });
                }
            }
        }

        return NextResponse.json({
            success: true,
            mode: 'delete',
            referenced_count: referencedCount,
            deleted_count: deleted.length,
            failed_count: failed.length,
            deleted,
            failed,
        });
    } catch (error) {
        console.error('Cleanup orphans (delete) error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
