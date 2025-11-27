-- ============================================
-- COMPLETE DATABASE SETUP FOR INVENTORY MANAGEMENT
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CURRENCIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.currencies (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  exchange_rate DECIMAL(12,6) DEFAULT 1.0,
  is_base_currency BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default currencies
INSERT INTO public.currencies (code, name, symbol, is_base_currency, exchange_rate) VALUES
  ('USD', 'US Dollar', '$', true, 1.0),
  ('EUR', 'Euro', '€', false, 0.92),
  ('GBP', 'British Pound', '£', false, 0.79),
  ('CAD', 'Canadian Dollar', 'C$', false, 1.36),
  ('AUD', 'Australian Dollar', 'A$', false, 1.53),
  ('JPY', 'Japanese Yen', '¥', false, 149.50),
  ('INR', 'Indian Rupee', '₹', false, 83.12)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  tax_id VARCHAR(100),
  currency_code VARCHAR(3) REFERENCES public.currencies(code) DEFAULT 'USD',
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  preferred_language VARCHAR(10) DEFAULT 'en',
  portal_access BOOLEAN DEFAULT false,
  portal_password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- ============================================
-- 3. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type VARCHAR(20) DEFAULT 'standard',
  status VARCHAR(20) DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  currency_code VARCHAR(3) REFERENCES public.currencies(code) DEFAULT 'USD',
  exchange_rate DECIMAL(12,6) DEFAULT 1.0,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  shipping_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  language VARCHAR(10) DEFAULT 'en',
  pdf_url TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- ============================================
-- 4. INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT REFERENCES public.invoices(id) ON DELETE CASCADE,
  inventory_id BIGINT REFERENCES public.inventory(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- ============================================
-- 5. RETAINERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.retainers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  retainer_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  currency_code VARCHAR(3) REFERENCES public.currencies(code) DEFAULT 'USD',
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. CREDIT NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES public.invoices(id) ON DELETE SET NULL,
  credit_note_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  reason TEXT,
  currency_code VARCHAR(3) REFERENCES public.currencies(code) DEFAULT 'USD',
  amount DECIMAL(15,2) NOT NULL,
  applied_amount DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_customer_id ON public.credit_notes(customer_id);

-- ============================================
-- 7. SALES RETURNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales_returns (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES public.invoices(id) ON DELETE SET NULL,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  return_number VARCHAR(50) UNIQUE NOT NULL,
  return_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  refund_method VARCHAR(20),
  credit_note_id BIGINT REFERENCES public.credit_notes(id),
  total_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_returns_customer_id ON public.sales_returns(customer_id);

-- ============================================
-- 8. SALES RETURN ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales_return_items (
  id BIGSERIAL PRIMARY KEY,
  return_id BIGINT REFERENCES public.sales_returns(id) ON DELETE CASCADE,
  inventory_id BIGINT REFERENCES public.inventory(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  line_total DECIMAL(15,2) NOT NULL,
  condition VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. BACKORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.backorders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  inventory_id BIGINT REFERENCES public.inventory(id) ON DELETE CASCADE,
  backorder_number VARCHAR(50) UNIQUE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  fulfilled_quantity DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL,
  order_date DATE NOT NULL,
  expected_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backorders_customer_id ON public.backorders(customer_id);
CREATE INDEX IF NOT EXISTS idx_backorders_status ON public.backorders(status);

-- ============================================
-- 10. SHIPPING LABELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.shipping_labels (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES public.invoices(id) ON DELETE SET NULL,
  tracking_number VARCHAR(100) UNIQUE,
  carrier VARCHAR(50),
  service_type VARCHAR(50),
  weight DECIMAL(10,2),
  dimensions VARCHAR(50),
  shipping_cost DECIMAL(15,2),
  from_address TEXT,
  to_address TEXT,
  label_url TEXT,
  status VARCHAR(20) DEFAULT 'created',
  shipped_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_labels_invoice_id ON public.shipping_labels(invoice_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_tracking ON public.shipping_labels(tracking_number);

-- ============================================
-- 11. EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  is_default BOOLEAN DEFAULT false,
  variables JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 12. SALES APPROVALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales_approvals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES public.invoices(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  approver_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 13. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  customer_id BIGINT REFERENCES public.customers(id),
  context_type VARCHAR(50),
  context_id BIGINT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_context ON public.chat_messages(context_type, context_id);

-- ============================================
-- 14. PORTAL ACCESS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.portal_access_logs (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  action VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;

-- Currencies policies (public read)
DROP POLICY IF EXISTS "Currencies are viewable by authenticated users" ON public.currencies;
CREATE POLICY "Currencies are viewable by authenticated users" ON public.currencies FOR SELECT USING (auth.role() = 'authenticated');

-- Customers policies
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

CREATE POLICY "Users can view their own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Invoices policies
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Invoice items policies
DROP POLICY IF EXISTS "Users can view their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete their invoice items" ON public.invoice_items;

CREATE POLICY "Users can view their invoice items" ON public.invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can insert their invoice items" ON public.invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can update their invoice items" ON public.invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can delete their invoice items" ON public.invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);

-- Other tables policies (simplified - owner access)
DROP POLICY IF EXISTS "Users can manage their retainers" ON public.retainers;
CREATE POLICY "Users can manage their retainers" ON public.retainers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their credit notes" ON public.credit_notes;
CREATE POLICY "Users can manage their credit notes" ON public.credit_notes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their sales returns" ON public.sales_returns;
CREATE POLICY "Users can manage their sales returns" ON public.sales_returns FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their backorders" ON public.backorders;
CREATE POLICY "Users can manage their backorders" ON public.backorders FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their shipping labels" ON public.shipping_labels;
CREATE POLICY "Users can manage their shipping labels" ON public.shipping_labels FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their email templates" ON public.email_templates;
CREATE POLICY "Users can manage their email templates" ON public.email_templates FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can manage their sales approvals" ON public.sales_approvals;
CREATE POLICY "Users can manage their sales approvals" ON public.sales_approvals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage their chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id OR sender_id = auth.uid() OR recipient_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  invoice_num := 'INV-' || LPAD(next_num::TEXT, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_invoice_id BIGINT;
BEGIN
  -- Get the invoice_id from either NEW or OLD record
  target_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update subtotal
  UPDATE public.invoices
  SET 
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM public.invoice_items WHERE invoice_id = target_invoice_id),
    updated_at = now()
  WHERE id = target_invoice_id;
  
  -- Update total and balance
  UPDATE public.invoices
  SET 
    total_amount = subtotal + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0) + COALESCE(shipping_amount, 0),
    balance_due = subtotal + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0) + COALESCE(shipping_amount, 0) - COALESCE(paid_amount, 0)
  WHERE id = target_invoice_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoice totals
DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON public.invoice_items;
CREATE TRIGGER trigger_update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ All tables created successfully!';
  RAISE NOTICE '✅ RLS policies applied';
  RAISE NOTICE '✅ Indexes created';
  RAISE NOTICE '✅ Functions and triggers set up';
  RAISE NOTICE '✅ Default currencies inserted';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your database is ready to use!';
END $$;
