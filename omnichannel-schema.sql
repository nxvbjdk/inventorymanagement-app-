-- ============================================
-- OMNICHANNEL & ORDER MANAGEMENT SCHEMA
-- ============================================

-- Channels/Platforms table
CREATE TABLE IF NOT EXISTS public.channels (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- shopify, amazon, flipkart, myntra, meesho, website, pos
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, error
  api_key TEXT,
  api_secret TEXT,
  store_url TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency INTEGER DEFAULT 15, -- minutes
  credentials JSONB,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Channel inventory mapping
CREATE TABLE IF NOT EXISTS public.channel_inventory (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id BIGINT REFERENCES public.inventory(id) ON DELETE CASCADE,
  channel_id BIGINT REFERENCES public.channels(id) ON DELETE CASCADE,
  channel_product_id VARCHAR(255), -- Product ID on the channel
  channel_sku VARCHAR(255),
  quantity INTEGER DEFAULT 0,
  price DECIMAL(15,2),
  is_synced BOOLEAN DEFAULT false,
  sync_status VARCHAR(50), -- pending, synced, error
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(inventory_id, channel_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  channel_id BIGINT REFERENCES public.channels(id) ON DELETE SET NULL,
  channel_order_id VARCHAR(255),
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'received', -- received, confirmed, picked, packed, shipped, delivered, cancelled
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_method VARCHAR(50),
  currency_code VARCHAR(3) DEFAULT 'USD',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  shipping_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_country VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  billing_address TEXT,
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  notes TEXT,
  order_date TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  picked_at TIMESTAMPTZ,
  packed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  inventory_id BIGINT REFERENCES public.inventory(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  picked_quantity INTEGER DEFAULT 0,
  packed_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order status history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Returns table
CREATE TABLE IF NOT EXISTS public.returns (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  return_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  channel_id BIGINT REFERENCES public.channels(id) ON DELETE SET NULL,
  return_type VARCHAR(50) DEFAULT 'return', -- return, exchange, refund
  status VARCHAR(50) DEFAULT 'requested', -- requested, approved, picked_up, received, inspected, refunded, rejected, completed
  reason VARCHAR(255),
  reason_details TEXT,
  refund_method VARCHAR(50), -- original_payment, store_credit, exchange
  refund_amount DECIMAL(15,2),
  restocking_fee DECIMAL(15,2) DEFAULT 0,
  return_shipping_cost DECIMAL(15,2) DEFAULT 0,
  pickup_address TEXT,
  pickup_scheduled_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  notes TEXT,
  images JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Return items
CREATE TABLE IF NOT EXISTS public.return_items (
  id BIGSERIAL PRIMARY KEY,
  return_id BIGINT REFERENCES public.returns(id) ON DELETE CASCADE,
  order_item_id BIGINT REFERENCES public.order_items(id) ON DELETE SET NULL,
  inventory_id BIGINT REFERENCES public.inventory(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  condition VARCHAR(50), -- new, used_good, used_damaged, defective
  refund_amount DECIMAL(15,2),
  restock BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reverse pickup scheduling
CREATE TABLE IF NOT EXISTS public.reverse_pickups (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  return_id BIGINT REFERENCES public.returns(id) ON DELETE CASCADE,
  carrier VARCHAR(100),
  pickup_date DATE NOT NULL,
  pickup_time_slot VARCHAR(50),
  pickup_address TEXT NOT NULL,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, failed, cancelled
  tracking_number VARCHAR(255),
  awb_number VARCHAR(255),
  pickup_instructions TEXT,
  carrier_response JSONB,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sync logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id BIGINT REFERENCES public.channels(id) ON DELETE CASCADE,
  sync_type VARCHAR(50), -- inventory, orders, products, full
  status VARCHAR(50), -- started, success, failed, partial
  items_processed INTEGER DEFAULT 0,
  items_success INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_channels_user_id ON public.channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);
CREATE INDEX IF NOT EXISTS idx_channel_inventory_inventory_id ON public.channel_inventory(inventory_id);
CREATE INDEX IF NOT EXISTS idx_channel_inventory_channel_id ON public.channel_inventory(channel_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_channel_id ON public.orders(channel_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON public.order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON public.return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_reverse_pickups_return_id ON public.reverse_pickups(return_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_channel_id ON public.sync_logs(channel_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Channels policies
DROP POLICY IF EXISTS "Users can manage their channels" ON public.channels;
CREATE POLICY "Users can manage their channels" ON public.channels FOR ALL USING (auth.uid() = user_id);

-- Channel inventory policies
DROP POLICY IF EXISTS "Users can manage their channel inventory" ON public.channel_inventory;
CREATE POLICY "Users can manage their channel inventory" ON public.channel_inventory FOR ALL USING (auth.uid() = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Users can manage their orders" ON public.orders;
CREATE POLICY "Users can manage their orders" ON public.orders FOR ALL USING (auth.uid() = user_id);

-- Order items policies
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
CREATE POLICY "Users can view their order items" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Order status history policies
DROP POLICY IF EXISTS "Users can view order status history" ON public.order_status_history;
CREATE POLICY "Users can view order status history" ON public.order_status_history FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid())
);

-- Returns policies
DROP POLICY IF EXISTS "Users can manage their returns" ON public.returns;
CREATE POLICY "Users can manage their returns" ON public.returns FOR ALL USING (auth.uid() = user_id);

-- Return items policies
DROP POLICY IF EXISTS "Users can view return items" ON public.return_items;
CREATE POLICY "Users can view return items" ON public.return_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.returns WHERE returns.id = return_items.return_id AND returns.user_id = auth.uid())
);

-- Reverse pickups policies
DROP POLICY IF EXISTS "Users can manage reverse pickups" ON public.reverse_pickups;
CREATE POLICY "Users can manage reverse pickups" ON public.reverse_pickups FOR ALL USING (auth.uid() = user_id);

-- Sync logs policies
DROP POLICY IF EXISTS "Users can view their sync logs" ON public.sync_logs;
CREATE POLICY "Users can view their sync logs" ON public.sync_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE order_number ~ '^ORD-[0-9]+$';
  
  order_num := 'ORD-' || LPAD(next_num::TEXT, 6, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  return_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.returns
  WHERE return_number ~ '^RET-[0-9]+$';
  
  return_num := 'RET-' || LPAD(next_num::TEXT, 6, '0');
  RETURN return_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_order_id BIGINT;
BEGIN
  target_order_id := COALESCE(NEW.order_id, OLD.order_id);
  
  UPDATE public.orders
  SET 
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM public.order_items WHERE order_id = target_order_id),
    updated_at = now()
  WHERE id = target_order_id;
  
  UPDATE public.orders
  SET 
    total_amount = subtotal + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0) + COALESCE(shipping_amount, 0)
  WHERE id = target_order_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_totals ON public.order_items;
CREATE TRIGGER trigger_update_order_totals
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION update_order_totals();

-- Function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_order_status ON public.orders;
CREATE TRIGGER trigger_log_order_status
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Omnichannel & Order Management tables created!';
  RAISE NOTICE '✅ Order lifecycle tracking enabled';
  RAISE NOTICE '✅ Returns & reverse pickup system ready';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for multi-channel syncing!';
END $$;
