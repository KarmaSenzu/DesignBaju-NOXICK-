// Seed script - run with: node scripts/seed.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
    const pool = mysql.createPool({
        host: '127.0.0.1',
        port: 8889,
        user: 'root',
        password: 'root',
        database: 'designbaju',
    });

    console.log('🌱 Seeding database...');

    // Hash password
    const hash = await bcrypt.hash('password123', 10);

    // Seed users
    await pool.execute('DELETE FROM reviews');
    await pool.execute('DELETE FROM order_items');
    await pool.execute('DELETE FROM orders');
    await pool.execute('DELETE FROM custom_orders');
    await pool.execute('DELETE FROM product_variants');
    await pool.execute('DELETE FROM designs');
    await pool.execute('DELETE FROM categories');
    await pool.execute('DELETE FROM users');

    const users = [
        ['Admin Developer', 'dev@designbaju.com', hash, 'developer'],
        ['Design Manager', 'manager@designbaju.com', hash, 'manager'],
        ['John Customer', 'john@email.com', hash, 'user'],
        ['Sarah Designer', 'sarah@email.com', hash, 'manager'],
        ['Budi Santoso', 'budi@email.com', hash, 'user'],
        ['Rina Wati', 'rina@email.com', hash, 'user'],
    ];

    for (const u of users) {
        await pool.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', u);
    }
    console.log('✅ Users seeded (password: password123)');

    // Seed categories
    const categories = [
        ['Baju', '👕'],
        ['Celana', '👖'],
        ['Jaket & Sweater', '🧥'],
        ['1 Set', '👔'],
    ];

    for (const c of categories) {
        await pool.execute('INSERT INTO categories (name, icon) VALUES (?, ?)', c);
    }
    console.log('✅ Categories seeded');

    // Get category IDs
    const [cats] = await pool.execute('SELECT id, name FROM categories');
    const catMap = {};
    cats.forEach(c => { catMap[c.name] = c.id; });

    // Seed designs
    const designs = [
        ['Urban Street Vibes', 'Desain kaos bergaya urban street art dengan kombinasi warna bold dan elemen graffiti modern.', 150000, catMap['Baju'], '["streetwear","urban","graffiti","bold"]', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', '["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"]', '["PSD","PNG","SVG"]', 142, 4.8, 28],
        ['Minimalist Nature', 'Desain minimalis bertema alam dengan garis-garis halus dan palet warna earth tone.', 120000, catMap['Baju'], '["minimalist","nature","earth","clean"]', 'https://images.unsplash.com/photo-1503342217505-b0a15ec515c7?w=600&q=80', '["https://images.unsplash.com/photo-1503342217505-b0a15ec515c7?w=800&q=80"]', '["PSD","AI","PNG"]', 98, 4.6, 15],
        ['Retro Wave Collection', 'Koleksi desain bergaya retro synthwave dengan gradien neon dan elemen 80s.', 200000, catMap['Baju'], '["retro","synthwave","neon","80s"]', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80', '["https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80"]', '["PSD","PNG","SVG","AI"]', 215, 4.9, 42],
        ['Tote Bag Floral', 'Desain tas tote bag dengan motif bunga tropis yang elegan.', 100000, catMap['Baju'], '["floral","tropical","tote bag","pattern"]', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80', '["https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80"]', '["PSD","PNG"]', 76, 4.5, 12],
        ['Snapback Cap Logo', 'Desain logo untuk topi snapback dengan style sporty dan modern.', 85000, catMap['Jaket & Sweater'], '["snapback","logo","sporty","cap"]', 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&q=80', '["https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=800&q=80"]', '["PSD","AI","SVG"]', 54, 4.3, 8],
        ['Coffee Mug Typography', 'Desain gelas kopi dengan typography kreatif dan quotes inspiratif.', 95000, catMap['Baju'], '["mug","typography","coffee","quotes"]', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80', '["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80"]', '["PSD","PNG","SVG"]', 112, 4.7, 22],
        ['Holographic Sticker Pack', 'Pack sticker holographic dengan 20 desain unik bertema space dan futuristik.', 75000, catMap['Baju'], '["holographic","sticker","space","futuristic"]', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', '["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80"]', '["PSD","PNG","SVG"]', 189, 4.9, 35],
        ['Movie Poster Cinematic', 'Template poster bergaya sinematik Hollywood.', 180000, catMap['1 Set'], '["poster","cinematic","movie","template"]', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80', '["https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80"]', '["PSD","AI"]', 67, 4.4, 11],
        ['Japanese Wave Art', 'Desain seni Jepang dengan motif ombak klasik yang dipadukan sentuhan modern.', 165000, catMap['Baju'], '["japanese","wave","art","traditional"]', 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&q=80', '["https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=800&q=80"]', '["PSD","PNG","AI"]', 134, 4.8, 26],
        ['Geometric Abstract', 'Desain abstrak geometris dengan warna-warna vibrant.', 130000, catMap['1 Set'], '["geometric","abstract","colorful","pattern"]', 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=600&q=80', '["https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&q=80"]', '["PSD","SVG","PNG"]', 91, 4.6, 18],
        ['Eco Friendly Badge', 'Koleksi badge dan emblem bertema ramah lingkungan.', 60000, catMap['Baju'], '["eco","badge","emblem","green"]', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80', '["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80"]', '["SVG","PNG","AI"]', 203, 4.7, 31],
        ['Vintage Travel Poster', 'Desain poster travel bergaya vintage tahun 50-an.', 145000, catMap['1 Set'], '["vintage","travel","retro","illustration"]', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', '["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"]', '["PSD","AI","PNG"]', 88, 4.5, 14],
    ];

    for (const d of designs) {
        await pool.execute(
            'INSERT INTO designs (title, description, price, category_id, tags, preview_image, mockup_images, file_formats, downloads, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            d
        );
    }
    console.log('✅ Designs seeded (12 designs)');

    // Seed product variants (colors) — keyed by design title so it's robust to ID auto-increment
    const [seededDesigns] = await pool.execute('SELECT id, title FROM designs');
    const designByTitle = {};
    seededDesigns.forEach(d => { designByTitle[d.title] = d.id; });

    const variantsByTitle = {
        'Urban Street Vibes': [
            ['Hitam', '#1a1a2e', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80', 1, true],
            ['Putih', '#F5F5F5', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', 2, false],
            ['Maroon', '#800000', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', 3, false],
            ['Navy', '#1B2A4A', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80', 4, false],
        ],
        'Minimalist Nature': [
            ['Sage Green', '#9CAF88', 'https://images.unsplash.com/photo-1503342217505-b0a15ec515c7?w=600&q=80', 1, true],
            ['Cream', '#F5F0E1', 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80', 2, false],
            ['Dusty Pink', '#D4A5A5', 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600&q=80', 3, false],
        ],
        'Retro Wave Collection': [
            ['Hitam', '#0D0D0D', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80', 1, true],
            ['Deep Purple', '#2D1B69', 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=600&q=80', 2, false],
            ['Neon Pink', '#FF6EC7', 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80', 3, false],
        ],
        'Tote Bag Floral': [
            ['Cream', '#F5F0E1', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80', 1, true],
            ['Khaki', '#C8B68B', 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600&q=80', 2, false],
        ],
        'Snapback Cap Logo': [
            ['Hitam', '#0A0A0A', 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&q=80', 1, true],
            ['Putih', '#FAFAFA', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', 2, false],
            ['Merah', '#DC2626', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', 3, false],
        ],
        'Coffee Mug Typography': [
            ['Putih', '#FAFAFA', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80', 1, true],
            ['Hitam', '#1a1a2e', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80', 2, false],
        ],
        'Holographic Sticker Pack': [
            ['Holographic', '#E0B0FF', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', 1, true],
            ['Gold Foil', '#FFD700', 'https://images.unsplash.com/photo-1572566929650-3301a5732f52?w=600&q=80', 2, false],
        ],
        'Japanese Wave Art': [
            ['Indigo', '#3F51B5', 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&q=80', 1, true],
            ['Putih', '#FAFAFA', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', 2, false],
            ['Abu-abu', '#757575', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80', 3, false],
        ],
        'Geometric Abstract': [
            ['Vibrant', '#FF6B6B', 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=600&q=80', 1, true],
            ['Pastel', '#A8DADC', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80', 2, false],
        ],
        'Eco Friendly Badge': [
            ['Hijau', '#10B981', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80', 1, true],
            ['Earth', '#8B6F47', 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600&q=80', 2, false],
        ],
        'Vintage Travel Poster': [
            ['Sepia', '#C8956D', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', 1, true],
            ['Biru Klasik', '#3B5998', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80', 2, false],
        ],
        'Movie Poster Cinematic': [
            ['Klasik', '#1a1a2e', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80', 1, true],
        ],
    };

    let variantCount = 0;
    for (const [title, vlist] of Object.entries(variantsByTitle)) {
        const productId = designByTitle[title];
        if (!productId) continue;
        for (const v of vlist) {
            await pool.execute(
                'INSERT INTO product_variants (product_id, color_name, color_code, image_url, sort_order, is_default) VALUES (?, ?, ?, ?, ?, ?)',
                [productId, v[0], v[1], v[2], v[3], v[4]]
            );
            variantCount++;
        }
    }
    console.log(`✅ Product variants seeded (${variantCount} colors)`);

    // Seed orders
    const [usersResult] = await pool.execute('SELECT id, name FROM users WHERE role = "user"');
    const john = usersResult.find(u => u.name === 'John Customer');
    const budi = usersResult.find(u => u.name === 'Budi Santoso');
    const rina = usersResult.find(u => u.name === 'Rina Wati');

    if (john && budi && rina) {
        await pool.execute('INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)', ['ORD-001', john.id, 225000, 'completed', 'Bank Transfer']);
        await pool.execute('INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)', ['ORD-002', budi.id, 200000, 'paid', 'E-Wallet']);
        await pool.execute('INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)', ['ORD-003', rina.id, 320000, 'processing', 'Credit Card']);
        await pool.execute('INSERT INTO orders (id, user_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?)', ['ORD-004', john.id, 180000, 'pending', null]);

        // Order items
        const [designsResult] = await pool.execute('SELECT id, title, price FROM designs');
        const getDesign = (title) => designsResult.find(d => d.title.includes(title));

        const d1 = getDesign('Urban');
        const d7 = getDesign('Holographic');
        const d3 = getDesign('Retro');
        const d6 = getDesign('Coffee');
        const d11 = getDesign('Eco');
        const d9 = getDesign('Japanese');
        const d8 = getDesign('Movie');

        if (d1) await pool.execute('INSERT INTO order_items (order_id, design_id, title, price) VALUES (?, ?, ?, ?)', ['ORD-001', d1.id, d1.title, d1.price]);
        if (d7) await pool.execute('INSERT INTO order_items (order_id, design_id, title, price) VALUES (?, ?, ?, ?)', ['ORD-001', d7.id, d7.title, d7.price]);
        if (d3) await pool.execute('INSERT INTO order_items (order_id, design_id, title, price) VALUES (?, ?, ?, ?)', ['ORD-002', d3.id, d3.title, d3.price]);
        if (d6) await pool.execute('INSERT INTO order_items (order_id, design_id, title, price) VALUES (?, ?, ?, ?)', ['ORD-003', d6.id, d6.title, d6.price]);
        if (d11) await pool.execute('INSERT INTO order_items (order_id, design_id, title, price) VALUES (?, ?, ?, ?)', ['ORD-003', d11.id, d11.title, d11.price]);
        if (d9) await pool.execute('INSERT INTO order_items (order_id, design_id, title, price) VALUES (?, ?, ?, ?)', ['ORD-003', d9.id, d9.title, d9.price]);
        if (d8) await pool.execute('INSERT INTO order_items (order_id, design_id, title, price) VALUES (?, ?, ?, ?)', ['ORD-004', d8.id, d8.title, d8.price]);

        console.log('✅ Orders seeded');

        // Custom orders
        await pool.execute('INSERT INTO custom_orders (id, user_id, product_type, description, budget, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['CUST-001', john.id, 'Kaos', 'Desain kaos untuk event band metal lokal. Tema gothic dengan skull dan roses.', 500000, '2026-03-25', 'processing']);
        await pool.execute('INSERT INTO custom_orders (id, user_id, product_type, description, budget, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['CUST-002', budi.id, 'Logo & Branding', 'Logo untuk coffee shop baru. Konsep minimalis, modern.', 750000, '2026-03-30', 'pending']);
        await pool.execute('INSERT INTO custom_orders (id, user_id, product_type, description, budget, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['CUST-003', rina.id, 'Poster', 'Poster untuk acara music festival. Ukuran A2, full color.', 350000, '2026-04-05', 'completed']);

        console.log('✅ Custom orders seeded');
    }

    // Reviews
    const [allDesigns] = await pool.execute('SELECT id, title FROM designs');
    const getD = (t) => allDesigns.find(d => d.title.includes(t));

    const reviewData = [
        [getD('Urban')?.id, 'Andi P.', 5, 'File kualitasnya luar biasa, detail banget!'],
        [getD('Urban')?.id, 'Budi S.', 5, 'Langsung bisa dipakai, sangat puas.'],
        [getD('Urban')?.id, 'Maya S.', 4, 'Bagus, tapi wish ada lebih banyak variasi warna.'],
        [getD('Retro')?.id, 'Reza F.', 5, 'Retro vibes-nya kena banget! Love it.'],
        [getD('Retro')?.id, 'Dimas A.', 5, 'Best purchase ever, file lengkap dan rapi.'],
        [getD('Holographic')?.id, 'Lisa P.', 5, 'Sticker pack terbaik! 20 desain semua keren.'],
        [getD('Holographic')?.id, 'Siti N.', 5, 'Holographic effectnya cakep banget.'],
        [getD('Japanese')?.id, 'Andi P.', 5, 'Japanese art nya autentik, sangat detail.'],
    ];

    for (const r of reviewData) {
        if (r[0]) {
            await pool.execute('INSERT INTO reviews (design_id, user_name, rating, text) VALUES (?, ?, ?, ?)', r);
        }
    }
    console.log('✅ Reviews seeded');

    console.log('\n🎉 Database seeded successfully!');
    console.log('📋 Login credentials:');
    console.log('   Developer: dev@designbaju.com / password123');
    console.log('   Manager: manager@designbaju.com / password123');
    console.log('   User: john@email.com / password123');

    await pool.end();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
