import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { rateLimitCheck } from '@/lib/security';

export async function POST(request) {
    try {
        // Rate limiting: 3 registration attempts per 5 minutes per IP
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        if (!rateLimitCheck(ip, 'register', 3, 300000)) {
            return NextResponse.json(
                { success: false, error: 'Terlalu banyak percobaan registrasi. Silakan coba lagi dalam beberapa menit.' },
                { status: 429 }
            );
        }

        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ success: false, error: 'Semua field harus diisi' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ success: false, error: 'Password minimal 6 karakter' }, { status: 400 });
        }

        const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 409 });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = await query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, 'user']);

        const user = { id: result.insertId, name, email, role: 'user' };

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        const response = NextResponse.json({ success: true, user, token });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
