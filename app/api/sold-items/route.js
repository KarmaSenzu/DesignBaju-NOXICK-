import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET — Return list of sold design IDs
// Since each design is limited to 1 purchase, any non-cancelled order marks it as sold
export async function GET() {
  try {
    const soldIds = new Set();

    try {
      // Any order that is NOT cancelled means the design is taken
      const dbItems = await query(`
        SELECT DISTINCT oi.design_id 
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.id 
        WHERE o.status NOT IN ('cancelled')
      `);
      for (const row of dbItems) {
        soldIds.add(row.design_id);
      }
    } catch (dbErr) {
      console.warn('DB sold check skipped:', dbErr.message);
    }

    return NextResponse.json({
      sold_ids: [...soldIds],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
