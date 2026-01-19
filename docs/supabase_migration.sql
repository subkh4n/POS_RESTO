-- ===============================================
-- POS_RESTO Database Schema for Supabase
-- Generated: 2025-12-31
-- ===============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- 1. USERS TABLE
-- ===============================================
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'KASIR')),
    email TEXT,
    phone TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- ===============================================
-- 2. CATEGORIES TABLE
-- ===============================================
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT
);

-- ===============================================
-- 3. PRODUCTS TABLE
-- ===============================================
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    stock_type TEXT NOT NULL CHECK (stock_type IN ('STOK_FISIK', 'NON_STOK', 'JASA')),
    available BOOLEAN DEFAULT TRUE,
    image TEXT,
    price_type TEXT DEFAULT 'FIXED' CHECK (price_type IN ('FIXED', 'FLEXIBLE')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 4. MODIFIER GROUPS TABLE
-- ===============================================
CREATE TABLE modifier_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'MULTIPLE' CHECK (type IN ('SINGLE', 'MULTIPLE')),
    required BOOLEAN DEFAULT FALSE,
    min_select INTEGER DEFAULT 0,
    max_select INTEGER DEFAULT 10
);

-- ===============================================
-- 5. MODIFIER ITEMS TABLE
-- ===============================================
CREATE TABLE modifier_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_adjust DECIMAL(12,2) DEFAULT 0,
    available BOOLEAN DEFAULT TRUE
);

-- ===============================================
-- 6. PRODUCT-MODIFIER GROUPS JUNCTION TABLE
-- ===============================================
CREATE TABLE product_modifier_groups (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, modifier_group_id)
);

-- ===============================================
-- 7. TRANSACTIONS TABLE
-- ===============================================
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    subtotal DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    cash_received DECIMAL(12,2),
    change DECIMAL(12,2),
    order_type TEXT,
    table_number TEXT,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_method TEXT CHECK (payment_method IN ('Tunai', 'QRIS', 'Piutang'))
);

-- ===============================================
-- 8. TRANSACTION DETAILS TABLE
-- ===============================================
CREATE TABLE transaction_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    note TEXT,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (qty * price) STORED,
    allocation TEXT DEFAULT 'Umum',
    selected_modifiers JSONB,
    modifier_total DECIMAL(12,2) DEFAULT 0
);

-- ===============================================
-- 9. STOCK LOG TABLE
-- ===============================================
CREATE TABLE stock_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('STOCK_IN', 'STOCK_OUT', 'SALE_OUT', 'ADJUSTMENT', 'UPLOAD_PRODUCT', 'UPDATE_STOCK')),
    stock_value INTEGER NOT NULL,
    notes TEXT
);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_modifier_items_group ON modifier_items(group_id);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transaction_details_transaction ON transaction_details(transaction_id);
CREATE INDEX idx_stock_log_product ON stock_log(product_id);
CREATE INDEX idx_stock_log_created ON stock_log(created_at DESC);

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "users_read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_read" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_read" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "modifier_groups_read" ON modifier_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "modifier_items_read" ON modifier_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_modifier_groups_read" ON product_modifier_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "transactions_read" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "transaction_details_read" ON transaction_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_log_read" ON stock_log FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "users_all" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "categories_all" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "modifier_groups_all" ON modifier_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "modifier_items_all" ON modifier_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "product_modifier_groups_all" ON product_modifier_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "transactions_all" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "transaction_details_all" ON transaction_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "stock_log_all" ON stock_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===============================================
-- TRIGGER: AUTO UPDATE STOCK ON SALE
-- ===============================================
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update for physical stock products
    UPDATE products
    SET stock = stock - NEW.qty,
        updated_at = NOW()
    WHERE id = NEW.product_id
    AND stock_type = 'STOK_FISIK';

    -- Log the stock change
    INSERT INTO stock_log (product_id, product_name, action_type, stock_value, notes)
    SELECT NEW.product_id, NEW.product_name, 'SALE_OUT', -NEW.qty, 'Penjualan via POS'
    WHERE EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND stock_type = 'STOK_FISIK');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_sale
AFTER INSERT ON transaction_details
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- ===============================================
-- DEFAULT DATA
-- ===============================================

-- Default admin user (CHANGE PASSWORD IN PRODUCTION!)
INSERT INTO users (username, password, name, role, is_active) VALUES
('admin', 'admin123', 'Administrator', 'ADMIN', TRUE),
('kasir', 'kasir123', 'Kasir Utama', 'KASIR', TRUE);

-- Default categories
INSERT INTO categories (name, icon) VALUES
('Food', '🍔'),
('Drinks', '🥤'),
('Snack', '🍿');
