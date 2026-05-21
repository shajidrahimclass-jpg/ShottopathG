# Quick Testing Guide

## ✅ How to Test Product Slug

1. **Open Browser Console** (Press F12)
2. **Navigate**: Admin → Products → Add Product
3. **Type Product Name**: e.g., "My Awesome Product"
4. **Watch Console**: You should see:
   ```
   Name changed to: My Awesome Product → Generated slug: my-awesome-product
   ```
5. **Check Slug Field**: The slug field should auto-fill with "my-awesome-product"
6. **Fill Required Fields**: Price and Stock
7. **Click Save**
8. **Watch Console**: You should see:
   ```
   Saving product with data: {name: "My Awesome Product", slug: "my-awesome-product", ...}
   Product created: {id: "...", slug: "my-awesome-product", ...}
   ```
9. **Verify**: Go back to Products list and check the Slug column

## ✅ How to Test Product Image Upload

1. **Open Browser Console** (Press F12)
2. **Navigate**: Admin → Products → Add Product
3. **Click "Upload Image" Button**
4. **Select an Image** (JPG, PNG, max 5MB)
5. **Watch Console**: You should see:
   ```
   Product image upload started: image.jpg image/jpeg 123456
   Calling uploadImage API...
   Uploading image: image.jpg to folder: products
   Upload path: products/1234567890_abc123.jpg
   Upload successful, getting public URL for: products/1234567890_abc123.jpg
   Public URL: https://...
   Set as main image
   ```
6. **Check**: Image should appear in the preview
7. **Success Toast**: "Image uploaded successfully"

## ✅ How to Test Banner Image Upload

1. **Open Browser Console** (Press F12)
2. **Navigate**: Admin → Banners → Add New Banner
3. **Click "Upload" Button** (next to image URL field)
4. **Select an Image** (JPG, PNG, max 5MB)
5. **Watch Console**: You should see:
   ```
   Banner image upload started: banner.jpg image/jpeg 234567
   Calling uploadBannerImage API...
   Uploading banner image: banner.jpg
   Banner upload path: 1234567890_xyz789.jpg
   Banner upload successful, getting public URL for: 1234567890_xyz789.jpg
   Banner public URL: https://...
   ```
6. **Check**: Image URL field should be filled with the uploaded URL
7. **Check Preview**: Image should appear in the preview below
8. **Success Toast**: "Image uploaded successfully"

## 🔴 Common Errors and Solutions

### Error: "Please upload an image file"
- **Cause**: File is not an image
- **Solution**: Select a JPG, PNG, GIF, or WebP file

### Error: "Image size must be less than 5MB"
- **Cause**: File is too large
- **Solution**: Compress the image or use a smaller file

### Error: "new row violates row-level security policy"
- **Cause**: Not logged in (authentication required)
- **Solution**: 
  1. Make sure you're logged in to the application
  2. Log out and log back in to refresh your session
  3. Check authentication status in browser console:
     ```javascript
     const { data } = await supabase.auth.getUser();
     console.log('User:', data.user?.email);
     console.log('Authenticated:', !!data.user);
     ```
  4. Should show your email and `Authenticated: true`
  5. If still failing, clear browser cache and cookies, then log in again

**Note**: You just need to be logged in (authenticated). Admin role is checked at the application level, not storage level.

### Error: "A product with this slug already exists"
- **Cause**: Slug is not unique
- **Solution**: Change the slug to something unique

### Slug Not Showing in Products List
- **Solution**: 
  1. Refresh the page
  2. Check browser console for errors
  3. Verify slug was saved: Run in SQL editor:
     ```sql
     SELECT id, name, slug FROM products ORDER BY created_at DESC LIMIT 5;
     ```

### Upload Button Not Responding
- **Check**: Is button disabled? (should say "Uploading..." when active)
- **Solution**: 
  1. Refresh the page
  2. Check browser console for JavaScript errors
  3. Try a different browser

## 📊 Verification Queries

Run these in the Supabase SQL Editor to verify:

### Check Products with Slugs:
```sql
SELECT id, name, slug, created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Uploaded Images:
```sql
SELECT 
  bucket_id,
  name,
  created_at,
  metadata->>'size' as size_bytes
FROM storage.objects
ORDER BY created_at DESC
LIMIT 10;
```

### Check Your Admin Status:
```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE id = auth.uid();
```

## 📸 What Should Happen

### Product Creation Flow:
1. Type name → Slug auto-generates
2. Upload image → Image appears in preview
3. Fill other fields → Form validates
4. Click Save → Product created
5. Redirect to products list → New product appears with slug

### Banner Creation Flow:
1. Click Add Banner → Dialog opens
2. Upload image → URL field fills automatically
3. Add title (optional) → Preview updates
4. Click Save → Banner created
5. Dialog closes → Banner appears in list

## 🆘 Still Not Working?

If you've tried everything and it's still not working:

1. **Copy ALL console logs** (right-click in console → Save as...)
2. **Take screenshots** of:
   - The form you're filling
   - Any error messages
   - The browser console
3. **Note**:
   - Which browser you're using
   - Exact steps you took
   - What you expected vs what happened
4. **Check** DEBUGGING.md for more detailed troubleshooting

## ✨ Expected Behavior Summary

| Feature | Expected Result |
|---------|----------------|
| Type product name | Slug auto-generates in lowercase with hyphens |
| Upload product image | Image appears in preview, URL saved |
| Upload banner image | URL field fills, preview shows image |
| Save product | Success message, redirect to list |
| View products list | Slug column shows generated slugs |
| Edit product | Slug field is editable |
| Duplicate slug | Error message shown |
