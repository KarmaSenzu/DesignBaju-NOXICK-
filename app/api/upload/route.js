import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

// Allowed MIME types
const ALLOWED_PREVIEW_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
];
const ALLOWED_DESIGN_TYPES = [
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/pdf',
    'image/jpeg', 'image/png', 'image/svg+xml',
    'application/postscript', // .ai, .eps
    'image/vnd.adobe.photoshop', // .psd
    'application/octet-stream', // fallback for some zip files
];

// Allowed file extensions
const ALLOWED_PREVIEW_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ALLOWED_DESIGN_EXTENSIONS = ['.zip', '.rar', '.7z', '.pdf', '.ai', '.eps', '.psd', '.png', '.svg', '.jpg', '.jpeg'];

// Max file sizes
const MAX_PREVIEW_SIZE = 20 * 1024 * 1024;  // 20 MB
const MAX_DESIGN_SIZE = 50 * 1024 * 1024;  // 50 MB

export async function POST(request) {
    try {
        // Auth: any logged-in user can upload (role check below for design files)
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        const formData = await request.formData();
        const type = formData.get('type'); // 'preview' or 'design'
        const file = formData.get('file');

        // Only manager/developer can upload design files (protected digital assets)
        if (type === 'design' && user.role !== 'manager' && user.role !== 'developer') {
            return NextResponse.json({ error: 'Hanya manager yang bisa upload file desain' }, { status: 403 });
        }

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // --- File Validation ---
        const isPreview = type === 'preview';
        const fileName = file.name || '';
        const fileExt = path.extname(fileName).toLowerCase();
        const fileSize = file.size;

        // Validate file extension
        const allowedExtensions = isPreview ? ALLOWED_PREVIEW_EXTENSIONS : ALLOWED_DESIGN_EXTENSIONS;
        if (!allowedExtensions.includes(fileExt)) {
            return NextResponse.json({ 
                error: `Tipe file tidak diizinkan: ${fileExt}. Format yang didukung: ${allowedExtensions.join(', ')}` 
            }, { status: 400 });
        }

        // Validate file size
        const maxSize = isPreview ? MAX_PREVIEW_SIZE : MAX_DESIGN_SIZE;
        if (fileSize > maxSize) {
            const maxMB = Math.round(maxSize / (1024 * 1024));
            return NextResponse.json({ 
                error: `File terlalu besar. Maksimal ${maxMB} MB untuk ${isPreview ? 'preview image' : 'design file'}.` 
            }, { status: 400 });
        }

        // Validate MIME type (best-effort, can be spoofed but adds a layer)
        const allowedTypes = isPreview ? ALLOWED_PREVIEW_TYPES : ALLOWED_DESIGN_TYPES;
        if (file.type && !allowedTypes.includes(file.type)) {
            // Only warn, don't block — MIME types can be unreliable
            console.warn(`Suspicious MIME type: ${file.type} for file ${fileName}`);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine upload directory
        const uploadDir = isPreview ? path.join('public', 'uploads', 'previews') : path.join('storage', 'designs');
        const fullDir = path.join(process.cwd(), uploadDir);

        // Ensure directory exists
        await mkdir(fullDir, { recursive: true });

        // Generate unique filename (sanitized)
        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${timestamp}_${safeName}`;
        const filePath = path.join(fullDir, uniqueFileName);

        // Write file
        await writeFile(filePath, buffer);

        // URL for preview, relative path for design (never expose absolute server paths)
        const relativePath = path.join(uploadDir, uniqueFileName);
        const url = isPreview ? `/uploads/previews/${uniqueFileName}` : relativePath;

        return NextResponse.json({
            success: true,
            url,
            fileName: file.name,
            size: file.size,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
