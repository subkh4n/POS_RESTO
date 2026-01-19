# POS_RESTO Backend Data Relations untuk Supabase

Dokumentasi lengkap tentang struktur data dan hubungan antar tabel dari aplikasi POS_RESTO untuk migrasi ke Supabase.

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        uuid id PK
        text username UK
        text password
        text name
        text role
        text email
        text phone
        text avatar
        timestamp created_at
        timestamp last_login
        boolean is_active
    }

    CATEGORIES {
        uuid id PK
        text name UK
        text icon
    }

    PRODUCTS {
        uuid id PK
        text name
        uuid category_id FK
        decimal price
        integer stock
        text stock_type
        boolean available
        text image
        text price_type
    }

    MODIFIER_GROUPS {
        uuid id PK
        text name
        text type
        boolean required
        integer min_select
        integer max_select
    }

    MODIFIER_ITEMS {
        uuid id PK
        uuid group_id FK
        text name
        decimal price_adjust
        boolean available
    }

    PRODUCT_MODIFIER_GROUPS {
        uuid product_id FK
        uuid modifier_group_id FK
    }

    TRANSACTIONS {
        uuid id PK
        timestamp created_at
        decimal subtotal
        decimal tax
        decimal total
        decimal cash_received
        decimal change
        text order_type
        text table_number
        uuid cashier_id FK
        text payment_method
    }

    TRANSACTION_DETAILS {
        uuid id PK
        uuid transaction_id FK
        uuid product_id FK
        text product_name
        integer qty
        decimal price
        text note
        decimal total_price
        text allocation
        jsonb selected_modifiers
        decimal modifier_total
    }

    STOCK_LOG {
        uuid id PK
        timestamp created_at
        uuid product_id FK
        text product_name
        text action_type
        integer stock_value
        text notes
    }

    CATEGORIES ||--o{ PRODUCTS : "has many"
    USERS ||--o{ TRANSACTIONS : "processes"
    TRANSACTIONS ||--o{ TRANSACTION_DETAILS : "contains"
    PRODUCTS ||--o{ TRANSACTION_DETAILS : "sold in"
    MODIFIER_GROUPS ||--o{ MODIFIER_ITEMS : "has many"
    PRODUCTS ||--o{ PRODUCT_MODIFIER_GROUPS : "has"
    MODIFIER_GROUPS ||--o{ PRODUCT_MODIFIER_GROUPS : "assigned to"
    PRODUCTS ||--o{ STOCK_LOG : "tracked by"
```

---

## Penjelasan Relasi Data

### 1. Users → Transactions

- **Relasi:** One-to-Many
- **Penjelasan:** Seorang kasir (`users`) dapat memproses banyak transaksi (`transactions`)
- **Foreign Key:** `transactions.cashier_id` → `users.id`

### 2. Categories → Products

- **Relasi:** One-to-Many
- **Penjelasan:** Satu kategori memiliki banyak produk
- **Foreign Key:** `products.category_id` → `categories.id`

### 3. Products ↔ ModifierGroups (Many-to-Many)

- **Relasi:** Many-to-Many melalui junction table
- **Penjelasan:** Produk bisa memiliki beberapa modifier groups (misal: ukuran, level pedas)
- **Junction Table:** `product_modifier_groups`

### 4. ModifierGroups → ModifierItems

- **Relasi:** One-to-Many
- **Penjelasan:** Satu modifier group memiliki banyak modifier items
- **Foreign Key:** `modifier_items.group_id` → `modifier_groups.id`

### 5. Transactions → TransactionDetails

- **Relasi:** One-to-Many
- **Penjelasan:** Satu transaksi memiliki banyak item detail
- **Foreign Key:** `transaction_details.transaction_id` → `transactions.id`

### 6. Products → TransactionDetails

- **Relasi:** One-to-Many
- **Penjelasan:** Produk bisa muncul di banyak detail transaksi
- **Foreign Key:** `transaction_details.product_id` → `products.id`

### 7. Products → StockLog

- **Relasi:** One-to-Many
- **Penjelasan:** Setiap produk memiliki log perubahan stok
- **Foreign Key:** `stock_log.product_id` → `products.id`

---

## Struktur Tabel Detail

### users

| Column     | Type        | Constraints      | Description     |
| ---------- | ----------- | ---------------- | --------------- |
| id         | uuid        | PRIMARY KEY      | User ID         |
| username   | text        | UNIQUE, NOT NULL | Username login  |
| password   | text        | NOT NULL         | Password (hash) |
| name       | text        | NOT NULL         | Nama lengkap    |
| role       | text        | NOT NULL         | ADMIN, KASIR    |
| email      | text        |                  | Email           |
| phone      | text        |                  | Nomor telepon   |
| avatar     | text        |                  | URL avatar      |
| created_at | timestamptz | DEFAULT now()    | Waktu dibuat    |
| last_login | timestamptz |                  | Login terakhir  |
| is_active  | boolean     | DEFAULT true     | Status aktif    |

### categories

| Column | Type | Constraints      | Description   |
| ------ | ---- | ---------------- | ------------- |
| id     | uuid | PRIMARY KEY      | Category ID   |
| name   | text | UNIQUE, NOT NULL | Nama kategori |
| icon   | text |                  | Emoji icon    |

### products

| Column      | Type          | Constraints               | Description                |
| ----------- | ------------- | ------------------------- | -------------------------- |
| id          | uuid          | PRIMARY KEY               | Product ID                 |
| name        | text          | NOT NULL                  | Nama produk                |
| category_id | uuid          | REFERENCES categories(id) | FK ke categories           |
| price       | decimal(12,2) | NOT NULL                  | Harga                      |
| stock       | integer       | DEFAULT 0                 | Jumlah stok                |
| stock_type  | text          | NOT NULL                  | STOK_FISIK, NON_STOK, JASA |
| available   | boolean       | DEFAULT true              | Tersedia/tidak             |
| image       | text          |                           | URL gambar                 |
| price_type  | text          | DEFAULT 'FIXED'           | FIXED, FLEXIBLE            |

### modifier_groups

| Column     | Type    | Constraints        | Description                |
| ---------- | ------- | ------------------ | -------------------------- |
| id         | uuid    | PRIMARY KEY        | Group ID                   |
| name       | text    | NOT NULL           | Nama group (misal: Ukuran) |
| type       | text    | DEFAULT 'MULTIPLE' | SINGLE, MULTIPLE           |
| required   | boolean | DEFAULT false      | Wajib pilih?               |
| min_select | integer | DEFAULT 0          | Minimum pilihan            |
| max_select | integer | DEFAULT 10         | Maximum pilihan            |

### modifier_items

| Column       | Type          | Constraints                    | Description              |
| ------------ | ------------- | ------------------------------ | ------------------------ |
| id           | uuid          | PRIMARY KEY                    | Item ID                  |
| group_id     | uuid          | REFERENCES modifier_groups(id) | FK ke groups             |
| name         | text          | NOT NULL                       | Nama item (misal: Large) |
| price_adjust | decimal(12,2) | DEFAULT 0                      | Tambahan harga           |
| available    | boolean       | DEFAULT true                   | Tersedia/tidak           |

### product_modifier_groups (Junction Table)

| Column            | Type | Constraints                                      | Description    |
| ----------------- | ---- | ------------------------------------------------ | -------------- |
| product_id        | uuid | REFERENCES products(id) ON DELETE CASCADE        | FK ke products |
| modifier_group_id | uuid | REFERENCES modifier_groups(id) ON DELETE CASCADE | FK ke groups   |
| PRIMARY KEY       |      | (product_id, modifier_group_id)                  | Composite key  |

### transactions

| Column         | Type          | Constraints          | Description          |
| -------------- | ------------- | -------------------- | -------------------- |
| id             | uuid          | PRIMARY KEY          | Transaction ID       |
| created_at     | timestamptz   | DEFAULT now()        | Waktu transaksi      |
| subtotal       | decimal(12,2) | NOT NULL             | Subtotal             |
| tax            | decimal(12,2) | DEFAULT 0            | Pajak                |
| total          | decimal(12,2) | NOT NULL             | Total                |
| cash_received  | decimal(12,2) |                      | Uang diterima        |
| change         | decimal(12,2) |                      | Kembalian            |
| order_type     | text          |                      | Dine-in, Takeaway    |
| table_number   | text          |                      | Nomor meja           |
| cashier_id     | uuid          | REFERENCES users(id) | FK ke users          |
| payment_method | text          |                      | Tunai, QRIS, Piutang |

### transaction_details

| Column             | Type          | Constraints                                   | Description             |
| ------------------ | ------------- | --------------------------------------------- | ----------------------- |
| id                 | uuid          | PRIMARY KEY                                   | Detail ID               |
| transaction_id     | uuid          | REFERENCES transactions(id) ON DELETE CASCADE | FK ke transactions      |
| product_id         | uuid          | REFERENCES products(id)                       | FK ke products          |
| product_name       | text          | NOT NULL                                      | Nama produk (snapshot)  |
| qty                | integer       | NOT NULL                                      | Quantity                |
| price              | decimal(12,2) | NOT NULL                                      | Harga satuan            |
| note               | text          |                                               | Catatan item            |
| total_price        | decimal(12,2) | GENERATED                                     | qty \* price            |
| allocation         | text          | DEFAULT 'Umum'                                | Alokasi dana            |
| selected_modifiers | jsonb         |                                               | Array modifier terpilih |
| modifier_total     | decimal(12,2) | DEFAULT 0                                     | Total modifier price    |

### stock_log

| Column       | Type        | Constraints             | Description                                               |
| ------------ | ----------- | ----------------------- | --------------------------------------------------------- |
| id           | uuid        | PRIMARY KEY             | Log ID                                                    |
| created_at   | timestamptz | DEFAULT now()           | Waktu log                                                 |
| product_id   | uuid        | REFERENCES products(id) | FK ke products                                            |
| product_name | text        | NOT NULL                | Nama produk                                               |
| action_type  | text        | NOT NULL                | STOCK_IN, STOCK_OUT, SALE_OUT, ADJUSTMENT, UPLOAD_PRODUCT |
| stock_value  | integer     | NOT NULL                | Nilai perubahan (+/-)                                     |
| notes        | text        |                         | Catatan                                                   |

---

## Supabase SQL Migration Script

```sql
-- ===============================================
-- POS_RESTO Database Schema for Supabase
-- ===============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
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

-- 2. Categories Table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT
);

-- 3. Products Table
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

-- 4. Modifier Groups Table
CREATE TABLE modifier_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'MULTIPLE' CHECK (type IN ('SINGLE', 'MULTIPLE')),
    required BOOLEAN DEFAULT FALSE,
    min_select INTEGER DEFAULT 0,
    max_select INTEGER DEFAULT 10
);

-- 5. Modifier Items Table
CREATE TABLE modifier_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_adjust DECIMAL(12,2) DEFAULT 0,
    available BOOLEAN DEFAULT TRUE
);

-- 6. Product-ModifierGroups Junction Table
CREATE TABLE product_modifier_groups (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, modifier_group_id)
);

-- 7. Transactions Table
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

-- 8. Transaction Details Table
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

-- 9. Stock Log Table
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
-- Indexes for Performance
-- ===============================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_modifier_items_group ON modifier_items(group_id);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transaction_details_transaction ON transaction_details(transaction_id);
CREATE INDEX idx_stock_log_product ON stock_log(product_id);
CREATE INDEX idx_stock_log_created ON stock_log(created_at DESC);

-- ===============================================
-- Row Level Security (RLS) Policies
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

-- Basic policy: Allow authenticated users to read all
CREATE POLICY "Allow read for authenticated users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON modifier_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON modifier_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON product_modifier_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON transaction_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users" ON stock_log FOR SELECT TO authenticated USING (true);

-- ===============================================
-- Default Data
-- ===============================================

-- Default admin user (password should be hashed in production)
INSERT INTO users (username, password, name, role, is_active) VALUES
('admin', 'admin123', 'Administrator', 'ADMIN', TRUE),
('kasir', 'kasir123', 'Kasir Utama', 'KASIR', TRUE);

-- Default categories
INSERT INTO categories (name, icon) VALUES
('Food', '🍔'),
('Drinks', '🥤'),
('Snack', '🍿');

-- ===============================================
-- Trigger for auto-update stock on sale
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
```

---

## Verification Plan

### Cara Verifikasi di Supabase:

1. **Buka Supabase Dashboard** → Project Anda → SQL Editor
2. **Jalankan SQL migration script** di atas
3. **Cek Table Editor** untuk memverifikasi semua tabel sudah dibuat
4. **Test relasi** dengan query:

   ```sql
   -- Test join products dengan categories
   SELECT p.name, c.name as category FROM products p
   JOIN categories c ON p.category_id = c.id;

   -- Test join transaction dengan details
   SELECT t.id, td.product_name, td.qty FROM transactions t
   JOIN transaction_details td ON td.transaction_id = t.id;
   ```

---

## Catatan Penting untuk Migrasi

> [!IMPORTANT] > **Password Hashing:** Di production, gunakan `crypt()` atau `pgcrypto` untuk hash password, bukan plain text.

> [!TIP] > **Supabase Auth:** Pertimbangkan untuk menggunakan Supabase Auth bawaan daripada tabel users custom untuk keamanan lebih baik.

> [!NOTE]
> Struktur `selected_modifiers` di `transaction_details` menggunakan JSONB untuk fleksibilitas menyimpan array modifier yang dipilih.
