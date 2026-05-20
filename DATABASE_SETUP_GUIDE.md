# Database Setup Guide for Your Supabase Instance

## ✅ Configuration Complete

Your application has been successfully configured to connect to your Supabase database:

- **Database URL**: `https://rixikhernphntvuwfzcy.supabase.co`
- **App ID**: `shottopath`

## 📋 Required Steps to Complete Setup

### Step 1: Apply Database Migrations

Your application has **76 migration files** that need to be applied to your Supabase database. These migrations create all the necessary tables, policies, and functions.

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   cd /workspace/app-9cyfgucqbpj5
   supabase link --project-ref rixikhernphntvuwfzcy
   ```

3. Apply all migrations:
   ```bash
   supabase db push
   ```

#### Option B: Manual Application via Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rixikhernphntvuwfzcy
2. Navigate to **SQL Editor**
3. Execute each migration file in order (00001 through 00076)
4. Migration files are located in: `/workspace/app-9cyfgucqbpj5/supabase/migrations/`

### Step 2: Set Up Authentication (Google OAuth)

If you want to use Google OAuth authentication:

1. Go to **Authentication** → **Providers** in your Supabase Dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add authorized redirect URLs:
   - `https://rixikhernphntvuwfzcy.supabase.co/auth/v1/callback`
   - Your production domain callback URL

### Step 3: Configure Storage Buckets (If Using Image Upload)

If your application uses image uploads:

1. Go to **Storage** in your Supabase Dashboard
2. Create necessary buckets (check your migration files for bucket names)
3. Set appropriate policies for public/private access

### Step 4: Set Up Row Level Security (RLS) Policies

All RLS policies are included in the migration files. After applying migrations, verify:

1. Go to **Authentication** → **Policies**
2. Check that policies are enabled for all tables
3. Test with different user roles (admin, user, guest)

## 🗂️ Database Schema Overview

Your application includes the following main tables:

### Core Tables
- **profiles**: User profiles with role-based access
- **products**: Product catalog with inventory management
- **categories**: Product categories and subcategories
- **orders**: Order management (supports both authenticated and guest orders)
- **order_items**: Individual items in each order
- **cart_items**: Shopping cart for authenticated users

### Delivery & Location
- **delivery_addresses**: User saved addresses
- **delivery_locations**: Available delivery locations with charges

### Payment & Discounts
- **vouchers**: Discount codes and promotions
- **payment_gateways**: Payment method configuration (bKash, Nagad, COD)

### Reviews & Ratings
- **reviews**: Product reviews and ratings

### Admin Features
- **banners**: Homepage banners and promotions
- **app_settings**: Global application settings (including force_sign_in toggle)
- **notifications**: User notifications

### Communication
- **order_messages**: Order-related messaging between users and admin

## 🔐 Important Security Notes

### Service Role Key

You'll need the **Service Role Key** for:
- Admin operations
- Server-side operations
- Edge Functions

**⚠️ CRITICAL**: Never expose the Service Role Key in client-side code!

To get your Service Role Key:
1. Go to **Settings** → **API** in Supabase Dashboard
2. Copy the `service_role` key (not the `anon` key)
3. Store it securely in environment variables for server-side use only

### Default Admin User

After applying migrations, you'll need to create an admin user:

1. Sign up through your application
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user and note the UUID
4. Go to **SQL Editor** and run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = 'YOUR_USER_UUID_HERE';
   ```

## 🧪 Testing Your Setup

### 1. Test Database Connection
- Start your application
- Check browser console for any Supabase connection errors
- Verify that the homepage loads without errors

### 2. Test Authentication
- Try signing up with email/password
- Try signing in with Google (if configured)
- Verify profile is created in `profiles` table

### 3. Test Guest Checkout
- Add products to cart without logging in
- Proceed to checkout
- Verify guest information form appears
- Complete a test order
- Check `orders` table for guest order (user_id should be NULL)

### 4. Test Admin Features
- Log in as admin user
- Access admin dashboard
- Verify you can manage products, orders, categories, etc.

## 📊 Migration Files Summary

Key migrations include:

- **00001**: Initial schema (core tables)
- **00008-00021**: Payment and order enhancements
- **00039**: Order notes
- **00041**: Review policies
- **00075**: Force Sign-In toggle feature
- **00076**: Guest checkout support (latest)

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All 76 migrations applied successfully
- [ ] Admin user created and tested
- [ ] Google OAuth configured (if using)
- [ ] Storage buckets created (if using image upload)
- [ ] RLS policies verified and tested
- [ ] Payment gateway credentials configured
- [ ] Test orders placed (both authenticated and guest)
- [ ] Email notifications configured (optional)
- [ ] Production domain added to Supabase allowed origins

## 🆘 Troubleshooting

### "relation does not exist" errors
- Migrations not applied. Run `supabase db push` or apply manually.

### "permission denied" errors
- RLS policies not configured correctly. Check migration files.

### Authentication not working
- Verify redirect URLs in Supabase Dashboard match your domain.
- Check that Google OAuth credentials are correct.

### Guest checkout not working
- Ensure migration 00076 is applied.
- Check that `force_sign_in` setting in `app_settings` table is set to `false`.

## 📞 Support

If you encounter issues:

1. Check Supabase logs: Dashboard → **Logs**
2. Check browser console for client-side errors
3. Verify all migrations are applied in correct order
4. Ensure environment variables are loaded correctly

## 🎉 Next Steps

Once setup is complete:

1. **Configure App Settings**: Go to Admin Dashboard → Settings
2. **Add Products**: Start adding your product catalog
3. **Set Up Delivery Locations**: Configure delivery areas and charges
4. **Create Banners**: Add promotional banners to homepage
5. **Test Complete Flow**: Place test orders as both guest and authenticated user
6. **Configure Payment Gateways**: Add bKash/Nagad account numbers

---

**Note**: This application is now configured to use your Supabase database. All data will be stored in your instance at `https://rixikhernphntvuwfzcy.supabase.co`.
