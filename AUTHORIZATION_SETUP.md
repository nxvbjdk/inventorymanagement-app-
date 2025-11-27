# Inventory Management System - Setup Guide

## 🚀 Complete Authorization & Database Setup

This guide will help you set up the complete authorization system with role-based access control (Owner vs Viewer roles).

---

## 📋 Prerequisites

- Supabase account (free tier works)
- Your Supabase project URL and Anon Key in `.env` file

---

## 🗄️ Database Setup

### Step 1: Run the SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Open `supabase-schema.sql` from your project root
4. Copy all the SQL code
5. Paste it into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

This will create:
- ✅ `inventory` table with user_id foreign key
- ✅ `suppliers` table 
- ✅ `purchase_orders` table
- ✅ `app_settings` table for user preferences
- ✅ `profiles` table with **user_role** (owner/viewer)
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp triggers
- ✅ Proper indexes for performance

### Step 2: Verify Tables Were Created

In Supabase Dashboard:
1. Go to **Table Editor**
2. You should see all 5 tables listed
3. Click on `profiles` table
4. Verify the `user_role` column exists with check constraint (owner/viewer)

---

## 🔐 Authorization System

### User Roles

**👑 Owner Role:**
- Full CRUD access to inventory, suppliers, and purchase orders
- Can create, edit, and delete all items
- Database enforces permissions via RLS policies
- Recommended for business owners and managers

**👁 Viewer Role:**
- Read-only access to all data
- Can view inventory, suppliers, and reports
- Cannot create, edit, or delete items
- Perfect for employees, accountants, or stakeholders

### How It Works

1. **Registration**: Users select their role during sign-up
2. **Profile Creation**: A profile with selected role is automatically created
3. **Database Enforcement**: RLS policies check role before allowing edits
4. **UI Guards**: Buttons/forms hide or disable for viewers
5. **Context Access**: `usePermissions()` hook provides role checks

---

## 🎨 Features Implemented

### ✅ Enhanced Login Page
- Password visibility toggle (eye icon)
- Better error messaging with styled alerts
- Loading states with spinner
- Auto-redirect if already logged in
- Link to password reset
- Improved form validation

### ✅ Enhanced Register Page
- **Role Selection**: Owner vs Viewer with descriptions
- **Password Strength Meter**: Visual indicator (5 levels)
- Password visibility toggle
- Success screen with confirmation
- Email validation
- Password confirmation match check
- Loading states

### ✅ Password Reset Flow
- Dedicated `/reset` route
- Email-based password reset
- Success confirmation screen
- Error handling
- Link from login page

### ✅ Auth Context Enhancements
- `profile` state with user role
- `isOwner` boolean for quick checks
- `loadProfile()` function
- Role passed during sign-up
- Automatic profile creation

### ✅ Permission System
- `usePermissions()` hook for role checks
- `PermissionGuard` component for conditional rendering
- Role badge in header (👑 Owner / 👁 Viewer)
- Database-level RLS enforcement

---

## 🛠️ How to Use Permissions in Code

### Example 1: Hide Edit Button for Viewers

```tsx
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
  const { canEdit } = usePermissions();

  return (
    <div>
      {canEdit && (
        <Button onClick={handleEdit}>Edit</Button>
      )}
    </div>
  );
};
```

### Example 2: Using PermissionGuard Component

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

const MyComponent = () => {
  return (
    <PermissionGuard action="edit">
      <Button onClick={handleEdit}>Edit</Button>
    </PermissionGuard>
  );
};
```

### Example 3: Show Message for Insufficient Permissions

```tsx
<PermissionGuard action="create" showMessage>
  <Button>Add New Item</Button>
</PermissionGuard>
```

### Example 4: Check Role Directly

```tsx
import { useAuth } from '@/context/AuthContext';

const MyComponent = () => {
  const { isOwner, profile } = useAuth();

  return (
    <div>
      {isOwner ? (
        <p>You have full access</p>
      ) : (
        <p>You have read-only access</p>
      )}
      <p>Your role: {profile?.user_role}</p>
    </div>
  );
};
```

---

## 🧪 Testing the System

### Test as Owner

1. Register a new account
2. Select **Owner** role
3. Login
4. Verify you can:
   - ✅ Create new inventory items
   - ✅ Edit existing items
   - ✅ Delete items
   - ✅ Manage suppliers
   - ✅ Create purchase orders
   - ✅ See 👑 Owner badge in header

### Test as Viewer

1. Register another account
2. Select **Viewer** role
3. Login
4. Verify you:
   - ✅ See all data (dashboard, inventory, suppliers)
   - ❌ Cannot see Add/Edit/Delete buttons
   - ❌ Get "Owner permission required" if buttons shown
   - ✅ See 👁 Viewer badge in header

### Test Database Enforcement

1. Login as **Viewer**
2. Open browser DevTools Console
3. Try to manually insert via Supabase:
   ```javascript
   await supabase.from('inventory').insert({
     name: 'Test',
     user_id: 'your-user-id'
   })
   ```
4. Should get RLS policy error ✅ (proves database-level security)

---

## 🎯 Next Steps

### Recommended UI Updates

You should now update these pages to respect permissions:

1. **Inventory Page** (`src/pages/Inventory.tsx`)
   - Hide Add/Edit/Delete buttons for viewers
   - Disable form inputs

2. **Suppliers Page** (`src/pages/Suppliers.tsx`)
   - Hide Add/Edit/Delete cards for viewers

3. **Purchase Orders Page** (`src/pages/PurchaseOrders.tsx`)
   - Hide Create Order button for viewers
   - Disable status updates

4. **Inventory Add Page** (`src/pages/InventoryAdd.tsx`)
   - Redirect viewers away or show message

### Example: Update Inventory Page

```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/PermissionGuard';

const Inventory = () => {
  const { canCreate } = usePermissions();

  return (
    <div>
      {/* Only show for owners */}
      <PermissionGuard action="create">
        <Button onClick={() => navigate('/inventory/add')}>
          Add New Item
        </Button>
      </PermissionGuard>

      {/* Show message if no permission */}
      {!canCreate && (
        <div className="text-sm text-muted-foreground">
          👁 Viewing as read-only
        </div>
      )}
    </div>
  );
};
```

---

## 🔒 Security Features

1. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Users can only see their own data
   - Edit/delete requires owner role
   - Database-enforced, not just UI

2. **Multi-Layer Protection**
   - Frontend: UI guards hide buttons
   - Context: Permission hooks prevent actions
   - Database: RLS blocks unauthorized queries
   - Auth: Session validation

3. **Automatic User Isolation**
   - Every row tagged with user_id
   - Queries automatically filtered by auth.uid()
   - No cross-user data leakage

---

## 📝 Environment Variables

Ensure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🐛 Troubleshooting

### "404 Not Found" on tables

**Problem**: Tables don't exist yet

**Solution**: Run `supabase-schema.sql` in Supabase SQL Editor

### "new row violates row-level security policy"

**Problem**: RLS blocking your request

**Solution**: 
1. Verify you're logged in
2. Check your role (owner required for edits)
3. Ensure user_id is set correctly

### Role not showing in header

**Problem**: Profile not loaded or created

**Solution**:
1. Check profiles table has your user
2. Verify user_role column exists
3. Re-login to reload profile

### Can't sign up

**Problem**: Email confirmation required

**Solution**:
1. Check Supabase Auth settings
2. Disable email confirmation for development:
   - Dashboard → Authentication → Email Auth → Disable confirmation

---

## 📚 API Reference

### AuthContext

```typescript
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;  // ← NEW
  loading: boolean;
  isOwner: boolean;             // ← NEW
  signIn: (email: string, password: string) => Promise<...>;
  signUp: (email: string, password: string, role?: 'owner' | 'viewer') => Promise<...>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<...>;
}
```

### usePermissions Hook

```typescript
interface Permissions {
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  isOwner: boolean;
  isViewer: boolean;
  role: 'owner' | 'viewer' | undefined;
}
```

### PermissionGuard Props

```typescript
interface PermissionGuardProps {
  children: ReactNode;
  action?: 'edit' | 'delete' | 'create';
  fallback?: ReactNode;
  showMessage?: boolean;
}
```

---

## ✨ Summary

You now have a complete authorization system with:

- ✅ Database schema with all tables
- ✅ Role-based access control (Owner/Viewer)
- ✅ Enhanced login with password toggle
- ✅ Enhanced register with role selection
- ✅ Password strength meter
- ✅ Password reset flow
- ✅ RLS policies enforcing permissions
- ✅ Permission hooks and guards
- ✅ Role badge in header
- ✅ Auto-redirect logic
- ✅ Success/error states
- ✅ Loading indicators

**Next**: Apply `PermissionGuard` to your existing pages to hide edit/delete functionality for viewers!

---

## 🆘 Need Help?

- Check Supabase logs in Dashboard → Logs
- Use browser DevTools to inspect network requests
- Verify RLS policies in Dashboard → Authentication → Policies
- Check user profile in profiles table

---

Made with ❤️ for secure inventory management
