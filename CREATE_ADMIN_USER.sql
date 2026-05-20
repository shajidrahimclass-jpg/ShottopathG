-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- Run this SQL after signing up through your app
-- Replace 'YOUR_USER_UUID_HERE' with your actual user UUID

-- Step 1: Find your user UUID
-- Go to: Supabase Dashboard → Authentication → Users
-- Copy the UUID of your user account

-- Step 2: Update the user's role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_UUID_HERE';

-- Step 3: Verify the update
SELECT id, email, role, created_at 
FROM profiles 
WHERE id = 'YOUR_USER_UUID_HERE';

-- ============================================
-- ALTERNATIVE: Create admin user directly
-- ============================================
-- If you want to create a new admin user from scratch:

-- 1. First, sign up through your app to create the auth user
-- 2. Then run the UPDATE query above

-- ============================================
-- VERIFY ADMIN ACCESS
-- ============================================
-- Check all admin users
SELECT id, email, role, full_name, created_at 
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If profile doesn't exist, create it manually:
-- (Replace values with your actual user data)
/*
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'YOUR_USER_UUID_HERE',
  'your-email@example.com',
  'Your Full Name',
  'admin'
);
*/

-- If you need to change an existing user to admin:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- ============================================
-- NOTES
-- ============================================
-- 
-- Role Options:
-- - 'admin': Full access to admin dashboard and all features
-- - 'user': Regular customer access (default)
--
-- Admin users can:
-- - Access admin dashboard at /admin
-- - Manage products, categories, orders
-- - Configure payment gateways
-- - Manage delivery locations
-- - Create and manage vouchers
-- - View all orders (including guest orders)
-- - Manage banners and promotions
-- - Configure app settings (Force Sign-In toggle)
-- - And much more!
--
-- ============================================
