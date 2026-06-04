import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_key_change_in_production';

/**
 * Server-side JWT authentication middleware for API routes.
 * Verifies the token from httpOnly cookie and returns the decoded user payload.
 * 
 * @param {Request} request - The incoming request object
 * @param {Object} options - Configuration options
 * @param {string[]} [options.allowedRoles] - Array of roles allowed to access this endpoint (e.g. ['manager', 'developer'])
 * @returns {{ user: Object } | NextResponse} - Returns { user } on success, or a NextResponse error
 */
export async function authenticateRequest(request, options = {}) {
    const { allowedRoles } = options;

    try {
        // Try cookie first, then Authorization header as fallback
        const cookieStore = await cookies();
        let token = cookieStore.get('token')?.value;

        // Fallback: read from Authorization header (useful for API testing & external integrations)
        if (!token && request) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Autentikasi diperlukan. Silakan login.' },
                { status: 401 }
            );
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json(
                { success: false, error: 'Session tidak valid atau sudah expired. Silakan login ulang.' },
                { status: 401 }
            );
        }

        // Role-based access control
        if (allowedRoles && allowedRoles.length > 0) {
            if (!allowedRoles.includes(decoded.role)) {
                return NextResponse.json(
                    { success: false, error: 'Akses ditolak. Anda tidak memiliki izin untuk aksi ini.' },
                    { status: 403 }
                );
            }
        }

        // Return the authenticated user
        return { user: decoded };
    } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan autentikasi.' },
            { status: 500 }
        );
    }
}

/**
 * Helper to check if the result of authenticateRequest is an error response.
 * Use this pattern:
 *   const auth = await authenticateRequest(request);
 *   if (isAuthError(auth)) return auth;
 *   const { user } = auth;
 */
export function isAuthError(result) {
    return result instanceof NextResponse;
}
