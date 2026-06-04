import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

export async function GET(request) {
    try {
        // Auth: only manager/developer can list all users
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const users = await query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
        return NextResponse.json(users.map(u => ({
            ...u,
            created_at: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : null,
        })));
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        // Auth: only developer can change user roles
        const auth = await authenticateRequest(request, { allowedRoles: ['developer'] });
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { id, role } = body;

        if (!id || !role) {
            return NextResponse.json({ error: 'Missing id or role' }, { status: 400 });
        }

        const validRoles = ['user', 'manager', 'developer'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        await query('UPDATE users SET role = ? WHERE id = ?', [role, parseInt(id)]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        // Auth: only developer can delete users
        const auth = await authenticateRequest(request, { allowedRoles: ['developer'] });
        if (isAuthError(auth)) return auth;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
        }

        // Prevent self-deletion
        const { user } = auth;
        if (parseInt(id) === user.id) {
            return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
        }

        await query('DELETE FROM users WHERE id = ?', [parseInt(id)]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
