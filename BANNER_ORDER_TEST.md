# Quick Test Guide: Banner Save & Order Cancellation

## ✅ Test 1: Banner Save

### Steps:
1. **Log in as admin**
2. **Navigate**: Admin → Banners
3. **Click**: "Add New Banner" button
4. **Upload Image**:
   - Click "Upload" button
   - Select an image file (JPG, PNG, max 5MB)
   - Wait for upload to complete
   - Image URL should auto-fill
5. **Add Title** (optional): e.g., "Summer Sale"
6. **Set Active**: Toggle switch ON
7. **Set Display Order**: e.g., 1
8. **Click**: "Save" button

### Expected Result:
- ✅ Success toast: "Banner created successfully"
- ✅ Dialog closes
- ✅ New banner appears in the list
- ✅ Banner displays on homepage

### If It Fails:
- Check browser console for errors
- Verify you're logged in
- Check image file size (< 5MB)
- Try refreshing the page

---

## ✅ Test 2: Banner Update

### Steps:
1. **Log in as admin**
2. **Navigate**: Admin → Banners
3. **Find existing banner**
4. **Click**: Edit icon (pencil)
5. **Change title**: e.g., "Winter Sale"
6. **Click**: "Save" button

### Expected Result:
- ✅ Success toast: "Banner updated successfully"
- ✅ Dialog closes
- ✅ Banner title updated in list
- ✅ Changes reflect on homepage

---

## ✅ Test 3: Order Cancellation (User)

### Steps:
1. **Log in as regular user** (not admin)
2. **Create an order first** (if you don't have one):
   - Browse products
   - Add to cart
   - Go to checkout
   - Complete order
3. **Navigate**: My Orders (or Orders page)
4. **Find pending order**
5. **Click**: "Cancel Order" button
6. **Enter reason**: e.g., "Changed my mind"
7. **Click**: "Confirm" or "Cancel Order"

### Expected Result:
- ✅ Success toast: "Order cancelled successfully"
- ✅ Order status changes to "Cancelled"
- ✅ Cancel button disappears (can't cancel twice)
- ✅ Order shows red "Cancelled" badge

### If It Fails:
- Check order status (can only cancel pending/confirmed orders)
- Verify you're logged in
- Check browser console for errors
- Refresh the page and try again

---

## ✅ Test 4: Admin Order Management

### Steps:
1. **Log in as admin**
2. **Navigate**: Admin → Orders
3. **Find any order**
4. **Change status**:
   - Pending → Confirmed
   - Confirmed → Delivered
   - Or any status → Cancelled
5. **Click**: "Update Status" or "Save"

### Expected Result:
- ✅ Success toast: "Order updated successfully"
- ✅ Order status changes
- ✅ Updated timestamp changes
- ✅ User receives notification (if applicable)

---

## 🔴 Common Issues

### Issue: "Failed to save banner"
**Solutions**:
- Make sure you're logged in
- Check image URL is valid
- Try uploading image instead of entering URL
- Check browser console for specific error

### Issue: "Cannot cancel order"
**Possible Reasons**:
- Order already delivered (can't cancel delivered orders)
- Order already cancelled (can't cancel twice)
- Not logged in
- Not your order (can only cancel own orders)

**Solutions**:
- Check order status
- Refresh the page
- Log out and log back in
- Verify order belongs to you

### Issue: "Permission denied"
**Solutions**:
- Make sure you're logged in
- For banners: Must be admin
- For orders: Must own the order (or be admin)
- Try logging out and back in

---

## 📊 Verification

### Check Banner in Database:
```sql
SELECT id, title, image_url, is_active, display_order
FROM banners
ORDER BY created_at DESC
LIMIT 5;
```

### Check Order Status:
```sql
SELECT id, status, user_id, total, created_at, updated_at
FROM orders
WHERE status = 'cancelled'
ORDER BY updated_at DESC
LIMIT 5;
```

### Check Your User ID:
```sql
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE id = auth.uid();
```

---

## ✨ Success Indicators

### Banner Save Working:
- ✅ No RLS errors in console
- ✅ Banner appears in list immediately
- ✅ Banner displays on homepage
- ✅ Can edit and delete banners

### Order Cancellation Working:
- ✅ Cancel button visible on pending/confirmed orders
- ✅ Cancel button hidden on delivered/cancelled orders
- ✅ Status changes to "Cancelled" after confirmation
- ✅ Notification created for user
- ✅ Order cannot be cancelled again

### Admin Order Management Working:
- ✅ Can change any order status
- ✅ Can view all orders (not just own)
- ✅ Can update orders from any user
- ✅ All status transitions work

---

## 🆘 Still Not Working?

1. **Open browser console** (F12)
2. **Try the action again**
3. **Copy any error messages**
4. **Check**:
   - Are you logged in?
   - What's your role? (admin or user)
   - What's the current order status?
   - Is the image file valid?
5. **Try**:
   - Refresh the page
   - Log out and log back in
   - Clear browser cache
   - Try in incognito mode
6. **Provide**:
   - Console error messages
   - Screenshots
   - Exact steps you took
   - What you expected vs what happened
