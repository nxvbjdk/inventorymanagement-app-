# Database Deployment Guide

## 📋 Overview
This guide will walk you through deploying the complete database schema for your inventory management app with omnichannel e-commerce integration.

## 🗂️ SQL Files to Deploy (In Order)

### 1️⃣ **CREATE_TABLES.sql** (Base Invoicing System)
**Location**: `app/CREATE_TABLES.sql`

**Tables Created (14)**:
- `customers` - Customer information
- `invoices` - Invoice headers
- `invoice_items` - Invoice line items
- `credit_notes` - Credit note management
- `credit_note_items` - Credit note line items
- `sales_returns` - Sales return tracking
- `sales_return_items` - Return line items
- `backorders` - Backorder management
- `backorder_items` - Backorder line items
- `payments` - Payment records
- `payment_methods` - Payment method definitions
- `shipping_addresses` - Customer shipping addresses
- `tax_rates` - Tax rate configuration
- `app_settings` - Application settings

**Features**:
- Automatic invoice total calculation (trigger)
- Row Level Security (RLS) policies
- Indexes for performance
- Status tracking for invoices, returns, backorders
- Multi-currency support
- Tax calculation support

---

### 2️⃣ **omnichannel-schema.sql** (Omnichannel System)
**Location**: `app/omnichannel-schema.sql`

**Tables Created (8)**:
- `channels` - Platform configurations (Shopify, Amazon, Flipkart, Myntra, Meesho, Website, POS)
- `channel_credentials` - Encrypted API keys and secrets (JSONB storage)
- `inventory_channel_sync` - Real-time inventory sync tracking per channel
- `orders` - Order lifecycle management (6 stages: received → picked → packed → shipped → delivered → cancelled)
- `order_items` - Order line items with product details
- `order_status_history` - Complete audit trail of order status transitions
- `returns` - Return request management with reason codes
- `reverse_pickups` - Pickup scheduling with courier integration

**Features**:
- Multi-platform inventory synchronization
- Order lifecycle state machine
- Reverse logistics integration
- Courier partner tracking (Delhivery, Bluedart, DTDC, Ekart, Shiprocket)
- Refund method support (original payment, store credit, exchange)
- Auto-sync configuration per channel
- Webhook ready structure
- Complete RLS policies
- Performance indexes

**Dependencies**: 
- Requires `inventory` table from base schema
- Requires `customers` table from CREATE_TABLES.sql

---

## 🚀 Deployment Steps

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `rognffppjczuekqxdrfx`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Deploy Base Invoicing Schema
1. Open `app/CREATE_TABLES.sql` in VS Code
2. Copy the entire contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for success message: ✅ "Success. No rows returned"

**Verification**:
```sql
-- Run this to verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'invoices', 'invoice_items', 'credit_notes', 'sales_returns', 'backorders', 'payments', 'app_settings')
ORDER BY table_name;
```
Expected: 14 rows

### Step 3: Deploy Omnichannel Schema
1. Open `app/omnichannel-schema.sql` in VS Code
2. Copy the entire contents
3. Paste into a new query in Supabase SQL Editor
4. Click **Run**
5. Wait for success message

**Verification**:
```sql
-- Run this to verify omnichannel tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('channels', 'channel_credentials', 'inventory_channel_sync', 'orders', 'order_items', 'order_status_history', 'returns', 'reverse_pickups')
ORDER BY table_name;
```
Expected: 8 rows

### Step 4: Verify RLS Policies
```sql
-- Check that RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'invoices', 'channels', 'orders', 'returns')
ORDER BY tablename;
```
Expected: All tables should have `rowsecurity = true`

---

## 🧪 Test Data (Optional)

After deployment, you can add test data to verify everything works:

### Test Customer
```sql
INSERT INTO customers (company_name, contact_person, email, phone, address, city, state, country, postal_code)
VALUES ('ACME Corp', 'John Doe', 'john@acme.com', '+1-555-1234', '123 Main St', 'New York', 'NY', 'USA', '10001');
```

### Test Channel Connection
```sql
INSERT INTO channels (platform_type, is_active, auto_sync_enabled, sync_interval_minutes)
VALUES ('shopify', true, true, 30);
```

### Test Order
```sql
-- First, get a customer ID
SELECT id FROM customers LIMIT 1;

-- Then create an order (replace YOUR_CUSTOMER_ID)
INSERT INTO orders (channel_id, customer_id, channel_order_id, order_status, payment_status, fulfillment_status, total_amount, currency)
VALUES (
  (SELECT id FROM channels WHERE platform_type = 'shopify' LIMIT 1),
  'YOUR_CUSTOMER_ID',
  'SHOP-12345',
  'received',
  'paid',
  'processing',
  150.00,
  'USD'
);
```

---

## 📱 Frontend Pages Now Available

After database deployment, these pages will be fully functional:

### Invoicing System
- **Invoices** (`/invoices`) - Create/manage invoices with PDF download
- **Customers** (`/customers`) - Customer management
- **Credit Notes** (`/credit-notes`) - Issue credit notes
- **Sales Returns** (`/sales-returns`) - Process sales returns

### Omnichannel System (NEW)
- **Channels** (`/channels`) - Connect to 7 platforms (Shopify, Amazon, Flipkart, Myntra, Meesho, Website, POS)
- **Orders** (`/orders`) - Track order lifecycle with visual pipeline (received → picked → packed → shipped → delivered)
- **Returns** (`/returns`) - Manage returns with reverse pickup scheduling

---

## 🔒 Security Features

All tables include:
- ✅ Row Level Security (RLS) enabled
- ✅ User-based access control (checks `auth.uid()`)
- ✅ Automatic `created_at` and `updated_at` timestamps
- ✅ Encrypted credential storage (JSONB fields)
- ✅ Audit trails (order_status_history)

---

## ⚡ Performance Optimizations

Indexes created for:
- Customer lookups by email
- Invoice searches by number, date, customer
- Order filtering by status, channel, customer
- Return tracking by order and status
- Channel sync status queries
- Reverse pickup status tracking

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already created. You can skip this file or drop tables first:
```sql
-- Only run if you want to recreate tables
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
-- etc...
```

### Error: "column does not exist"
**Solution**: Make sure you deployed CREATE_TABLES.sql before omnichannel-schema.sql

### Error: "permission denied"
**Solution**: Check RLS policies. You must be authenticated:
```sql
-- Check current user
SELECT auth.uid();
```

### Orders not showing up
**Solution**: Verify channel is created first:
```sql
SELECT * FROM channels;
-- If empty, add a channel from the /channels page
```

---

## 📊 Next Steps

1. ✅ Deploy both SQL files in order
2. 🧪 Add test data to verify functionality
3. 🔗 Connect to a platform (start with Shopify or POS)
4. 📦 Sync inventory to channels
5. 🛒 Create test orders
6. 🔄 Test order lifecycle transitions
7. ↩️ Process a test return with pickup

---

## 🆘 Need Help?

If you encounter issues:
1. Check Supabase logs (Logs section in dashboard)
2. Verify all tables exist (use verification queries above)
3. Check RLS policies are enabled
4. Ensure you're authenticated in the app

---

**Status**: Database schema files are ready to deploy. Run them in Supabase SQL Editor in the order listed above.
