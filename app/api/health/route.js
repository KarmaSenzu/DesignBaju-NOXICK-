import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', database: 'disconnected', message: error.message },
      { status: 503 }
    );
  }
}
