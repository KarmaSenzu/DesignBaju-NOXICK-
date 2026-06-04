import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, isAuthError } from '@/lib/authMiddleware';

/**
 * GET /api/reseed-categories
 * Re-seeds the categories table with the new 4 categories.
 * Updates existing designs to map to new categories.
 */
export async function GET(request) {
    const results = [];

    try {
        const auth = await authenticateRequest(request, { allowedRoles: ['developer'] });
        if (isAuthError(auth)) return auth;

        // Step 1: Get old category IDs for mapping
        const oldCats = await query('SELECT id, name FROM categories');
        const oldMap = {};
        oldCats.forEach(c => { oldMap[c.name] = c.id; });
        results.push(`Old categories: ${oldCats.map(c => c.name).join(', ')}`);

        // Step 2: Insert new categories (if not exist)
        const newCategories = [
            ['Baju', '👕'],
            ['Celana', '👖'],
            ['Jaket & Sweater', '🧥'],
            ['1 Set', '👔'],
        ];

        const newMap = {};
        for (const [name, icon] of newCategories) {
            try {
                const existing = await query('SELECT id FROM categories WHERE name = ?', [name]);
                if (existing.length > 0) {
                    newMap[name] = existing[0].id;
                } else {
                    const result = await query('INSERT INTO categories (name, icon) VALUES (?, ?)', [name, icon]);
                    newMap[name] = result.insertId;
                }
                results.push(`✅ Category "${name}" → ID=${newMap[name]}`);
            } catch (e) {
                results.push(`⚠️ Category "${name}": ${e.message}`);
            }
        }

        // Step 3: Map old categories to new ones
        const mapping = {
            'Kaos': 'Baju',
            'Tas': 'Baju',
            'Topi': 'Jaket & Sweater',
            'Gelas': 'Baju',
            'Sticker': 'Baju',
            'Poster': '1 Set',
            'Merchandise': '1 Set',
        };

        // Step 4: Update designs to use new category IDs
        for (const [oldName, newName] of Object.entries(mapping)) {
            if (oldMap[oldName] && newMap[newName]) {
                const updated = await query(
                    'UPDATE designs SET category_id = ? WHERE category_id = ?',
                    [newMap[newName], oldMap[oldName]]
                );
                results.push(`📦 Mapped "${oldName}" → "${newName}": ${updated.affectedRows || 0} designs updated`);
            }
        }

        // Step 5: Delete old categories that are no longer needed
        const oldNames = ['Kaos', 'Tas', 'Topi', 'Gelas', 'Sticker', 'Poster', 'Merchandise'];
        for (const name of oldNames) {
            try {
                await query('DELETE FROM categories WHERE name = ?', [name]);
                results.push(`🗑️ Deleted old category "${name}"`);
            } catch (e) {
                results.push(`⚠️ Could not delete "${name}": ${e.message}`);
            }
        }

        // Step 6: Verify final state
        const finalCats = await query('SELECT id, name, icon FROM categories ORDER BY id');
        const designCount = await query('SELECT category_id, COUNT(*) as count FROM designs GROUP BY category_id');

        return NextResponse.json({
            success: true,
            categories: finalCats,
            design_counts: designCount,
            log: results,
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message,
            log: results,
        }, { status: 500 });
    }
}
