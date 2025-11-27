# Database Setup Instructions

## ⚠️ Important: Run These SQL Files in Order

You're seeing 404 errors because the new database tables haven't been created yet. Follow these steps:

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `rognffppjczuekqxdrfx`
3. Click on "SQL Editor" in the left sidebar

## Step 2: Run the Invoicing Schema

1. Open the file: `supabase-invoicing-schema.sql` (located in your app folder)
2. Copy the entire contents
3. In Supabase SQL Editor:
   - Click "New Query"
   - Paste the SQL code
   - Click "Run" or press Ctrl+Enter

This will create:
- ✅ currencies table
- ✅ customers table
- ✅ invoices table
- ✅ invoice_items table
- ✅ retainers table
- ✅ credit_notes table
- ✅ sales_returns table
- ✅ sales_return_items table
- ✅ backorders table
- ✅ shipping_labels table
- ✅ email_templates table
- ✅ sales_approvals table
- ✅ chat_messages table
- ✅ portal_access_logs table

## Step 3: Verify Tables Were Created

After running the SQL, verify in Supabase:
1. Click "Table Editor" in the left sidebar
2. You should see all the new tables listed
3. Check that default currencies are populated (USD, EUR, GBP, etc.)

## Step 4: Refresh Your App

1. Go back to your running app at http://localhost:8081
2. Refresh the page (F5 or Ctrl+R)
3. Navigate to "Sales & Invoicing" → "Invoices"
4. The 404 errors should be gone!

## Quick Reference

### Tables Created:
| Table | Purpose |
|-------|---------|
| currencies | Multi-currency support (USD, EUR, GBP, etc.) |
| customers | Customer profiles with portal access |
| invoices | Main invoice records |
| invoice_items | Line items for invoices |
| retainers | Retainer invoice management |
| credit_notes | Credit management |
| sales_returns | Return processing |
| backorders | Backorder tracking |
| shipping_labels | Shipping management |
| email_templates | Email customization |
| sales_approvals | Approval workflows |
| chat_messages | Contextual chat system |

### Default Data:
- ✅ 7 currencies pre-populated (USD, EUR, GBP, CAD, AUD, JPY, INR)
- ✅ 3 email templates (Invoice, Reminder, Receipt)

## Troubleshooting

### If you see "relation does not exist" errors:
- Make sure you ran the SQL in the correct project
- Check that you're logged in as the project owner
- Try running the SQL again

### If you see "permission denied" errors:
- The RLS policies are working correctly
- Make sure you're logged into the app with a valid user account
- The user_id field will automatically filter data to your account

### If currencies table is empty:
- Re-run just the INSERT statements at the bottom of the SQL file
- They should insert the default currencies

## Need Help?

The SQL file is located at:
```
d:\React Apps\inventory_management_app\app\supabase-invoicing-schema.sql
```

Open it in any text editor, copy everything, and paste into Supabase SQL Editor.

---

**Once the tables are created, all the new features will work:**
- ✅ Multi-currency invoicing
- ✅ Multi-language support
- ✅ Customer management
- ✅ Credit notes
- ✅ Sales returns
- ✅ Backorders
- ✅ Shipping labels
- ✅ And more!
