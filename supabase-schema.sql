-- ============================================
-- Inventory Management App - Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    price NUMERIC(10, 2) DEFAULT 0,
    cost NUMERIC(10, 2) DEFAULT 0,
    supplier_id BIGINT,
    location TEXT,
    barcode TEXT,
    description TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON public.inventory(quantity, min_quantity);

-- ============================================
-- 2. SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    status TEXT DEFAULT 'active',
    rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    products TEXT[], -- Array of product names/categories
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);

-- ============================================
-- 3. PURCHASE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, received, cancelled
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,
    total_amount NUMERIC(10, 2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb, -- Array of {name, quantity, price, received}
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for purchase orders
CREATE INDEX IF NOT EXISTS idx_po_user ON public.purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_order_date ON public.purchase_orders(order_date DESC);

-- ============================================
-- 4. APP SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme_mode TEXT DEFAULT 'light',
    accent_color TEXT DEFAULT '#2563eb',
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'USD',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    low_stock_alerts BOOLEAN DEFAULT true,
    auto_backup BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for app settings
CREATE INDEX IF NOT EXISTS idx_app_settings_user ON public.app_settings(user_id);

-- ============================================
-- 5. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    phone TEXT,
    user_role TEXT DEFAULT 'viewer' CHECK (user_role IN ('owner', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(user_role);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Inventory policies
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory;
CREATE POLICY "Users can view their own inventory"
    ON public.inventory FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory;
CREATE POLICY "Users can insert their own inventory"
    ON public.inventory FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory;
CREATE POLICY "Users can update their own inventory"
    ON public.inventory FOR UPDATE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory;
CREATE POLICY "Users can delete their own inventory"
    ON public.inventory FOR DELETE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

-- Suppliers policies
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
CREATE POLICY "Users can view their own suppliers"
    ON public.suppliers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own suppliers" ON public.suppliers;
CREATE POLICY "Users can insert their own suppliers"
    ON public.suppliers FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
CREATE POLICY "Users can update their own suppliers"
    ON public.suppliers FOR UPDATE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;
CREATE POLICY "Users can delete their own suppliers"
    ON public.suppliers FOR DELETE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

-- Purchase Orders policies
DROP POLICY IF EXISTS "Users can view their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can view their own purchase orders"
    ON public.purchase_orders FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can insert their own purchase orders"
    ON public.purchase_orders FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Users can update their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can update their own purchase orders"
    ON public.purchase_orders FOR UPDATE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Users can delete their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can delete their own purchase orders"
    ON public.purchase_orders FOR DELETE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.user_role = 'owner'
        )
    );

-- App Settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.app_settings;
CREATE POLICY "Users can view their own settings"
    ON public.app_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.app_settings;
CREATE POLICY "Users can insert their own settings"
    ON public.app_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.app_settings;
CREATE POLICY "Users can update their own settings"
    ON public.app_settings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.app_settings;
CREATE POLICY "Users can delete their own settings"
    ON public.app_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment below to insert sample data after first user signup

/*
-- Insert sample inventory (replace USER_UUID with your user ID)
INSERT INTO public.inventory (name, sku, category, quantity, min_quantity, price, cost, user_id)
VALUES 
    ('Laptop Dell XPS 13', 'LAPTOP-001', 'Electronics', 15, 5, 1200.00, 900.00, 'USER_UUID'),
    ('Wireless Mouse', 'MOUSE-001', 'Accessories', 8, 10, 25.00, 15.00, 'USER_UUID'),
    ('USB-C Cable', 'CABLE-001', 'Accessories', 50, 20, 12.00, 5.00, 'USER_UUID');

-- Insert sample suppliers (replace USER_UUID with your user ID)
INSERT INTO public.suppliers (name, contact_person, email, phone, status, rating, products, user_id)
VALUES 
    ('Tech Supplies Inc', 'John Doe', 'john@techsupplies.com', '+1-555-0100', 'active', 5, ARRAY['Electronics', 'Accessories'], 'USER_UUID'),
    ('Global Electronics', 'Jane Smith', 'jane@globalelec.com', '+1-555-0200', 'active', 4, ARRAY['Electronics'], 'USER_UUID');
*/

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Your database is now ready!
-- Next steps:
-- 1. Sign up/login to your app
-- 2. Start adding inventory, suppliers, and purchase orders
-- 3. All data is automatically secured with RLS per user
-- ============================================
