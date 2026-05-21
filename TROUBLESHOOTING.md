# Troubleshooting Guide

Common issues and solutions for Shottopath e-commerce platform.

## 🔴 Profile Shows "Not provided", "Role", "Member Since", "N/A"

### Symptoms
- Profile page displays incomplete information
- Username shows "Not available"
- Email shows "Not provided"
- Role shows empty or undefined
- Member Since shows "N/A"
- Warning banner appears: "Database Setup Required"

### Cause
Your database migrations haven't been applied yet. The `profiles` table doesn't exist in your Supabase database.

### Solution

**Quick Fix (3 steps):**

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Link Your Project**
   ```bash
   cd /workspace/app-9cyfgucqbpj5
   supabase link --project-ref rixikhernphntvuwfzcy
   ```
   
   You'll be asked for your database password. Get it from:
   - Supabase Dashboard → Settings → Database → Database password

3. **Apply Migrations**
   ```bash
   ./apply-migrations.sh
   ```
   
   Or manually:
   ```bash
   supabase db push
   ```

4. **Refresh Your Browser**
   - After migrations complete, refresh the page
   - Your profile data should now display correctly

### Verification
After applying migrations, you should see:
- ✅ Your email address
- ✅ Your username (if set)
- ✅ Your role (default: "user")
- ✅ Member since date
- ✅ No warning banners

---

## 🔴 "Cannot Read Property of Null" Errors

### Symptoms
- Console errors about null properties
- Pages fail to load
- Blank screens

### Cause
Database tables don't exist or RLS policies are blocking access.

### Solution
1. Apply all migrations (see above)
2. Check RLS policies in Supabase Dashboard
3. Verify you're logged in with correct credentials

---

## 🔴 Login/Signup Not Working

### Symptoms
- Can't create new account
- Login fails with no error message
- Redirected back to login page

### Possible Causes & Solutions

**1. Database Not Set Up**
- Apply migrations first (see above)

**2. Email Confirmation Required**
- Check Supabase Dashboard → Authentication → Settings
- Disable "Enable email confirmations" for testing
- Or check your email for confirmation link

**3. Profile Creation Failed**
- Check browser console for errors
- Verify `profiles` table exists
- Check RLS policies allow INSERT for authenticated users

**4. Google OAuth Not Configured**
- Go to Supabase Dashboard → Authentication → Providers
- Enable Google provider
- Add your Google OAuth credentials
- Add redirect URLs

---

## 🔴 Products Not Showing

### Symptoms
- Homepage shows no products
- Product list is empty
- "No products found" message

### Cause
No products in database yet.

### Solution

**Option 1: Add Products via Admin Dashboard**
1. Create admin user (see CREATE_ADMIN_USER.sql)
2. Log in as admin
3. Go to Admin Dashboard → Products
4. Add products manually

**Option 2: Import Sample Data**
- See DATABASE_SETUP_GUIDE.md for sample data scripts
- Or create your own SQL insert statements

---

## 🔴 Guest Checkout Not Working

### Symptoms
- Guest users can't proceed to checkout
- Redirected to login page
- "Please sign in" message appears

### Cause
Force Sign-In toggle is enabled.

### Solution
1. Log in as admin
2. Go to Admin Dashboard → Settings
3. Find "Force Sign-In for Purchases" toggle
4. Turn it OFF to allow guest checkout
5. Test by logging out and adding items to cart

---

## 🔴 Orders Not Appearing

### Symptoms
- Order placed successfully but not showing in Orders page
- Admin can't see orders
- Order count shows 0

### Possible Causes & Solutions

**1. RLS Policies Blocking Access**
- Check Supabase Dashboard → Authentication → Policies
- Verify policies for `orders` table
- Ensure users can SELECT their own orders
- Ensure admins can SELECT all orders

**2. Order Created with Wrong User ID**
- Check `orders` table in Supabase
- Verify `user_id` matches your auth user ID
- For guest orders, `user_id` should be NULL

**3. Order Items Not Created**
- Check `order_items` table
- Verify items were inserted with correct `order_id`

---

## 🔴 Payment Gateway Errors

### Symptoms
- bKash/Nagad payment fails
- "Payment gateway not configured" error
- Redirect to payment page fails

### Solution
1. Log in as admin
2. Go to Admin Dashboard → Settings → Payment Gateways
3. Add bKash account number
4. Add Nagad account number
5. Enable the payment methods
6. Test with a small order

---

## 🔴 Images Not Loading

### Symptoms
- Product images show broken
- Placeholder images appear
- 404 errors for image URLs

### Possible Causes & Solutions

**1. Storage Bucket Not Created**
- Go to Supabase Dashboard → Storage
- Create required buckets (check migration files for names)
- Set appropriate policies (public read for product images)

**2. Invalid Image URLs**
- Check product data in database
- Verify image URLs are complete and valid
- Re-upload images if necessary

**3. CORS Issues**
- Check Supabase Storage CORS settings
- Add your domain to allowed origins

---

## 🔴 Admin Dashboard Not Accessible

### Symptoms
- Can't access /admin routes
- Redirected to home page
- "Access denied" message

### Cause
User role is not set to 'admin'.

### Solution
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user and copy the UUID
3. Go to SQL Editor
4. Run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = 'YOUR_USER_UUID_HERE';
   ```
5. Log out and log back in
6. Try accessing /admin again

---

## 🔴 Delivery Locations Not Showing

### Symptoms
- Checkout page shows no delivery locations
- Can't select delivery area
- "No locations available" message

### Solution
1. Log in as admin
2. Go to Admin Dashboard → Delivery Locations
3. Add delivery locations with charges
4. Enable the locations
5. Test checkout flow

---

## 🔴 Voucher Codes Not Working

### Symptoms
- "Invalid voucher code" error
- Discount not applied
- Voucher input doesn't work

### Possible Causes & Solutions

**1. Voucher Doesn't Exist**
- Create vouchers in Admin Dashboard → Vouchers

**2. Voucher Expired**
- Check expiry date
- Update or create new voucher

**3. Voucher Usage Limit Reached**
- Check usage count vs. max uses
- Create new voucher if needed

**4. Minimum Order Not Met**
- Check voucher minimum order amount
- Add more items to cart

---

## 🔴 Console Errors: "relation does not exist"

### Symptoms
- Console shows: `relation "table_name" does not exist`
- Database queries fail
- Features don't work

### Cause
Database migrations not applied.

### Solution
Apply all migrations (see first section above).

---

## 🔴 "Authentication Failed" Errors

### Symptoms
- Can't connect to Supabase
- All API calls fail
- "Invalid API key" errors

### Possible Causes & Solutions

**1. Wrong Credentials in .env**
- Check `.env` file
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Restart dev server after changing .env

**2. Expired or Invalid Keys**
- Get new keys from Supabase Dashboard → Settings → API
- Update .env file
- Restart dev server

**3. Network Issues**
- Check internet connection
- Verify Supabase project is active
- Check Supabase status page

---

## 🔴 App Won't Start / Build Errors

### Symptoms
- `npm run dev` fails
- Build errors
- TypeScript errors

### Solution

**1. Install Dependencies**
```bash
npm install
```

**2. Clear Cache**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

**3. Check Node Version**
```bash
node --version  # Should be 18.x or higher
```

**4. Run Lint**
```bash
npm run lint
```

---

## 📞 Still Having Issues?

### Debug Checklist
- [ ] Migrations applied successfully
- [ ] .env file has correct credentials
- [ ] Dev server restarted after .env changes
- [ ] Browser cache cleared
- [ ] Logged in with correct account
- [ ] Admin role set (if accessing admin features)
- [ ] RLS policies configured correctly
- [ ] Storage buckets created (if using images)
- [ ] Payment gateways configured (if testing payments)
- [ ] Delivery locations added (if testing checkout)

### Check Logs
1. **Browser Console**: F12 → Console tab
2. **Network Tab**: F12 → Network tab
3. **Supabase Logs**: Dashboard → Logs
4. **Terminal**: Check dev server output

### Documentation
- `QUICK_START.md` - Fast setup guide
- `DATABASE_SETUP_GUIDE.md` - Detailed setup
- `CREATE_ADMIN_USER.sql` - Admin user creation
- `SETUP_COMPLETE.txt` - Configuration summary

### Common Commands
```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Apply migrations
./apply-migrations.sh

# Link Supabase project
supabase link --project-ref rixikhernphntvuwfzcy

# Check Supabase status
supabase status
```

---

## ✅ Success Indicators

Your setup is complete when:
- ✅ Profile page shows your information correctly
- ✅ Products display on homepage
- ✅ Can add items to cart
- ✅ Checkout flow works (both guest and authenticated)
- ✅ Orders appear in Orders page
- ✅ Admin dashboard accessible (if admin user)
- ✅ No console errors
- ✅ No warning banners

---

**Last Updated**: 2026-02-02
**Version**: v725
