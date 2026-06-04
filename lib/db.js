import mysql from 'mysql2/promise';

let pool = null;
let isInitialized = false;

export function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 8889,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'designbaju',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 5000,
        });
    }
    return pool;
}

async function initDB() {
    if (isInitialized) return;
    try {
        const pool = getPool();
        
        // Ensure designs table has design_file column
        try {
            await pool.query('ALTER TABLE designs ADD COLUMN design_file VARCHAR(500) DEFAULT NULL;');
        } catch (e) {
            // Ignore error if column already exists (ER_DUP_FIELDNAME)
        }

        // Create purchases table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchases (
              id INT AUTO_INCREMENT PRIMARY KEY,
              purchase_token VARCHAR(64) UNIQUE NOT NULL,
              order_id VARCHAR(50) NOT NULL,
              user_id INT NOT NULL,
              design_id INT NOT NULL,
              price INT NOT NULL,
              integrity_hash VARCHAR(128) NOT NULL,
              purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create download_tokens table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS download_tokens (
              id INT AUTO_INCREMENT PRIMARY KEY,
              token VARCHAR(64) UNIQUE NOT NULL,
              purchase_id INT NOT NULL,
              user_id INT NOT NULL,
              design_id INT NOT NULL,
              ip_address VARCHAR(45),
              used BOOLEAN DEFAULT FALSE,
              expires_at DATETIME NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create notifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              type ENUM('order', 'custom_order', 'payment', 'system') DEFAULT 'system',
              title VARCHAR(200) NOT NULL,
              message TEXT NOT NULL,
              is_read BOOLEAN DEFAULT FALSE,
              reference_id VARCHAR(50) DEFAULT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create product_variants table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_variants (
              id INT AUTO_INCREMENT PRIMARY KEY,
              product_id INT NOT NULL,
              color_name VARCHAR(50) NOT NULL,
              color_code VARCHAR(10) NOT NULL,
              image_url VARCHAR(500) NOT NULL,
              gallery_images JSON,
              sort_order INT DEFAULT 0,
              is_default BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (product_id) REFERENCES designs(id) ON DELETE CASCADE
            );
        `);

        // Alter order_items — add notes, selected_color, selected_size
        try { await pool.query('ALTER TABLE order_items ADD COLUMN notes TEXT DEFAULT NULL;'); } catch(e) {}
        try { await pool.query('ALTER TABLE order_items ADD COLUMN selected_color VARCHAR(50) DEFAULT NULL;'); } catch(e) {}
        try { await pool.query('ALTER TABLE order_items ADD COLUMN selected_size VARCHAR(20) DEFAULT NULL;'); } catch(e) {}

        // Alter custom_orders — add DP & payment columns
        try { await pool.query('ALTER TABLE custom_orders ADD COLUMN dp_amount INT DEFAULT 0;'); } catch(e) {}
        try { await pool.query('ALTER TABLE custom_orders ADD COLUMN total_amount INT DEFAULT 0;'); } catch(e) {}
        try { await pool.query('ALTER TABLE custom_orders ADD COLUMN remaining_amount INT DEFAULT 0;'); } catch(e) {}
        try { await pool.query('ALTER TABLE custom_orders ADD COLUMN address TEXT DEFAULT NULL;'); } catch(e) {}
        try { await pool.query('ALTER TABLE custom_orders ADD COLUMN midtrans_dp_id VARCHAR(100) DEFAULT NULL;'); } catch(e) {}
        try { await pool.query('ALTER TABLE custom_orders ADD COLUMN midtrans_full_id VARCHAR(100) DEFAULT NULL;'); } catch(e) {}

        // Custom orders: add phone, contact_info columns; budget and address are kept for backward compat
        try { await pool.query("ALTER TABLE custom_orders ADD COLUMN phone VARCHAR(20) DEFAULT NULL"); } catch(e) {}
        try { await pool.query("ALTER TABLE custom_orders ADD COLUMN contact_info TEXT DEFAULT NULL"); } catch(e) {}

        try {
            await pool.query(`ALTER TABLE custom_orders MODIFY COLUMN status ENUM('pending', 'dp_paid', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled') DEFAULT 'pending';`);
        } catch(e) {}

        // Extend product_variants with gallery support
        try { await pool.query("ALTER TABLE product_variants ADD COLUMN gallery_images JSON DEFAULT NULL"); } catch(e) {}
        try { await pool.query("ALTER TABLE product_variants ADD COLUMN sort_order INT DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE product_variants ADD COLUMN is_default BOOLEAN DEFAULT FALSE"); } catch(e) {}
        try { await pool.query("ALTER TABLE product_variants ADD FOREIGN KEY (product_id) REFERENCES designs(id) ON DELETE CASCADE"); } catch(e) {}

        // Drop license column from designs
        try { await pool.query('ALTER TABLE designs DROP COLUMN license'); } catch(e) {}

        // Widen order ID columns to prevent truncation
        try { await pool.query('ALTER TABLE orders MODIFY COLUMN id VARCHAR(50)'); } catch(e) {}
        try { await pool.query('ALTER TABLE order_items MODIFY COLUMN order_id VARCHAR(50)'); } catch(e) {}
        try { await pool.query('ALTER TABLE custom_orders MODIFY COLUMN id VARCHAR(50)'); } catch(e) {}
        
        isInitialized = true;
    } catch (error) {
        console.error("Database initialization error:", error);
    }
}

export async function query(sql, params) {
    if (!isInitialized) {
        await initDB();
    }
    const pool = getPool();
    const [results] = await pool.execute(sql, params);
    return results;
}

