// Seed script: Upload all assets from Assets/ folder into database
// Run with: node scripts/seed-assets.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'Assets');
const PREVIEWS_DIR = path.join(PROJECT_ROOT, 'public', 'uploads', 'previews');
const DESIGNS_DIR = path.join(PROJECT_ROOT, 'storage', 'designs');

// Ensure directories exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Copy file and return the web-accessible path
function copyPreview(srcPath, prefix) {
    const ext = path.extname(srcPath);
    const safeName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const dest = path.join(PREVIEWS_DIR, safeName);
    fs.copyFileSync(srcPath, dest);
    return `/uploads/previews/${safeName}`;
}

function copyDesign(srcPath, prefix) {
    const ext = path.extname(srcPath);
    const safeName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const dest = path.join(DESIGNS_DIR, safeName);
    fs.copyFileSync(srcPath, dest);
    return `storage/designs/${safeName}`;
}

// Wait a bit to avoid timestamp collisions
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Product Definitions ────────────────────────────────────────

const products = [
    // ═══ TSHIRT ═══
    {
        category: 'Tshirt',
        folder: 'Tshirt/1',
        title: 'Noxick Street Tee - Flame Edition',
        description: 'Desain kaos streetwear bold dengan motif flame yang eye-catching. Tersedia dalam variant Black dan Red. File desain lengkap siap cetak.',
        price: 85000,
        tags: ['streetwear', 'tshirt', 'flame', 'bold', 'urban'],
        file_formats: ['PNG', 'PSD', 'AI'],
        images: ['BLACK.png', 'RED.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Black', color_code: '#1A1A1A', imageFile: 'BLACK.png', is_default: true },
            { color_name: 'Red', color_code: '#DC2626', imageFile: 'RED.png', is_default: false },
        ],
    },
    {
        category: 'Tshirt',
        folder: 'Tshirt/2',
        title: 'Noxick Urban Tee - Monochrome',
        description: 'Kaos dengan desain monochrome minimalis bergaya urban. Kontras hitam-putih yang timeless. Cocok untuk koleksi streetwear premium.',
        price: 95000,
        tags: ['streetwear', 'tshirt', 'monochrome', 'minimalis', 'urban'],
        file_formats: ['PNG', 'PSD', 'AI'],
        images: ['BLACK 2.png', 'WHITE.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Black', color_code: '#1A1A1A', imageFile: 'BLACK 2.png', is_default: true },
            { color_name: 'White', color_code: '#F8F8F8', imageFile: 'WHITE.png', is_default: false },
        ],
    },
    {
        category: 'Tshirt',
        folder: 'Tshirt/3',
        title: 'Noxick Tropical Tee - Vibrant Series',
        description: 'Desain kaos tropical dengan warna vibrant yang fresh. Pilihan Green dan Orange untuk tampilan yang standout. High-res print ready.',
        price: 120000,
        tags: ['streetwear', 'tshirt', 'tropical', 'vibrant', 'colorful'],
        file_formats: ['PNG', 'PSD', 'AI', 'SVG'],
        images: ['GREEN.png', 'ORANGE.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Green', color_code: '#16A34A', imageFile: 'GREEN.png', is_default: true },
            { color_name: 'Orange', color_code: '#EA580C', imageFile: 'ORANGE.png', is_default: false },
        ],
    },
    {
        category: 'Tshirt',
        folder: 'Tshirt/4',
        title: 'Noxick Ghost Tee - Transparent Edition',
        description: 'Desain kaos dengan latar transparan, siap untuk berbagai kebutuhan print dan mockup. Clean dan versatile.',
        price: 75000,
        tags: ['streetwear', 'tshirt', 'transparent', 'mockup', 'clean'],
        file_formats: ['PNG'],
        images: ['TRANSPARENT BG.png'],
        zip: 'TRANSPARENT BG.png.zip',
        variants: [],
    },
    {
        category: 'Tshirt',
        folder: 'Tshirt/5',
        title: 'Noxick Classic Tee - Essentials',
        description: 'Desain kaos klasik dari koleksi essential Noxick. Simple, clean, dan timeless. Cocok untuk daily wear.',
        price: 80000,
        tags: ['streetwear', 'tshirt', 'classic', 'essential', 'daily'],
        file_formats: ['PNG'],
        images: ['2 2.png'],
        zip: '2 2.png.zip',
        variants: [],
    },

    // ═══ HOODIE ═══
    {
        category: 'Hoodie',
        folder: 'Hodie/1',
        title: 'Noxick Street Hoodie - Front & Back',
        description: 'Hoodie streetwear premium dengan desain depan dan belakang. Full print design siap produksi. Statement piece untuk koleksi Anda.',
        price: 175000,
        tags: ['streetwear', 'hoodie', 'fullprint', 'premium', 'urban'],
        file_formats: ['PNG', 'PSD', 'AI'],
        images: ['Depan.png', 'Belakang.png'],
        zip: 'Arsip 2.zip',
        variants: [
            { color_name: 'Depan', color_code: '#6C3CE1', imageFile: 'Depan.png', is_default: true },
            { color_name: 'Belakang', color_code: '#4C1D95', imageFile: 'Belakang.png', is_default: false },
        ],
    },
    {
        category: 'Hoodie',
        folder: 'Hodie/2',
        title: 'Noxick Dark Hoodie - Dual Tone',
        description: 'Hoodie dengan pilihan warna Black dan Maroon yang elegan. Desain detail dan berkualitas tinggi untuk streetwear enthusiast.',
        price: 150000,
        tags: ['streetwear', 'hoodie', 'dark', 'maroon', 'elegant'],
        file_formats: ['PNG', 'PSD'],
        images: ['Black.png', 'Maron.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Black', color_code: '#1A1A1A', imageFile: 'Black.png', is_default: true },
            { color_name: 'Maroon', color_code: '#7F1D1D', imageFile: 'Maron.png', is_default: false },
        ],
    },
    {
        category: 'Hoodie',
        folder: 'Hodie/3',
        title: 'Noxick Fire Hoodie - Red & Black',
        description: 'Hoodie bold dengan kombinasi warna Hitam dan Merah yang striking. Desain berani untuk yang ingin tampil beda.',
        price: 135000,
        tags: ['streetwear', 'hoodie', 'fire', 'bold', 'red'],
        file_formats: ['PNG'],
        images: ['Hitam.png', 'Merah.png'],
        zip: null, // No zip for this one
        variants: [
            { color_name: 'Hitam', color_code: '#1A1A1A', imageFile: 'Hitam.png', is_default: true },
            { color_name: 'Merah', color_code: '#DC2626', imageFile: 'Merah.png', is_default: false },
        ],
    },
    {
        category: 'Hoodie',
        folder: 'Hodie/4',
        title: 'Noxick Reversible Hoodie - Inside Out',
        description: 'Hoodie reversible dengan desain dalam dan luar yang berbeda. Dua tampilan dalam satu produk. Konsep unik dan kreatif.',
        price: 200000,
        tags: ['streetwear', 'hoodie', 'reversible', 'creative', 'unique'],
        file_formats: ['PNG', 'PSD', 'AI'],
        images: ['Dalem.png', 'Luar.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Dalam', color_code: '#374151', imageFile: 'Dalem.png', is_default: true },
            { color_name: 'Luar', color_code: '#111827', imageFile: 'Luar.png', is_default: false },
        ],
    },
    {
        category: 'Hoodie',
        folder: 'Hodie/5',
        title: 'Noxick Premium Hoodie - Mockup Ready',
        description: 'Hoodie premium dengan mockup berkualitas tinggi. Siap untuk presentasi dan branding. Detail stitching dan material terlihat jelas.',
        price: 125000,
        tags: ['streetwear', 'hoodie', 'mockup', 'premium', 'presentation'],
        file_formats: ['PNG'],
        images: ['MOCKUP.png'],
        zip: 'MOCKUP.png.zip',
        variants: [],
    },

    // ═══ CELANA ═══
    {
        category: 'Celana',
        folder: 'Celana/1',
        title: 'Noxick Street Pants - Front & Back',
        description: 'Celana streetwear dengan desain depan dan belakang. Detail cargo pockets dan custom stitching. Ready to produce.',
        price: 145000,
        tags: ['streetwear', 'celana', 'cargo', 'pants', 'urban'],
        file_formats: ['PNG', 'PSD', 'AI'],
        images: ['Depan.png', 'belakang.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Depan', color_code: '#374151', imageFile: 'Depan.png', is_default: true },
            { color_name: 'Belakang', color_code: '#1F2937', imageFile: 'belakang.png', is_default: false },
        ],
    },
    {
        category: 'Celana',
        folder: 'Celana/2',
        title: 'Noxick Color Pants - Navy & Red',
        description: 'Celana dengan pilihan warna Navy dan Red yang bold. Desain sporty-street yang versatile. Cocok untuk outfit sehari-hari.',
        price: 160000,
        tags: ['streetwear', 'celana', 'navy', 'red', 'sporty'],
        file_formats: ['PNG', 'PSD'],
        images: ['NAVY F.png', 'RED F.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Navy', color_code: '#1E3A5F', imageFile: 'NAVY F.png', is_default: true },
            { color_name: 'Red', color_code: '#DC2626', imageFile: 'RED F.png', is_default: false },
        ],
    },
    {
        category: 'Celana',
        folder: 'Celana/3',
        title: 'Noxick Cargo Pants - Preview Mockup',
        description: 'Celana cargo dengan preview mockup yang detail. Tampilan realistis untuk presentasi produk. High resolution.',
        price: 110000,
        tags: ['streetwear', 'celana', 'cargo', 'mockup', 'preview'],
        file_formats: ['PNG'],
        images: ['PREVIEW MOCKUP 2.png'],
        zip: 'PREVIEW MOCKUP 2.png.zip',
        variants: [],
    },
    {
        category: 'Celana',
        folder: 'Celana/4',
        title: 'Noxick Jogger Pants - Street Edition',
        description: 'Jogger pants street edition dengan desain mockup premium. Siap untuk branding dan presentasi ke klien.',
        price: 100000,
        tags: ['streetwear', 'celana', 'jogger', 'mockup', 'street'],
        file_formats: ['PNG'],
        images: ['PREVIEW MOCKUP.png'],
        zip: 'PREVIEW MOCKUP.png.zip',
        variants: [],
    },

    // ═══ OUTFIT ONE SET ═══
    {
        category: 'Outfit One Set',
        folder: 'Outfit one Set/1',
        title: 'Noxick Full Set - Urban Collection Vol.1',
        description: 'Set lengkap outfit streetwear — tampak depan dan belakang dari dua angle. Koleksi urban premium dengan detail tinggi. Paket lengkap siap produksi.',
        price: 275000,
        tags: ['streetwear', 'outfit', 'set', 'urban', 'fullset', 'premium'],
        file_formats: ['PNG', 'PSD', 'AI'],
        images: ['Depan.png', 'depan .png', 'Belakang.png', 'Belakangg.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Depan A', color_code: '#6C3CE1', imageFile: 'Depan.png', is_default: true },
            { color_name: 'Depan B', color_code: '#8B5CF6', imageFile: 'depan .png', is_default: false },
            { color_name: 'Belakang A', color_code: '#4C1D95', imageFile: 'Belakang.png', is_default: false },
            { color_name: 'Belakang B', color_code: '#3B0764', imageFile: 'Belakangg.png', is_default: false },
        ],
    },
    {
        category: 'Outfit One Set',
        folder: 'Outfit one Set/2',
        title: 'Noxick Full Set - Urban Collection Vol.2',
        description: 'Set outfit streetwear volume 2 — tampilan lengkap dari berbagai angle. Desain lebih berani dan detail. Premium quality files.',
        price: 350000,
        tags: ['streetwear', 'outfit', 'set', 'urban', 'fullset', 'vol2'],
        file_formats: ['PNG', 'PSD', 'AI', 'SVG'],
        images: ['Depan.png', 'Depann.png', 'belakang.png', 'Belakangg.png'],
        zip: 'Arsip.zip',
        variants: [
            { color_name: 'Depan A', color_code: '#6C3CE1', imageFile: 'Depan.png', is_default: true },
            { color_name: 'Depan B', color_code: '#8B5CF6', imageFile: 'Depann.png', is_default: false },
            { color_name: 'Belakang A', color_code: '#4C1D95', imageFile: 'belakang.png', is_default: false },
            { color_name: 'Belakang B', color_code: '#3B0764', imageFile: 'Belakangg.png', is_default: false },
        ],
    },
];

// ─── Category map (will be filled from DB) ──────────────────

const CATEGORY_MAP = {};

async function ensureCategory(conn, name) {
    if (CATEGORY_MAP[name]) return CATEGORY_MAP[name];

    // Check if exists
    const [rows] = await conn.execute('SELECT id FROM categories WHERE name = ?', [name]);
    if (rows.length > 0) {
        CATEGORY_MAP[name] = rows[0].id;
        return rows[0].id;
    }

    // Create it
    const icons = { 'Tshirt': '👕', 'Hoodie': '🧥', 'Celana': '👖', 'Outfit One Set': '🎽' };
    const [result] = await conn.execute('INSERT INTO categories (name, icon) VALUES (?, ?)', [name, icons[name] || '🎨']);
    CATEGORY_MAP[name] = result.insertId;
    return result.insertId;
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
    ensureDir(PREVIEWS_DIR);
    ensureDir(DESIGNS_DIR);

    const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 8889,
        user: 'root',
        password: 'root',
        database: 'designbaju',
    });

    console.log('✅ Connected to MySQL');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const folderPath = path.join(ASSETS_DIR, p.folder);

        try {
            console.log(`\n📦 [${i + 1}/${products.length}] ${p.title}`);

            // 1. Ensure category
            const categoryId = await ensureCategory(conn, p.category);

            // 2. Copy images
            const imageUrls = [];
            for (const img of p.images) {
                const src = path.join(folderPath, img);
                if (!fs.existsSync(src)) {
                    console.log(`   ⚠️  Image not found: ${img}`);
                    continue;
                }
                const prefix = p.category.toLowerCase().replace(/\s+/g, '_');
                const url = copyPreview(src, prefix);
                imageUrls.push(url);
                console.log(`   📸 Copied: ${img} → ${url}`);
                await sleep(5); // avoid timestamp collision
            }

            if (imageUrls.length === 0) {
                console.log(`   ❌ No images found, skipping`);
                errorCount++;
                continue;
            }

            // 3. Copy design zip
            let designPath = null;
            if (p.zip) {
                const zipSrc = path.join(folderPath, p.zip);
                if (fs.existsSync(zipSrc)) {
                    const prefix = p.category.toLowerCase().replace(/\s+/g, '_');
                    designPath = copyDesign(zipSrc, prefix);
                    console.log(`   📁 Copied zip: ${p.zip} → ${designPath}`);
                } else {
                    console.log(`   ⚠️  Zip not found: ${p.zip}`);
                }
            }

            // 4. Insert design
            const previewImage = imageUrls[0];
            const tagsJson = JSON.stringify(p.tags);
            const formatsJson = JSON.stringify(p.file_formats);
            const mockupJson = JSON.stringify(imageUrls);

            const [result] = await conn.execute(
                `INSERT INTO designs (title, description, price, category_id, tags, preview_image, design_file, mockup_images, file_formats, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [p.title, p.description, p.price, categoryId, tagsJson, previewImage, designPath, mockupJson, formatsJson, 'Noxick Studio']
            );

            const designId = result.insertId;
            console.log(`   ✅ Design created: ID #${designId}`);

            // 5. Create variants
            if (p.variants.length > 0) {
                for (let vi = 0; vi < p.variants.length; vi++) {
                    const v = p.variants[vi];
                    // Find the corresponding image URL
                    const imgIdx = p.images.indexOf(v.imageFile);
                    const varImageUrl = imgIdx >= 0 ? imageUrls[imgIdx] : imageUrls[0];

                    await conn.execute(
                        `INSERT INTO product_variants (product_id, color_name, color_code, image_url, gallery_images, sort_order, is_default)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [designId, v.color_name, v.color_code, varImageUrl, '[]', vi, v.is_default ? 1 : 0]
                    );
                    console.log(`   🎨 Variant: ${v.color_name} (${v.color_code})`);
                }
            }

            successCount++;
        } catch (err) {
            console.error(`   ❌ Error: ${err.message}`);
            errorCount++;
        }
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🎉 Seeding completed!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`${'═'.repeat(50)}`);

    await conn.end();
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
