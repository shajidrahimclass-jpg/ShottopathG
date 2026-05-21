# Separate Page Banners Feature

## Overview
Home page and Products page now have independent banner carousels. Admins can choose which page each banner appears on when creating or editing banners.

---

## Problem Solved

### Before ❌
- All banners appeared on both home page and products page
- Changing a banner on home page also changed it on products page
- No way to have different banners for different pages
- "Discover Products" heading on products page had no banner

### After ✅
- Home page has its own set of banners
- Products page has its own set of banners
- Banners are completely independent
- Admin can choose which page each banner appears on
- Products page now has a banner carousel above "Discover Products"

---

## Features

### 1. Page Selection
When creating or editing a banner, admin can choose:
- **Home Page**: Banner appears only on home page
- **Products Page**: Banner appears only on products page

### 2. Independent Carousels
- Home page shows only home page banners
- Products page shows only products page banners
- Each page has its own auto-rotating carousel
- Navigation arrows and dots work independently

### 3. Banner Management
- Admin can see which page each banner is for in the table
- Page column shows "Home" or "Products"
- Easy to manage banners for different pages

---

## How to Use

### Creating a Banner

1. **Go to Admin Panel**
   - Navigate to: `/pass-028276492372/shottopath/admin/banners`
   - Or: Admin Panel → Banners

2. **Click "Add Banner"**

3. **Fill in Banner Details**
   - **Image**: Upload or enter image URL
   - **Title**: Optional banner title
   - **Link**: Optional link when banner is clicked
   - **Page**: Choose "Home Page" or "Products Page" ⭐
   - **Display Order**: Lower numbers appear first
   - **Active**: Toggle to show/hide banner

4. **Click "Add Banner"**

5. **Done!** Banner will appear on the selected page

### Editing a Banner

1. **Go to Banners Page**
   - Navigate to: `/pass-028276492372/shottopath/admin/banners`

2. **Click Edit Button** (pencil icon) on the banner

3. **Update Details**
   - Change any field including the page
   - Can move banner from home to products or vice versa

4. **Click "Update Banner"**

5. **Done!** Changes are live immediately

### Viewing Banners

**Home Page**:
- Visit: `/` or home page
- See home page banners in carousel
- Auto-rotates every 3 seconds

**Products Page**:
- Visit: `/products`
- See products page banners in carousel
- Auto-rotates every 3 seconds
- Banner appears above "Discover Products" heading

---

## Banner Table Columns

| Column | Description |
|--------|-------------|
| **Preview** | Thumbnail of banner image |
| **Title** | Banner title (or "No title") |
| **Page** | Shows "Home" or "Products" |
| **Order** | Display order number |
| **Status** | Active or Inactive |
| **Actions** | Edit and Delete buttons |

---

## Technical Details

### Database Schema
```sql
-- Added page field to banners table
ALTER TABLE banners ADD COLUMN page TEXT DEFAULT 'home';

-- Constraint ensures valid values
ALTER TABLE banners ADD CONSTRAINT banners_page_check 
  CHECK (page IN ('home', 'products'));
```

### TypeScript Interface
```typescript
export interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link: string | null;
  display_order: number;
  is_active: boolean;
  page: 'home' | 'products';  // New field
  created_at: string;
  updated_at: string;
}
```

### API Function
```typescript
// Updated to accept page parameter
export const getActiveBanners = async (
  page: 'home' | 'products' = 'home'
): Promise<Banner[]> => {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('page', page)  // Filter by page
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};
```

### Usage in Pages

**HomePage**:
```typescript
const [banners, setBanners] = useState<Banner[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const bannersData = await getActiveBanners('home');
    setBanners(bannersData);
  };
  fetchData();
}, []);
```

**ProductsPage**:
```typescript
const [banners, setBanners] = useState<Banner[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const bannersData = await getActiveBanners('products');
    setBanners(bannersData);
  };
  fetchData();
}, []);
```

---

## Banner Carousel Features

### Auto-Rotation
- Banners automatically rotate every 3 seconds
- Smooth fade transition between banners
- Pauses when user manually navigates

### Navigation Controls
- **Left Arrow**: Previous banner
- **Right Arrow**: Next banner
- **Dots**: Click to jump to specific banner
- Active dot is wider and fully opaque

### Responsive Design
- **Mobile**: 200px height
- **Tablet**: 300px height
- **Desktop**: 400px height
- Rounded corners and shadow for modern look

### Interactive Elements
- Clickable if link is provided
- Title overlay at bottom (if provided)
- Hover effects on navigation buttons
- Smooth transitions and animations

---

## Examples

### Example 1: Home Page Banner
```
Title: "Welcome to Shottopoth"
Image: Hero image with products
Link: /products
Page: Home Page
Order: 1
Active: Yes
```
**Result**: Shows on home page only, first in carousel

### Example 2: Products Page Banner
```
Title: "New Arrivals"
Image: Latest products showcase
Link: /products?category=new
Page: Products Page
Order: 1
Active: Yes
```
**Result**: Shows on products page only, first in carousel

### Example 3: Sale Banner (Home)
```
Title: "50% Off Sale!"
Image: Sale promotional image
Link: /products?sale=true
Page: Home Page
Order: 2
Active: Yes
```
**Result**: Shows on home page only, second in carousel

### Example 4: Category Banner (Products)
```
Title: "Electronics Collection"
Image: Electronics category image
Link: /products?category=electronics
Page: Products Page
Order: 2
Active: Yes
```
**Result**: Shows on products page only, second in carousel

---

## Migration Notes

### Existing Banners
- All existing banners were set to `page = 'home'`
- They continue to show on home page
- Edit them to move to products page if needed

### No Breaking Changes
- Existing functionality preserved
- Home page banners work as before
- New products page banners are additive

---

## Benefits

### For Admins
✅ **Flexible Management**: Control banners for each page independently
✅ **Clear Organization**: See which page each banner is for
✅ **Easy Updates**: Change page assignment anytime
✅ **Better Control**: Customize messaging per page

### For Users
✅ **Relevant Content**: See banners appropriate for current page
✅ **Better Experience**: Home page and products page have unique visuals
✅ **Consistent UI**: Same carousel experience on both pages
✅ **Engaging**: More visual content on products page

### For Business
✅ **Targeted Marketing**: Different promotions for different pages
✅ **Increased Engagement**: Products page now has visual appeal
✅ **Better Conversions**: Relevant banners for each context
✅ **Professional Look**: Polished, complete design

---

## Testing

### Test 1: Create Home Banner
1. Create banner with page = "Home Page"
2. Visit home page
3. ✅ Banner appears in carousel
4. Visit products page
5. ✅ Banner does NOT appear

### Test 2: Create Products Banner
1. Create banner with page = "Products Page"
2. Visit products page
3. ✅ Banner appears in carousel
4. Visit home page
5. ✅ Banner does NOT appear

### Test 3: Multiple Banners
1. Create 3 home banners
2. Create 3 products banners
3. Visit home page
4. ✅ See only 3 home banners rotating
5. Visit products page
6. ✅ See only 3 products banners rotating

### Test 4: Change Page
1. Create banner for home page
2. Edit banner, change to products page
3. Visit home page
4. ✅ Banner no longer appears
5. Visit products page
6. ✅ Banner now appears

### Test 5: Display Order
1. Create banners with different orders
2. Lower order numbers appear first
3. ✅ Order works independently per page

---

## Troubleshooting

### Issue: Banner appears on wrong page
**Solution**:
- Edit the banner
- Check the "Page" field
- Select correct page (Home or Products)
- Save changes

### Issue: Banner doesn't appear anywhere
**Solution**:
- Check "Active" toggle is ON
- Verify image URL is valid
- Check display order is set
- Ensure page is selected

### Issue: All banners show on both pages
**Solution**:
- This shouldn't happen with new system
- Check database: `SELECT * FROM banners;`
- Verify page field has correct values
- Re-edit banners if needed

### Issue: No banners on products page
**Solution**:
- Create banners with page = "Products Page"
- Make sure they're active
- Check they have valid images
- Visit products page to verify

---

## Summary

Successfully separated home page and products page banners. Each page now has its own independent banner carousel. Admins can choose which page each banner appears on when creating or editing banners. This provides better control over page-specific content and improves the overall user experience.

**Key Points**:
- ✅ Independent banners for home and products pages
- ✅ Page selector in banner form
- ✅ Page column in banners table
- ✅ Products page now has banner carousel
- ✅ All existing banners preserved on home page
- ✅ Easy to manage and update
- ✅ No breaking changes
