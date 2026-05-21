# Quick Test Guide: Review Management

## ✅ Test 1: Access Admin Reviews Page (30 seconds)

### Steps:
1. **Login as admin**
2. **Navigate**: Admin → Reviews (in sidebar)
3. **Check page loads**

### Expected Result:
```
✅ Reviews page loads
✅ Shows "Manage Reviews" title
✅ Shows total review count badge
✅ Lists all reviews (if any exist)
```

---

## ✅ Test 2: Hide a Review (1 minute)

### Steps:
1. **Login as admin**
2. **Go to**: Admin → Reviews
3. **Find any review**
4. **Click**: "Hide" button
5. **Observe changes**

### Expected Result:
```
✅ Success toast: "Review hidden"
✅ Review card gets orange border
✅ "Hidden" badge appears
✅ Button changes to "Show"
```

---

## ✅ Test 3: Hidden Review Visibility - User (1 minute)

### Setup:
- Admin has hidden a review from User A

### Steps:
1. **Login as User A** (who submitted the review)
2. **Go to the product page** where review was submitted
3. **Scroll to reviews section**
4. **Look for your review**

### Expected Result:
```
✅ User can still see their own review
✅ No indication that it's hidden
✅ Review displays normally
```

---

## ✅ Test 4: Hidden Review Visibility - Other Users (1 minute)

### Setup:
- Admin has hidden a review from User A

### Steps:
1. **Login as User B** (different user)
2. **Go to the same product page**
3. **Scroll to reviews section**
4. **Look for User A's review**

### Expected Result:
```
✅ User B cannot see the hidden review
✅ Only non-hidden reviews are visible
✅ No indication that a review is hidden
```

---

## ✅ Test 5: Show Hidden Review (1 minute)

### Steps:
1. **Login as admin**
2. **Go to**: Admin → Reviews
3. **Find a hidden review** (orange border)
4. **Click**: "Show" button
5. **Check product page**

### Expected Result:
```
✅ Success toast: "Review shown"
✅ Orange border disappears
✅ "Hidden" badge disappears
✅ Button changes to "Hide"
✅ Review becomes public again
✅ All users can now see the review
```

---

## ✅ Test 6: Delete Review (1 minute)

### Steps:
1. **Login as admin**
2. **Go to**: Admin → Reviews
3. **Find any review**
4. **Click**: "Delete" button
5. **Read confirmation dialog**
6. **Click**: "Delete" to confirm

### Expected Result:
```
✅ Confirmation dialog appears
✅ Warning: "This action cannot be undone"
✅ Success toast: "Review deleted successfully"
✅ Review disappears from list
✅ Review is gone from product page
✅ Cannot be recovered
```

---

## ✅ Test 7: View Product from Review (30 seconds)

### Steps:
1. **Login as admin**
2. **Go to**: Admin → Reviews
3. **Find any review**
4. **Click**: "View Product →" link

### Expected Result:
```
✅ Navigates to product detail page
✅ Shows correct product
✅ URL uses product slug
```

---

## ✅ Test 8: Review Images Display (30 seconds)

### Steps:
1. **Login as admin**
2. **Go to**: Admin → Reviews
3. **Find review with images**
4. **Check image display**

### Expected Result:
```
✅ Review images display in gallery
✅ Images are thumbnails (20x20)
✅ Images have rounded borders
✅ Multiple images display in row
```

---

## ✅ Test 9: Empty State (30 seconds)

### Setup:
- No reviews in database

### Steps:
1. **Login as admin**
2. **Go to**: Admin → Reviews

### Expected Result:
```
✅ Shows empty state
✅ Package icon displayed
✅ Message: "No reviews yet"
✅ No error messages
```

---

## ✅ Test 10: Review Count Badge (30 seconds)

### Steps:
1. **Login as admin**
2. **Go to**: Admin → Reviews
3. **Check top-right badge**

### Expected Result:
```
✅ Badge shows total review count
✅ Format: "X Total Reviews"
✅ Updates after delete/hide actions
```

---

## 🔍 Verification Checklist

### Admin Features
- [ ] Can access Reviews page
- [ ] Can see all reviews (hidden and visible)
- [ ] Can hide reviews
- [ ] Can show hidden reviews
- [ ] Can delete reviews
- [ ] Can view product from review
- [ ] Hidden reviews have visual indicator

### User Features
- [ ] Can see own reviews (even if hidden)
- [ ] Cannot see other users' hidden reviews
- [ ] No indication when review is hidden
- [ ] Can submit new reviews normally

### Database
- [ ] Hidden field exists in reviews table
- [ ] RLS policy respects hidden status
- [ ] Admins can see all reviews
- [ ] Users can see own reviews

---

## 🆘 Troubleshooting

### Issue: Cannot access Reviews page
**Solution**:
- Make sure you're logged in as admin
- Check admin role in database
- Try refreshing the page

### Issue: Hide button doesn't work
**Solution**:
- Check browser console for errors
- Verify you're logged in as admin
- Check RLS policies in database

### Issue: Hidden review still visible to public
**Solution**:
- Verify hidden field is true in database
- Check RLS policy is correct
- Clear browser cache
- Try in incognito mode

### Issue: User cannot see own hidden review
**Solution**:
- Verify RLS policy includes user_id check
- Make sure user is logged in
- Check user_id matches review user_id

---

## 📊 Database Verification

### Check Hidden Field Exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND column_name = 'hidden';
```

### Check RLS Policy:
```sql
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'reviews' 
  AND cmd = 'SELECT';
```

### Check Hidden Reviews:
```sql
SELECT id, product_id, user_id, rating, hidden
FROM reviews
WHERE hidden = true;
```

### Test Visibility (as user):
```sql
-- Should only see non-hidden reviews and own reviews
SELECT id, rating, hidden
FROM reviews;
```

---

## ✨ Success Indicators

### Admin View:
✅ **Reviews page accessible**
✅ **All reviews visible (hidden and not)**
✅ **Hide/Show toggle works**
✅ **Delete with confirmation works**
✅ **Visual indicators for hidden reviews**
✅ **Navigation to products works**

### User View:
✅ **Can see own reviews always**
✅ **Cannot see other users' hidden reviews**
✅ **No indication of hidden status**
✅ **Review submission works normally**

### Public View:
✅ **Can see non-hidden reviews**
✅ **Cannot see hidden reviews**
✅ **No indication reviews are hidden**

---

## 🎯 Key Features Working

1. **Hide Review**: Admin can hide inappropriate reviews
2. **Show Review**: Admin can unhide reviews
3. **Delete Review**: Admin can permanently remove reviews
4. **Selective Visibility**: Hidden reviews only visible to submitter and admin
5. **Visual Indicators**: Clear UI for hidden status (admin only)
6. **Product Navigation**: Quick access to product pages
7. **Review Count**: Accurate total count display

---

## 📝 Notes

- Hidden reviews are NOT deleted, just hidden
- Users always see their own reviews
- Admins see all reviews with visual indicators
- Delete is permanent and cannot be undone
- Hide is reversible with Show button
- RLS policies enforce visibility rules at database level

---

## 🎉 Result

Review management system is fully functional with proper visibility controls and admin moderation capabilities!
