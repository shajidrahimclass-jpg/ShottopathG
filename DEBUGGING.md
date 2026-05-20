# Image Upload and Slug Debugging Guide

## Current Status

### ✅ What's Working
1. **Database Schema**: 
   - `products.slug` field exists and accepts data
   - Unique constraint on slug is working
   - Test insert confirmed: `INSERT INTO products (name, slug, ...) VALUES ('Test Product', 'test-product', ...)` ✅

2. **Storage Buckets**:
   - `app-9cyfgucqbpj5_shottopoth_images` bucket exists (for products)
   - `banners` bucket exists (for banners)
   - Both buckets are public
   - Storage policies are in place

3. **Code Implementation**:
   - `uploadImage()` function in api.ts ✅
   - `uploadBannerImage()` function in api.ts ✅
   - Product editor has slug field with auto-generation ✅
   - Product editor has image upload button ✅
   - Banner editor has image upload button ✅

### 🔍 Debugging Steps

#### For Product Slug Issues:
1. Open browser console (F12)
2. Go to Admin → Products → Add Product
3. Type a product name (e.g., "Test Product 123")
4. Check console for: `Saving product with data:` - verify slug is present
5. Fill in price and stock
6. Click Save
7. Check console for any errors
8. Go back to Products list and verify slug appears in the table

**Expected Console Output:**
```
Saving product with data: {name: "Test Product 123", slug: "test-product-123", ...}
Product created: {id: "...", name: "Test Product 123", slug: "test-product-123", ...}
```

#### For Product Image Upload Issues:
1. Open browser console (F12)
2. Go to Admin → Products → Add Product
3. Click "Upload Image" button
4. Select an image file (JPG, PNG, etc.)
5. Watch console for these logs:
   - `Product image upload started: [filename] [type] [size]`
   - `Calling uploadImage API...`
   - `Uploading image: [filename] to folder: products`
   - `Upload path: products/[timestamp]_[random].[ext]`
   - `Upload successful, getting public URL for: [path]`
   - `Public URL: [url]`
   - `Set as main image` or `Added to additional images`

**If Upload Fails:**
- Check the error message in console
- Common errors:
  - "new row violates row-level security policy" → User not authenticated (must be logged in)
  - "Bucket not found" → Storage bucket issue
  - "File size too large" → File > 5MB

#### For Banner Image Upload Issues:
1. Open browser console (F12)
2. Go to Admin → Banners → Add New Banner
3. Click "Upload" button next to image URL field
4. Select an image file
5. Watch console for these logs:
   - `Banner image upload started: [filename] [type] [size]`
   - `Calling uploadBannerImage API...`
   - `Uploading banner image: [filename]`
   - `Banner upload path: [timestamp]_[random].[ext]`
   - `Banner upload successful, getting public URL for: [path]`
   - `Banner public URL: [url]`

**If Upload Fails:**
- Check if you're logged in as admin
- Check console error message
- Verify admin role: `SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid();`

### 🔧 Manual Testing Queries

#### Test Slug Saving:
```sql
-- Check if slug is being saved
SELECT id, name, slug, created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 5;
```

#### Test Storage Policies:
```sql
-- Check banner storage policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%banner%';
```

#### Check User Role:
```sql
-- Verify you're admin
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE id = auth.uid();
```

### 📝 What to Report

If issues persist, please provide:
1. **Console logs** - Copy all console output when attempting upload/save
2. **Error messages** - Exact error text from toast notifications
3. **Browser** - Which browser you're using
4. **Steps** - Exact steps you took before the error
5. **User role** - Confirm you're logged in as admin

### 🎯 Quick Fixes

#### If slug not showing in products list:
- Refresh the page
- Check if slug column is visible in the table
- Try creating a new product with a simple name like "Test"

#### If image upload button not working:
- Check if button is disabled (should show "Uploading..." when active)
- Try a smaller image (< 1MB)
- Try a different image format (JPG instead of PNG)
- Check browser console for errors

#### If "Permission denied" errors:
- Log out and log back in
- Verify admin role in database
- Check storage policies are correct

### 📊 Current Database State

Products with slugs:
```sql
SELECT COUNT(*) as total_products,
       COUNT(slug) as products_with_slug
FROM products;
```

Storage objects:
```sql
SELECT bucket_id, COUNT(*) as file_count
FROM storage.objects
GROUP BY bucket_id;
```
