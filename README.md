# NOXICK STREETWEAR DESIGN STUDIO — Marketplace Desain Digital

Aplikasi Next.js 16 + MySQL untuk jual-beli desain digital, custom order dengan sistem DP, dan dashboard manajer/developer milik **NOXICK STREETWEAR DESIGN STUDIO**.

> Panduan ini ditulis untuk **macOS** dari kondisi laptop yang **belum terinstall apa pun**. Ikuti urutannya dari atas ke bawah.

---

## 📋 Daftar Isi
1. [Prasyarat (install software dasar)](#1-prasyarat-install-software-dasar)
2. [Setup project](#2-setup-project)
3. [Migrasi & seed database](#3-migrasi--seed-database)
4. [Jalankan aplikasi](#4-jalankan-aplikasi)
5. [Akun default](#5-akun-default)
6. [Library yang dipakai](#6-library-yang-dipakai)
7. [Struktur project](#7-struktur-project)
8. [Pindah project ke laptop lain](#8-pindah-project-ke-laptop-lain)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prasyarat (install software dasar)

Buka **Terminal** (Cmd + Space, ketik "Terminal").

### 1.1. Install Homebrew (package manager untuk macOS)
Cek dulu apakah sudah terinstall:
```bash
brew --version
```
Kalau muncul error "command not found", install Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Setelah selesai, tutup terminal lalu buka lagi. Verifikasi:
```bash
brew --version
```

### 1.2. Install Node.js (wajib v18.18 atau lebih, disarankan v20 LTS)
```bash
brew install node@20
```
Lalu link supaya jadi default:
```bash
brew link --overwrite node@20
```
Verifikasi:
```bash
node -v   # contoh: v20.18.0
npm -v    # contoh: 10.x.x
```
> Alternatif: download installer di https://nodejs.org (pilih versi LTS).

### 1.3. Install MAMP (paling mudah untuk MySQL — sudah cocok dengan default project)
1. Download MAMP di: https://www.mamp.info/en/downloads/
2. Install seperti aplikasi macOS biasa (drag ke Applications).
3. Buka **MAMP** dari Launchpad → klik tombol **Start Servers**.
4. Tunggu sampai indikator MySQL hijau.

Default MAMP yang dipakai project ini:
- Host: `127.0.0.1`
- Port: `8889`
- User: `root`
- Password: `root`
- phpMyAdmin: http://localhost:8888/phpMyAdmin

> **Tidak mau pakai MAMP?** Lihat [bagian alternatif](#alternatif-tanpa-mamp) di Troubleshooting.

### 1.4. Install Git (opsional, kalau project di-clone dari repo)
```bash
brew install git
git --version
```

---

## 2. Setup project

### 2.1. Pindahkan / clone folder project
Salin folder project ke laptop baru, atau:
```bash
git clone <repo-url> "Noxick Streetwear"
```

Masuk ke folder project:
```bash
cd "Noxick Streetwear"
```

### 2.2. Install semua dependency
```bash
npm install
```
Proses ini akan men-download seluruh library (sekitar 300 MB) ke folder `node_modules/`. Tunggu sampai selesai (1–3 menit tergantung internet). Tidak perlu install library satu per satu — semuanya didefinisikan di `package.json`.

> **Penting**: jangan ikut bawa folder `node_modules/` dari laptop lama. Cukup `npm install` di laptop baru.

### 2.3. Buat file `.env.local`
Di root folder project, buat file bernama `.env.local`. Bisa pakai editor (VS Code) atau terminal:
```bash
touch .env.local
open -e .env.local
```

Isi dengan:
```env
# === Database (default MAMP) ===
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=designbaju

# === Security ===
JWT_SECRET=ganti_dengan_string_acak_minimal_32_karakter_random_aman

# === Fonnte WhatsApp API (opsional, kosongkan kalau tidak pakai) ===
FONNTE_TOKEN=your_fonnte_api_token
MANAGER_WA_NUMBER=6285156487577
NEXT_PUBLIC_MANAGER_WA_NUMBER=6285156487577

# === Midtrans Payment Gateway (opsional, isi kalau test pembayaran) ===
MIDTRANS_SERVER_KEY=SB-Mid-server-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXXXXXXXX
MIDTRANS_IS_PRODUCTION=false
```

> Kalau **bukan MAMP**, sesuaikan `DB_PORT` (MySQL standar = `3306`) dan `DB_PASSWORD` (sesuai instalasi kamu).

### 2.4. Pastikan folder storage ada
```bash
mkdir -p storage/designs
mkdir -p public/uploads/previews
mkdir -p public/uploads/designs
```

---

## 3. Migrasi & seed database

Pastikan **MAMP sudah Start Servers** dulu (indikator MySQL hijau).

> ⚠️ **Catatan penting**: file `scripts/migrate.js` dan `scripts/seed.js` saat ini **hardcode** kredensial DB ke MAMP (`127.0.0.1:8889 root/root`). Kalau MySQL kamu beda, edit kedua file di bagian atas:
> ```js
> host: '127.0.0.1',
> port: 8889,         // ganti ke 3306 untuk MySQL standar
> user: 'root',
> password: 'root',   // sesuaikan password kamu
> ```

### 3.1. Jalankan migrasi (membuat database & tabel)
```bash
node scripts/migrate.js
```
Output yang benar:
```
✅ Connected to MAMP MySQL on port 8889
✅ Database "designbaju" created
✅ All tables created successfully

📋 Tables in designbaju:
   - categories
   - custom_orders
   - designs
   - order_items
   - orders
   - reviews
   - users

🎉 Migration completed!
```

Tabel yang dibuat: `users`, `categories`, `designs`, `orders`, `order_items`, `custom_orders`, `reviews`.

### 3.2. Jalankan seed (isi data awal)
```bash
node scripts/seed.js
```
Output yang benar:
```
🌱 Seeding database...
✅ Users seeded (password: password123)
✅ Categories seeded
✅ Designs seeded (12 designs)
✅ Product variants seeded (~30 colors)
✅ Orders seeded
✅ Custom orders seeded
✅ Reviews seeded
🎉 Database seeded successfully!
```

Seed akan membuat: 6 user (developer, manager, 4 user biasa), 4 kategori, 12 desain, banyak varian warna, contoh orders, custom orders, dan reviews.

### 3.3. Tabel tambahan dibuat otomatis saat aplikasi run
File `lib/db.js` punya fungsi `initDB()` yang akan otomatis membuat tabel berikut saat pertama kali ada API call:
- `purchases`
- `download_tokens`
- `notifications`
- `product_variants` (dengan kolom tambahan)

Plus `ALTER TABLE` untuk menambah kolom: `design_file` di `designs`, `notes/selected_color/selected_size` di `order_items`, `dp_amount/total_amount/remaining_amount/address/midtrans_dp_id/midtrans_full_id/phone/contact_info` di `custom_orders`.

**Tidak perlu run script terpisah** — cukup jalankan `npm run dev` dan akses 1 halaman, semua migrasi tambahan akan auto-apply.

### 3.4. (Opsional) Verifikasi via phpMyAdmin
Buka http://localhost:8888/phpMyAdmin → pilih database `designbaju` → cek tabel sudah ter-create dan terisi.

---

## 4. Jalankan aplikasi

### 4.1. Mode development
```bash
npm run dev
```
Buka browser ke: http://localhost:3000

### 4.2. Mode production (build dulu, lalu run)
```bash
npm run build
npm run start
```

### 4.3. Lint (cek error kode)
```bash
npm run lint
```

---

## 5. Akun default

Semua password: **`password123`**

| Role      | Email                     |
|-----------|---------------------------|
| Developer | `dev@designbaju.com`      |
| Manager   | `manager@designbaju.com`  |
| Manager   | `sarah@email.com`         |
| User      | `john@email.com`          |
| User      | `budi@email.com`          |
| User      | `rina@email.com`          |

Halaman penting:
- `/` — Halaman utama NOXICK STREETWEAR DESIGN STUDIO
- `/catalog` — Katalog desain
- `/login`, `/register` — Auth
- `/dashboard` — Dashboard user
- `/manager` — Panel manager
- `/admin` — Panel developer/admin

---

## 6. Library yang dipakai

Semua library berikut otomatis terinstall via `npm install` (kamu **tidak perlu** install satu per satu). Daftar ini hanya untuk referensi.

### Dependencies (runtime)
| Library | Versi | Fungsi |
|---|---|---|
| `next` | 16.1.6 | Framework React (App Router + API routes) |
| `react` | 19.2.3 | UI library |
| `react-dom` | 19.2.3 | DOM renderer untuk React |
| `mysql2` | ^3.20.0 | Driver MySQL (pakai connection pool) |
| `bcryptjs` | ^3.0.3 | Hash password |
| `jsonwebtoken` | ^9.0.3 | JWT token (auth & download token) |
| `cookie` | ^1.1.1 | Parse cookie HTTP |
| `midtrans-client` | ^1.4.3 | Payment gateway Midtrans |
| `lucide-react` | ^0.577.0 | Icon set |
| `@heroicons/react` | ^2.2.0 | Icon set tambahan |

### DevDependencies (cuma untuk build/lint)
| Library | Versi | Fungsi |
|---|---|---|
| `tailwindcss` | ^4 | CSS framework |
| `@tailwindcss/postcss` | ^4 | Plugin PostCSS untuk Tailwind v4 |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | 16.1.6 | Konfigurasi ESLint untuk Next.js |

> Tidak ada library yang harus di-install global. Cukup `npm install` di folder project.

---

## 7. Struktur project

```
Noxick Streetwear/
├── app/                    # Next.js App Router (halaman & API routes)
│   ├── api/                # REST API endpoints
│   ├── admin/              # Halaman admin/developer
│   ├── manager/            # Halaman manager
│   ├── dashboard/          # Halaman user dashboard
│   ├── catalog/            # Katalog desain
│   ├── cart/               # Keranjang belanja
│   ├── custom-order/       # Form pesan kustom
│   ├── login/, register/   # Auth pages
│   └── ...
├── components/             # React components reusable
├── lib/
│   ├── db.js               # MySQL connection pool + auto-migration
│   ├── auth.js             # JWT auth helper
│   ├── authMiddleware.js   # Middleware proteksi route
│   ├── security.js         # HMAC, rate limit, token generator
│   ├── cart.js             # Cart logic (localStorage)
│   ├── wishlist.js         # Wishlist logic
│   ├── midtrans.js         # Midtrans helper
│   ├── fonnte.js           # WhatsApp API helper
│   ├── theme.js, themeStyles.js  # Theme config
│   └── mockData.js         # Data fallback
├── scripts/
│   ├── migrate.js          # Bikin database & tabel utama
│   ├── seed.js             # Isi data awal
│   ├── schema.sql          # Referensi schema (manual)
│   └── migration-v2.sql    # Migrasi tambahan (manual, opsional)
├── storage/
│   └── designs/            # File desain premium (di luar public, aman)
├── public/
│   └── uploads/            # Preview & mockup yang di-upload manager
│       ├── previews/
│       └── designs/
├── .env.local              # Konfigurasi env (JANGAN commit)
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```

---

## 8. Pindah project ke laptop lain

Saat copy folder ke laptop baru, **bawa**:
- ✅ Semua source code (`app/`, `components/`, `lib/`, `scripts/`, dst.)
- ✅ Folder `storage/designs/` (berisi file desain asli yang sudah di-upload)
- ✅ Folder `public/uploads/` (gambar preview & mockup)
- ✅ File `.env.local` (atau buat ulang sesuai panduan)
- ✅ `package.json` & `package-lock.json`

**Jangan bawa**:
- ❌ `node_modules/` — generate ulang dengan `npm install`
- ❌ `.next/` — generate ulang otomatis saat `npm run dev` / `npm run build`

Database **tidak otomatis ikut**. Pilih salah satu:
- **Opsi A (cepat, data fresh)**: jalankan ulang `node scripts/migrate.js` + `node scripts/seed.js` di laptop baru.
- **Opsi B (bawa data lama)**: di laptop lama, export database via phpMyAdmin (Export → SQL). Di laptop baru, buat database `designbaju` lalu Import file SQL itu.

---

## 9. Troubleshooting

### "Database connection failed" / `ECONNREFUSED 127.0.0.1:8889`
- MAMP belum running. Buka MAMP → klik **Start Servers**.
- Atau port salah → periksa `DB_PORT` di `.env.local`.

### "Access denied for user 'root'@'localhost'"
- Password salah. MAMP default = `root`. MySQL standar biasanya kosong atau di-set saat install.
- Sesuaikan `DB_PASSWORD` di `.env.local` **dan** di `scripts/migrate.js` + `scripts/seed.js` (kedua file ini hardcode password).

### "Table 'designbaju.users' doesn't exist"
- Belum jalankan migrasi. Run:
  ```bash
  node scripts/migrate.js
  node scripts/seed.js
  ```

### Port 3000 sudah dipakai aplikasi lain
```bash
npm run dev -- -p 3001
```
Lalu buka http://localhost:3001

### `npm install` error karena Node.js terlalu lama
Cek versi: `node -v`. Harus ≥ v18.18. Update:
```bash
brew upgrade node@20
brew link --overwrite node@20
```

### Halaman tidak update setelah edit kode
Hapus cache Next.js:
```bash
rm -rf .next
npm run dev
```

### Error "Module not found" setelah pindah laptop
```bash
rm -rf node_modules package-lock.json
npm install
```

### MAMP MySQL tidak mau start (port 8889 conflict)
Buka MAMP → Preferences → Ports → Set MySQL Port ke angka lain (mis. `8890`) → Apply. Lalu update `DB_PORT` di `.env.local` dan di `scripts/migrate.js` + `scripts/seed.js`.

### Alternatif tanpa MAMP

#### Pakai MySQL via Homebrew
```bash
brew install mysql
brew services start mysql
mysql_secure_installation        # set password
mysql -u root -p                  # login, lalu:
CREATE DATABASE designbaju;
EXIT;
```
Update `.env.local`:
```env
DB_PORT=3306
DB_PASSWORD=<password_yang_kamu_set>
```
Update `scripts/migrate.js` & `scripts/seed.js` di bagian connection (port jadi `3306`, password disesuaikan).

#### Pakai XAMPP
- Install XAMPP for macOS dari https://www.apachefriends.org
- Start MySQL dari XAMPP Control Panel
- Default: port `3306`, user `root`, password kosong
- Update `.env.local`: `DB_PORT=3306`, `DB_PASSWORD=` (kosong)
- Update `scripts/migrate.js` & `scripts/seed.js` sesuai

---

## 🚀 Quick start (ringkasan untuk yang sudah biasa)

```bash
# Prasyarat: Node.js 20 + MAMP running
cd "Noxick Streetwear"
npm install
# buat .env.local sesuai panduan di atas
node scripts/migrate.js
node scripts/seed.js
npm run dev
# Buka http://localhost:3000
# Login: john@email.com / password123
```

---

## ✨ Fitur utama NOXICK STREETWEAR DESIGN STUDIO

- 🛒 Marketplace desain digital streetwear dengan kategori, tags, varian warna
- 💳 Cart & wishlist (localStorage)
- 🎨 Custom order dengan sistem DP & full payment via Midtrans
- 📱 Notifikasi WhatsApp via Fonnte
- 👤 Auth JWT + bcrypt + rate limiting
- 🔒 Secure file download dengan token HMAC-SHA256 (anti hotlink)
- 📊 Dashboard untuk user, manager, dan developer
- ⭐ Review & rating produk

---

© NOXICK STREETWEAR DESIGN STUDIO — Built by **Damarsams**
