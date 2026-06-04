import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { rateLimitCheck } from '@/lib/security';

export async function POST(request) {
    try {
        // Rate limiting: 5 login attempts per minute per IP
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        if (!rateLimitCheck(ip, 'login', 5, 60000)) {
            return NextResponse.json(
                { success: false, error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.' },
                { status: 429 }
            );
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email dan password harus diisi' }, { status: 400 });
        }

        const users = await query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return NextResponse.json({ success: false, error: 'Email atau password salah' }, { status: 401 });
        }

        const user = users[0];
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return NextResponse.json({ success: false, error: 'Email atau password salah' }, { status: 401 });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        const response = NextResponse.json({
            success: true,
            user: userWithoutPassword,
            token,
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
