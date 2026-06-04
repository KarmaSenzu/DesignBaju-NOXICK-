/**
 * ============================================================
 * TEST SCENARIO: End-to-End Purchase Flow
 * ============================================================
 * 
 * Skenario:
 * 1. Admin/Manager login → buat 2 desain baju dengan variant warna
 * 2. User A membeli Desain 1 (warna Hitam)
 * 3. User B membeli Desain 1 (warna Putih) 
 * 4. User C membeli Desain 2 (kedua warna: Merah & Biru)
 * 5. Verifikasi semua data di database
 * 
 * Jalankan: node scripts/test-scenario.js
 * Pastikan: MySQL/MAMP running + Next.js dev server running (npm run dev)
 * ============================================================
 */

const BASE_URL = 'http://localhost:3000';

// ─── Helpers ────────────────────────────────────────────────

function extractCookie(headers) {
    const setCookie = headers.get('set-cookie') || '';
    const match = setCookie.match(/token=([^;]+)/);
    return match ? match[1] : null;
}

async function apiCall(method, path, body = null, token = null) {
    const url = `${BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        // Send token via both Cookie and Authorization header for maximum compatibility
        headers['Cookie'] = `token=${token}`;
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers, redirect: 'manual' };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        const text = await res.text();
        data = { raw: text };
    }
    
    return { 
        status: res.status, 
        data, 
        ok: res.ok,
        cookie: extractCookie(res.headers),
        headers: res.headers
    };
}

function log(emoji, msg) {
    console.log(`${emoji}  ${msg}`);
}

function logError(msg, data) {
    console.error(`❌  ${msg}`);
    if (data) console.error('   Response:', JSON.stringify(data, null, 2));
}

function assert(condition, msg) {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${msg}`);
    }
}

// ─── Test State ─────────────────────────────────────────────

const state = {
    managerToken: null,
    design1Id: null,
    design2Id: null,
    design1Variants: [],
    design2Variants: [],
    users: [],       // [{ name, email, token, id }]
    orders: [],      // [{ orderId, userId, items }]
    purchases: [],
};

// ─── Step 0: Check Server & DB ──────────────────────────────

async function step0_checkServer() {
    log('🔍', 'Mengecek koneksi ke server...');
    try {
        const res = await fetch(`${BASE_URL}/api/categories`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
            log('✅', `Server aktif! ${data.length} kategori ditemukan di database.`);
            if (data.length === 0) {
                log('⚠️', 'Database kosong. Jalankan "node scripts/migrate.js && node scripts/seed.js" terlebih dahulu.');
                process.exit(1);
            }
            return data;
        } else {
            logError('Server merespon tapi data tidak valid', data);
            process.exit(1);
        }
    } catch (err) {
        logError(`Tidak bisa terhubung ke ${BASE_URL}. Pastikan "npm run dev" sudah berjalan.`);
        console.error('   Error:', err.message);
        process.exit(1);
    }
}

// ─── Step 1: Login sebagai Manager ──────────────────────────

async function step1_loginManager() {
    log('🔐', 'Login sebagai Manager (manager@designbaju.com)...');
    
    const res = await apiCall('POST', '/api/auth/login', {
        email: 'manager@designbaju.com',
        password: 'password123'
    });

    if (!res.ok) {
        logError('Login manager gagal', res.data);
        process.exit(1);
    }

    state.managerToken = res.cookie || res.data.token;
    log('✅', `Manager login berhasil: ${res.data.user.name} (role: ${res.data.user.role})`);
}

// ─── Step 2: Buat 2 Desain Baju ─────────────────────────────

async function step2_createDesigns(categories) {
    log('🎨', 'Membuat 2 desain baju untuk testing...');
    
    // Cari category_id untuk "Kaos"
    const bajuCategory = categories.find(c => c.name === 'Baju');
    if (!bajuCategory) {
        logError('Kategori "Baju" tidak ditemukan di database');
        process.exit(1);
    }
    const categoryId = bajuCategory.id;

    // Desain 1: "Test Kaos Streetwear"
    const res1 = await apiCall('POST', '/api/designs', {
        title: 'TEST - Kaos Streetwear Edition',
        description: 'Desain kaos streetwear untuk pengujian. Tersedia dalam warna Hitam dan Putih.',
        price: 175000,
        category_id: categoryId,
        tags: ['test', 'streetwear', 'kaos'],
        file_formats: ['PSD', 'PNG', 'SVG'],
        preview_image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80'
    }, state.managerToken);

    if (!res1.ok) {
        logError('Gagal membuat Desain 1', res1.data);
        process.exit(1);
    }
    state.design1Id = res1.data.id;
    log('✅', `Desain 1 dibuat: ID=${state.design1Id} "TEST - Kaos Streetwear Edition" (Rp 175.000)`);

    // Desain 2: "Test Kaos Minimalist"
    const res2 = await apiCall('POST', '/api/designs', {
        title: 'TEST - Kaos Minimalist Art',
        description: 'Desain kaos minimalist untuk pengujian. Tersedia dalam warna Merah dan Biru.',
        price: 150000,
        category_id: categoryId,
        tags: ['test', 'minimalist', 'kaos'],
        file_formats: ['PSD', 'AI', 'PNG'],
        preview_image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'
    }, state.managerToken);

    if (!res2.ok) {
        logError('Gagal membuat Desain 2', res2.data);
        process.exit(1);
    }
    state.design2Id = res2.data.id;
    log('✅', `Desain 2 dibuat: ID=${state.design2Id} "TEST - Kaos Minimalist Art" (Rp 150.000)`);
}

// ─── Step 3: Tambah Variant Warna ────────────────────────────

async function step3_createVariants() {
    log('🎨', 'Menambahkan variant warna untuk kedua desain...');

    // Desain 1: Hitam & Putih
    const variants1 = [
        { product_id: state.design1Id, color_name: 'Hitam', color_code: '#1A1A2E', image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80' },
        { product_id: state.design1Id, color_name: 'Putih', color_code: '#F5F5F5', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
    ];

    for (const v of variants1) {
        const res = await apiCall('POST', '/api/variants', v, state.managerToken);
        if (!res.ok) {
            logError(`Gagal membuat variant ${v.color_name} untuk Desain 1`, res.data);
            process.exit(1);
        }
        state.design1Variants.push({ id: res.data.id, ...v });
        log('  ✅', `Desain 1 → Variant "${v.color_name}" (${v.color_code}) ID=${res.data.id}`);
    }

    // Desain 2: Merah & Biru
    const variants2 = [
        { product_id: state.design2Id, color_name: 'Merah', color_code: '#DC2626', image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80' },
        { product_id: state.design2Id, color_name: 'Biru', color_code: '#2563EB', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80' },
    ];

    for (const v of variants2) {
        const res = await apiCall('POST', '/api/variants', v, state.managerToken);
        if (!res.ok) {
            logError(`Gagal membuat variant ${v.color_name} untuk Desain 2`, res.data);
            process.exit(1);
        }
        state.design2Variants.push({ id: res.data.id, ...v });
        log('  ✅', `Desain 2 → Variant "${v.color_name}" (${v.color_code}) ID=${res.data.id}`);
    }

    // Verifikasi variants tersimpan
    const checkRes1 = await apiCall('GET', `/api/variants?product_id=${state.design1Id}`);
    const checkRes2 = await apiCall('GET', `/api/variants?product_id=${state.design2Id}`);
    
    log('✅', `Variant Desain 1: ${checkRes1.data.length} warna | Variant Desain 2: ${checkRes2.data.length} warna`);
}

// ─── Step 4: Register 3 User Test ────────────────────────────

async function step4_registerUsers() {
    log('👥', 'Mendaftarkan 3 user test...');

    const testUsers = [
        { name: 'Test User A', email: `testa_${Date.now()}@test.com`, password: 'test123456' },
        { name: 'Test User B', email: `testb_${Date.now()}@test.com`, password: 'test123456' },
        { name: 'Test User C', email: `testc_${Date.now()}@test.com`, password: 'test123456' },
    ];

    for (const u of testUsers) {
        const res = await apiCall('POST', '/api/auth/register', u);
        if (!res.ok) {
            logError(`Gagal register ${u.name}`, res.data);
            process.exit(1);
        }
        const token = res.cookie || res.data.token;
        state.users.push({ 
            name: u.name, 
            email: u.email, 
            token, 
            id: res.data.user.id 
        });
        log('  ✅', `${u.name} terdaftar: ID=${res.data.user.id}, email=${u.email}`);
    }
}

// ─── Step 5: User A beli Desain 1 (warna Hitam) ─────────────

async function step5_userA_buyDesign1() {
    const user = state.users[0]; // User A
    log('🛒', `${user.name} membeli Desain 1 (Kaos Streetwear - Hitam)...`);

    const res = await apiCall('POST', '/api/orders', {
        items: [{
            design_id: state.design1Id,
            title: 'TEST - Kaos Streetwear Edition',
            price: 175000,
            selected_color: 'Hitam',
            selected_size: 'L',
            notes: 'Tolong packing rapi ya'
        }],
        payment_method: 'Bank Transfer',
    }, user.token);

    if (!res.ok) {
        logError(`Order User A gagal`, res.data);
        console.error('   Status:', res.status);
        return false;
    }

    state.orders.push({
        orderId: res.data.order_id,
        userId: user.id,
        userName: user.name,
        items: [{ designId: state.design1Id, color: 'Hitam', size: 'L' }]
    });

    log('✅', `${user.name} berhasil order: ${res.data.order_id} (Desain 1 - Hitam, Size L)`);
    return true;
}

// ─── Step 6: User B beli Desain 1 (warna Putih) ─────────────

async function step6_userB_buyDesign1() {
    const user = state.users[1]; // User B
    log('🛒', `${user.name} membeli Desain 1 (Kaos Streetwear - Putih)...`);

    const res = await apiCall('POST', '/api/orders', {
        items: [{
            design_id: state.design1Id,
            title: 'TEST - Kaos Streetwear Edition',
            price: 175000,
            selected_color: 'Putih',
            selected_size: 'M',
            notes: null
        }],
        payment_method: 'E-Wallet',
    }, user.token);

    if (!res.ok) {
        logError(`Order User B gagal`, res.data);
        console.error('   Status:', res.status);
        return false;
    }

    state.orders.push({
        orderId: res.data.order_id,
        userId: user.id,
        userName: user.name,
        items: [{ designId: state.design1Id, color: 'Putih', size: 'M' }]
    });

    log('✅', `${user.name} berhasil order: ${res.data.order_id} (Desain 1 - Putih, Size M)`);
    return true;
}

// ─── Step 7: User C beli Desain 2 (kedua warna) ─────────────

async function step7_userC_buyDesign2() {
    const user = state.users[2]; // User C
    log('🛒', `${user.name} membeli Desain 2 (Kaos Minimalist - Merah & Biru)...`);

    const res = await apiCall('POST', '/api/orders', {
        items: [
            {
                design_id: state.design2Id,
                title: 'TEST - Kaos Minimalist Art (Merah)',
                price: 150000,
                selected_color: 'Merah',
                selected_size: 'XL',
                notes: 'Warna merah yang terang ya'
            },
            {
                design_id: state.design2Id,
                title: 'TEST - Kaos Minimalist Art (Biru)',
                price: 150000,
                selected_color: 'Biru',
                selected_size: 'L',
                notes: 'Biru navy'
            }
        ],
        payment_method: 'Credit Card',
    }, user.token);

    if (!res.ok) {
        logError(`Order User C gagal`, res.data);
        console.error('   Status:', res.status);
        return false;
    }

    state.orders.push({
        orderId: res.data.order_id,
        userId: user.id,
        userName: user.name,
        items: [
            { designId: state.design2Id, color: 'Merah', size: 'XL' },
            { designId: state.design2Id, color: 'Biru', size: 'L' }
        ]
    });

    log('✅', `${user.name} berhasil order: ${res.data.order_id} (Desain 2 - Merah XL + Biru L)`);
    return true;
}

// ─── Step 8: Verifikasi Orders dari sisi Manager ─────────────

async function step8_verifyOrders() {
    log('🔍', 'Verifikasi orders dari sisi Manager...');

    const res = await apiCall('GET', '/api/orders', null, state.managerToken);
    if (!res.ok) {
        logError('Gagal fetch orders sebagai manager', res.data);
        return false;
    }

    const allOrders = res.data;
    log('📋', `Total orders di database: ${allOrders.length}`);

    // Cek setiap order yang kita buat
    let allGood = true;
    for (const expected of state.orders) {
        const found = allOrders.find(o => o.id === expected.orderId);
        if (!found) {
            logError(`Order ${expected.orderId} TIDAK DITEMUKAN di database!`);
            allGood = false;
            continue;
        }

        log('  📦', `Order ${found.id}: status=${found.status}, total=Rp ${Number(found.total_price).toLocaleString('id-ID')}, items=${found.items.length}`);
        
        // Cek items
        for (const item of found.items) {
            const colorInfo = item.selected_color ? ` (${item.selected_color})` : '';
            const sizeInfo = item.selected_size ? ` Size ${item.selected_size}` : '';
            const notesInfo = item.notes ? ` 📝 "${item.notes}"` : '';
            log('    🏷️', `${item.title} - Rp ${Number(item.price).toLocaleString('id-ID')}${colorInfo}${sizeInfo}${notesInfo}`);
        }

        // Verify status is 'pending' (not 'completed' since no payment webhook)
        if (found.status !== 'pending') {
            logError(`Order ${found.id} status seharusnya 'pending' tapi '${found.status}'`);
            allGood = false;
        }
    }

    return allGood;
}

// ─── Step 9: Verifikasi Purchases ────────────────────────────

async function step9_verifyPurchases() {
    log('🔍', 'Verifikasi purchases untuk setiap user...');

    let allGood = true;
    for (const user of state.users) {
        const res = await apiCall('GET', `/api/purchases?user_id=${user.id}`, null, user.token);
        if (!res.ok) {
            logError(`Gagal fetch purchases untuk ${user.name}`, res.data);
            allGood = false;
            continue;
        }

        const purchases = res.data;
        log('  👤', `${user.name}: ${purchases.length} purchase record(s)`);
        
        for (const p of purchases) {
            const tamperStatus = p.is_tampered ? '⚠️ TAMPERED' : '✅ VERIFIED';
            log('    🔐', `Token: ${p.purchase_token.substring(0, 16)}... | ${p.title} | Rp ${Number(p.price).toLocaleString('id-ID')} | ${tamperStatus}`);
            
            if (p.is_tampered) {
                logError(`Purchase ${p.purchase_token} INTEGRITY CHECK FAILED!`);
                allGood = false;
            }
        }
    }

    return allGood;
}

// ─── Step 10: Verifikasi Notifications untuk Manager ─────────

async function step10_verifyNotifications() {
    log('🔔', 'Verifikasi notifications untuk Manager...');

    const res = await apiCall('GET', '/api/notifications', null, state.managerToken);
    if (!res.ok) {
        logError('Gagal fetch notifications', res.data);
        return false;
    }

    const notifications = res.data;
    const orderNotifs = notifications.filter(n => n.type === 'order');
    log('✅', `Total notifications: ${notifications.length} (${orderNotifs.length} order notifications)`);
    
    for (const n of orderNotifs.slice(0, 5)) {
        log('  🔔', `[${n.type}] ${n.title} - ${n.is_read ? 'Read' : 'Unread'}`);
    }

    return true;
}

// ─── Step 11: Test User melihat order sendiri ────────────────

async function step11_verifyUserDashboard() {
    log('📊', 'Verifikasi setiap user hanya melihat order miliknya...');

    let allGood = true;
    for (let i = 0; i < state.users.length; i++) {
        const user = state.users[i];
        const expectedOrder = state.orders[i];

        const res = await apiCall('GET', '/api/orders', null, user.token);
        if (!res.ok) {
            logError(`Gagal fetch orders untuk ${user.name}`, res.data);
            allGood = false;
            continue;
        }

        const userOrders = res.data;
        // Filter only test orders
        const testOrders = userOrders.filter(o => state.orders.some(so => so.orderId === o.id));
        
        log('  👤', `${user.name}: melihat ${userOrders.length} total order(s), ${testOrders.length} test order(s)`);
        
        // Verify user can see their own order
        const ownOrder = userOrders.find(o => o.id === expectedOrder.orderId);
        if (!ownOrder) {
            logError(`${user.name} TIDAK BISA melihat order miliknya (${expectedOrder.orderId})`);
            allGood = false;
        } else {
            log('    ✅', `Order ${ownOrder.id} terlihat dengan ${ownOrder.items.length} item(s)`);
        }

        // Verify user CANNOT see other users' orders (role-based check)
        const otherOrders = state.orders.filter(o => o.userId !== user.id);
        for (const other of otherOrders) {
            const found = userOrders.find(o => o.id === other.orderId);
            if (found) {
                logError(`${user.name} BISA melihat order milik user lain (${other.orderId})! Security issue!`);
                allGood = false;
            }
        }
    }

    return allGood;
}

// ─── Step 12: Manager update order status ────────────────────

async function step12_managerUpdateStatus() {
    log('📝', 'Manager mengupdate status order ke "paid"...');

    let allGood = true;
    for (const order of state.orders) {
        const res = await apiCall('PUT', '/api/orders', {
            id: order.orderId,
            status: 'paid'
        }, state.managerToken);

        if (!res.ok) {
            logError(`Gagal update status order ${order.orderId}`, res.data);
            allGood = false;
            continue;
        }
        log('  ✅', `Order ${order.orderId} → status: paid`);
    }

    // Verify updated
    const verifyRes = await apiCall('GET', '/api/orders', null, state.managerToken);
    if (verifyRes.ok) {
        for (const order of state.orders) {
            const found = verifyRes.data.find(o => o.id === order.orderId);
            if (found && found.status === 'paid') {
                log('  ✅', `Verified: ${order.orderId} status = ${found.status}`);
            } else if (found) {
                logError(`Order ${order.orderId} status masih '${found.status}' bukan 'paid'`);
                allGood = false;
            }
        }
    }

    return allGood;
}

// ─── Step 13: Verifikasi Desain di Catalog ───────────────────

async function step13_verifyCatalog() {
    log('📚', 'Verifikasi desain test muncul di catalog...');

    const res = await apiCall('GET', '/api/designs');
    if (!res.ok) {
        logError('Gagal fetch designs', res.data);
        return false;
    }

    const designs = res.data;
    const testDesign1 = designs.find(d => d.id === state.design1Id);
    const testDesign2 = designs.find(d => d.id === state.design2Id);

    if (testDesign1) {
        log('  ✅', `Desain 1: "${testDesign1.title}" - Rp ${Number(testDesign1.price).toLocaleString('id-ID')} - Kategori: ${testDesign1.category_name}`);
    } else {
        logError(`Desain 1 (ID=${state.design1Id}) tidak ditemukan di catalog!`);
        return false;
    }

    if (testDesign2) {
        log('  ✅', `Desain 2: "${testDesign2.title}" - Rp ${Number(testDesign2.price).toLocaleString('id-ID')} - Kategori: ${testDesign2.category_name}`);
    } else {
        logError(`Desain 2 (ID=${state.design2Id}) tidak ditemukan di catalog!`);
        return false;
    }

    return true;
}

// ─── MAIN ────────────────────────────────────────────────────

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   🧪 TEST SCENARIO: End-to-End Purchase Flow           ║');
    console.log('║   Design Baju - Digital Design Marketplace              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    const results = {};
    const startTime = Date.now();

    try {
        // Phase 1: Setup
        console.log('━━━ PHASE 1: SETUP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const categories = await step0_checkServer();
        await step1_loginManager();
        await step2_createDesigns(categories);
        await step3_createVariants();
        results['Setup'] = '✅ PASS';
        console.log('');

        // Phase 2: User Registration
        console.log('━━━ PHASE 2: USER REGISTRATION ━━━━━━━━━━━━━━━━━━━━━━━━━');
        await step4_registerUsers();
        results['Registration'] = '✅ PASS';
        console.log('');

        // Phase 3: Purchases
        console.log('━━━ PHASE 3: PURCHASES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const r5 = await step5_userA_buyDesign1();
        const r6 = await step6_userB_buyDesign1();
        const r7 = await step7_userC_buyDesign2();
        results['User A Purchase'] = r5 ? '✅ PASS' : '❌ FAIL';
        results['User B Purchase'] = r6 ? '✅ PASS' : '❌ FAIL';
        results['User C Purchase'] = r7 ? '✅ PASS' : '❌ FAIL';
        console.log('');

        // Phase 4: Verification
        console.log('━━━ PHASE 4: VERIFICATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const r8 = await step8_verifyOrders();
        const r9 = await step9_verifyPurchases();
        const r10 = await step10_verifyNotifications();
        const r11 = await step11_verifyUserDashboard();
        results['Orders Verification'] = r8 ? '✅ PASS' : '❌ FAIL';
        results['Purchases Integrity'] = r9 ? '✅ PASS' : '❌ FAIL';
        results['Notifications'] = r10 ? '✅ PASS' : '❌ FAIL';
        results['User Isolation'] = r11 ? '✅ PASS' : '❌ FAIL';
        console.log('');

        // Phase 5: Manager Actions
        console.log('━━━ PHASE 5: MANAGER ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const r12 = await step12_managerUpdateStatus();
        const r13 = await step13_verifyCatalog();
        results['Manager Status Update'] = r12 ? '✅ PASS' : '❌ FAIL';
        results['Catalog Verification'] = r13 ? '✅ PASS' : '❌ FAIL';
        console.log('');

    } catch (err) {
        logError(`Test gagal dengan error: ${err.message}`);
        console.error(err.stack);
    }

    // ─── Summary ─────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   📊 TEST RESULTS SUMMARY                              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    
    const passed = Object.values(results).filter(r => r.includes('PASS')).length;
    const failed = Object.values(results).filter(r => r.includes('FAIL')).length;
    
    for (const [test, result] of Object.entries(results)) {
        console.log(`║  ${result} ${test.padEnd(45)}║`);
    }
    
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Total: ${passed} passed, ${failed} failed (${elapsed}s)`.padEnd(59) + '║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    // Print test data for reference
    console.log('📋 Test Data Reference:');
    console.log(`   Design 1 ID: ${state.design1Id}`);
    console.log(`   Design 2 ID: ${state.design2Id}`);
    for (const u of state.users) {
        console.log(`   ${u.name}: ID=${u.id}, email=${u.email}`);
    }
    for (const o of state.orders) {
        console.log(`   Order: ${o.orderId} by ${o.userName}`);
    }
    console.log('');

    if (failed > 0) {
        process.exit(1);
    }
}

main();
