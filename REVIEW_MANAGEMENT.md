# Review Management System

## Overview
Admin page to manage product reviews with the ability to hide or delete reviews. Hidden reviews are only visible to the user who submitted them and admins.

---

## Features

### 1. View All Reviews
- **Location**: Admin → Reviews (`/admin/reviews`)
- **Display**: All product reviews with product name, user, rating, comment, and images
- **Sorting**: Most recent reviews first
- **Count**: Total review count badge

### 2. Hide Reviews
- **Action**: Click "Hide" button on any review
- **Effect**: Review becomes hidden from public view
- **Visibility**: 
  - ✅ User who submitted the review can still see it
  - ✅ Admins can see all reviews (hidden or not)
  - ❌ Other users cannot see hidden reviews
  - ❌ Public/guests cannot see hidden reviews
- **Visual Indicator**: Orange border and "Hidden" badge
- **Toggle**: Click "Show" to make review public again

### 3. Delete Reviews
- **Action**: Click "Delete" button on any review
- **Confirmation**: Shows confirmation dialog
- **Effect**: Permanently removes review from database
- **Warning**: Cannot be undone

### 4. View Product
- **Action**: Click "View Product →" link
- **Effect**: Navigate to product detail page
- **Purpose**: Quick access to see product context

---

## Database Changes

### Reviews Table
Added `hidden` field:
```sql
ALTER TABLE reviews ADD COLUMN hidden BOOLEAN DEFAULT false;
```

### Row-Level Security Policy
Updated SELECT policy to respect hidden status:
```sql
CREATE POLICY "View reviews based on hidden status"
  ON reviews FOR SELECT
  USING (
    hidden = false                -- Public can see non-hidden reviews
    OR user_id = auth.uid()       -- Users can see their own reviews
    OR is_admin(auth.uid())       -- Admins can see all reviews
  );
```

---

## API Functions

### getAllReviews()
Fetches all reviews with user and product information:
```typescript
const reviews = await getAllReviews();
// Returns: ReviewWithUser[] with product info
```

### toggleReviewHidden(id, hidden)
Toggles review visibility:
```typescript
await toggleReviewHidden(reviewId, true);  // Hide review
await toggleReviewHidden(reviewId, false); // Show review
```

### deleteReview(id)
Permanently deletes a review:
```typescript
await deleteReview(reviewId);
```

---

## TypeScript Types

### Review Interface
```typescript
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  images: string[];
  hidden: boolean;           // ← New field
  created_at: string;
  updated_at: string;
}
```

### ReviewWithUser Interface
```typescript
export interface ReviewWithUser extends Review {
  user: {
    username: string;
  };
  product?: {                // ← New field
    name: string;
    slug: string;
  };
}
```

---

## UI Components

### AdminReviews Page
**Location**: `/src/pages/admin/AdminReviews.tsx`

**Features**:
- Review list with product name and user info
- Star rating display
- Review images gallery
- Hide/Show toggle button
- Delete button with confirmation
- Link to view product
- Visual indicator for hidden reviews
- Empty state when no reviews

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Manage Reviews              [X Total Reviews]│
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Product Name          [Hidden] [Hide] [X]│ │
│ │ By: username • Date • ⭐⭐⭐⭐⭐          │ │
│ │                                         │ │
│ │ Review comment text...                  │ │
│ │ [img] [img] [img]                       │ │
│ │ View Product →                          │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Another Product                [Show] [X]│ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## User Experience

### For Admins
1. **Navigate**: Admin → Reviews
2. **View**: See all reviews (hidden and visible)
3. **Hide**: Click "Hide" to hide inappropriate reviews
4. **Show**: Click "Show" to make hidden reviews public again
5. **Delete**: Click "Delete" → Confirm to permanently remove
6. **Navigate**: Click "View Product" to see product page

### For Users (Review Submitter)
1. **Submit Review**: After order is delivered
2. **View Own Review**: Always visible on product page
3. **Hidden Review**: If admin hides it:
   - ✅ You can still see your review
   - ❌ Other users cannot see it
   - 📝 No notification that it's hidden

### For Other Users/Public
1. **View Reviews**: See all non-hidden reviews
2. **Hidden Reviews**: Cannot see reviews hidden by admin
3. **No Indication**: No way to know a review was hidden

---

## Security Model

### Three-Layer Visibility Control

**Layer 1: Database RLS Policy**
```sql
-- Reviews are visible if:
hidden = false              -- Not hidden
OR user_id = auth.uid()     -- Own review
OR is_admin(auth.uid())     -- Admin
```

**Layer 2: Application Logic**
- Admin page shows all reviews
- Product pages respect RLS automatically
- User profile shows own reviews

**Layer 3: UI Indicators**
- Orange border for hidden reviews (admin only)
- "Hidden" badge (admin only)
- Hide/Show toggle (admin only)

---

## Use Cases

### Use Case 1: Hide Inappropriate Review
**Scenario**: User posts offensive review

**Steps**:
1. Admin goes to Reviews page
2. Finds the offensive review
3. Clicks "Hide" button
4. Review is hidden from public
5. User can still see their own review
6. Admin can unhide later if needed

### Use Case 2: Delete Spam Review
**Scenario**: Spam review detected

**Steps**:
1. Admin goes to Reviews page
2. Finds the spam review
3. Clicks "Delete" button
4. Confirms deletion
5. Review is permanently removed
6. Cannot be recovered

### Use Case 3: Temporarily Hide Review
**Scenario**: Review needs investigation

**Steps**:
1. Admin hides review during investigation
2. Review hidden from public
3. User still sees their review
4. After investigation, admin shows review again
5. Review becomes public again

---

## Testing

### Test 1: Hide Review (Admin)
1. Login as admin
2. Go to Admin → Reviews
3. Find any review
4. Click "Hide" button
5. ✅ Review shows orange border and "Hidden" badge
6. ✅ Button changes to "Show"

### Test 2: View Hidden Review (User)
1. Admin hides a review
2. Login as the user who submitted the review
3. Go to the product page
4. ✅ User can still see their own review
5. ✅ No indication that it's hidden

### Test 3: Hidden Review Not Visible (Public)
1. Admin hides a review
2. Logout (or use different user)
3. Go to the product page
4. ✅ Hidden review is not visible
5. ✅ Other reviews are visible

### Test 4: Show Review (Admin)
1. Login as admin
2. Go to Admin → Reviews
3. Find a hidden review
4. Click "Show" button
5. ✅ Orange border and badge disappear
6. ✅ Button changes to "Hide"
7. ✅ Review becomes public again

### Test 5: Delete Review (Admin)
1. Login as admin
2. Go to Admin → Reviews
3. Click "Delete" on any review
4. ✅ Confirmation dialog appears
5. Click "Delete" to confirm
6. ✅ Review is removed from list
7. ✅ Review is gone from product page

### Test 6: View Product from Review
1. Login as admin
2. Go to Admin → Reviews
3. Click "View Product →" link
4. ✅ Navigates to product detail page
5. ✅ Shows correct product

---

## Navigation

### Admin Sidebar
```
Dashboard
Products
Orders
Vouchers
Users
Reviews        ← New
Announcements
Banners
Settings
```

### Route
```
/admin/reviews
```

---

## Visual Design

### Normal Review
```
┌─────────────────────────────────────────┐
│ Product Name              [Hide] [Delete]│
│ By: username • Date • ⭐⭐⭐⭐⭐          │
│                                         │
│ Great product! Highly recommend...      │
│ [img] [img]                             │
│ View Product →                          │
└─────────────────────────────────────────┘
```

### Hidden Review (Admin View)
```
┌─────────────────────────────────────────┐ ← Orange border
│ Product Name    [🚫 Hidden] [Show] [Delete]│
│ By: username • Date • ⭐⭐⭐⭐⭐          │
│                                         │
│ Inappropriate content...                │
│ View Product →                          │
└─────────────────────────────────────────┘
```

---

## Benefits

### For Admins
✅ **Moderation Control**: Hide inappropriate reviews
✅ **Flexible Management**: Hide temporarily or delete permanently
✅ **Quick Access**: View product directly from review
✅ **Visual Feedback**: Clear indicators for hidden reviews
✅ **Bulk View**: See all reviews in one place

### For Users
✅ **Own Reviews Visible**: Always see your own reviews
✅ **No Notification**: No embarrassment if review is hidden
✅ **Fair System**: Can still see what you wrote

### For Platform
✅ **Content Quality**: Remove spam and inappropriate content
✅ **User Trust**: Maintain quality review system
✅ **Flexibility**: Hide vs delete options
✅ **Transparency**: Users keep access to their content

---

## Files Modified/Created

### Created
- ✅ `/src/pages/admin/AdminReviews.tsx` - Admin reviews management page

### Modified
- ✅ `/src/types/types.ts` - Added hidden field to Review interface
- ✅ `/src/db/api.ts` - Added getAllReviews and toggleReviewHidden functions
- ✅ `/src/routes.tsx` - Added AdminReviews route
- ✅ `/src/components/layouts/AdminLayout.tsx` - Added Reviews navigation
- ✅ `/src/components/ReviewDialog.tsx` - Added hidden field to createReview

### Database
- ✅ Migration: `add_hidden_field_to_reviews` - Added hidden column
- ✅ Migration: `update_reviews_policies_for_hidden` - Updated RLS policy

---

## Summary

Successfully implemented a comprehensive review management system that allows admins to moderate product reviews by hiding or deleting them. Hidden reviews remain visible to the submitter and admins, providing a balanced approach to content moderation while maintaining transparency with users.

**Key Features**:
- ✅ Admin page to view all reviews
- ✅ Hide/show reviews with visual indicators
- ✅ Delete reviews with confirmation
- ✅ Hidden reviews visible only to submitter and admin
- ✅ Quick navigation to product pages
- ✅ Secure RLS policies
- ✅ Clean, intuitive UI
