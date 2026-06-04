import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/security';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// POST: Request a download token
export async function POST(request) {
    try {
        const { purchase_id, ip_address } = await request.json();

        if (!purchase_id) {
            return NextResponse.json({ error: 'Missing purchase_id' }, { status: 400 });
        }

        const cookieStore = await cookies();
        let token = cookieStore.get('token')?.value;

        // Fallback: Authorization header
        if (!token) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let user_id;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            user_id = decoded.id;
        } catch (error) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const purchases = await query('SELECT * FROM purchases WHERE id = ? AND user_id = ?', [purchase_id, user_id]);
        if (purchases.length === 0) {
            return NextResponse.json({ error: 'Purchase not found or access denied' }, { status: 403 });
        }

        const purchase = purchases[0];

        // Generate a 30-min single-use download token
        const downloadToken = generateToken(32);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // +30 minutes

        await query(
            `INSERT INTO download_tokens (token, purchase_id, user_id, design_id, ip_address, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [downloadToken, purchase.id, purchase.user_id, purchase.design_id, ip_address || 'unknown', expiresAt]
        );

        return NextResponse.json({ success: true, token: downloadToken });
    } catch (error) {
        console.error('Generate download token error:', error);
        return NextResponse.json({ error: 'Failed to generate download token' }, { status: 500 });
    }
}

// GET: Consume token and download file
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Missing download token', { status: 400 });
        }

        // Validate token
        const tokens = await query('SELECT * FROM download_tokens WHERE token = ?', [token]);
        if (tokens.length === 0) {
            return new NextResponse('Invalid download token', { status: 403 });
        }

        const downloadData = tokens[0];

        if (downloadData.used) {
            return new NextResponse('Download link has already been used. Please request a new one.', { status: 403 });
        }

        if (new Date(downloadData.expires_at) < new Date()) {
            return new NextResponse('Download link has expired. Please request a new one.', { status: 403 });
        }

        // Mark token as used
        await query('UPDATE download_tokens SET used = true WHERE id = ?', [downloadData.id]);

        // Fetch the design file path
        const designs = await query('SELECT title, design_file FROM designs WHERE id = ?', [downloadData.design_id]);
        if (designs.length === 0 || !designs[0].design_file) {
            return new NextResponse('Design file not found on server', { status: 404 });
        }

        const design = designs[0];
        const filePath = designs[0].design_file;
        
        // Ensure path is absolute if relative
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

        // Path traversal protection
        const allowedDir = path.resolve(process.cwd(), 'storage');
        const resolvedPath = path.resolve(absolutePath);
        if (!resolvedPath.startsWith(allowedDir)) {
            return NextResponse.json({ error: 'Access denied: invalid file path' }, { status: 403 });
        }

        if (!fs.existsSync(absolutePath)) {
            return new NextResponse('File missing on disk', { status: 404 });
        }

        // Stream the file
        const fileBuffer = fs.readFileSync(absolutePath);
        const ext = path.extname(absolutePath);
        const filename = `${design.title.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;

        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Length', fileBuffer.length.toString());

        return new NextResponse(fileBuffer, { headers });

    } catch (error) {
        console.error('File download error:', error);
        return new NextResponse('Internal server error during download', { status: 500 });
    }
}
