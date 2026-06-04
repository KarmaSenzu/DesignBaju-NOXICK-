-- DesignBaju Database Migration V2
-- Adds: notifications, product_variants, custom_orders updates, order_items updates
USE designbaju;

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('order', 'custom_order', 'payment', 'system') DEFAULT 'system',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reference_id VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Product Variants (colors) table
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  color_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(10) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES designs(id) ON DELETE CASCADE
);

-- 3. Alter custom_orders — add DP & payment columns + expand status enum
ALTER TABLE custom_orders 
  ADD COLUMN IF NOT EXISTS dp_amount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS midtrans_dp_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS midtrans_full_id VARCHAR(100) DEFAULT NULL;

-- Update status enum (MySQL requires column redefinition)
ALTER TABLE custom_orders 
  MODIFY COLUMN status ENUM('pending', 'dp_paid', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled') DEFAULT 'pending';

-- 4. Alter order_items — add notes, selected_color, selected_size
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selected_color VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selected_size VARCHAR(20) DEFAULT NULL;

-- 5. Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
