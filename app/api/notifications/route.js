import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

// GET — Fetch notifications for the logged-in user
export async function GET(request) {
    try {
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === '1';

        // Users can only see their own notifications
        let sql = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [user.id];

        if (unreadOnly) {
            sql += ' AND is_read = FALSE';
        }

        sql += ' ORDER BY created_at DESC LIMIT 50';

        const notifications = await query(sql, params);
        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// POST — Create a new notification (internal use / manager)
export async function POST(request) {
    try {
        // Auth: only manager/developer can create notifications for other users
        const auth = await authenticateRequest(request, { allowedRoles: ['manager', 'developer'] });
        if (isAuthError(auth)) return auth;

        const body = await request.json();
        const { user_id, type, title, message, reference_id } = body;

        if (!user_id || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await query(
            'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
            [parseInt(user_id), type || 'system', title, message, reference_id || null]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create notification error:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}

// PUT — Mark notification(s) as read
export async function PUT(request) {
    try {
        const auth = await authenticateRequest(request);
        if (isAuthError(auth)) return auth;
        const { user } = auth;

        const body = await request.json();
        const { id, mark_all } = body;

        if (mark_all) {
            // Mark all notifications for the logged-in user as read
            await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [user.id]);
        } else if (id) {
            // Only mark if the notification belongs to the user
            await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [parseInt(id), user.id]);
        } else {
            return NextResponse.json({ error: 'Missing id or mark_all' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}
