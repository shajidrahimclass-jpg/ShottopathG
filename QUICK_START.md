# 🚀 Quick Start: Connect to Your Supabase Database

Your application is now configured to use your Supabase database!

## ✅ What's Already Done

- ✅ Environment variables updated with your database credentials
- ✅ Application configured to connect to: `https://rixikhernphntvuwfzcy.supabase.co`
- ✅ 76 migration files ready to be applied

## 🎯 Quick Setup (3 Steps)

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Link Your Project

```bash
cd /workspace/app-9cyfgucqbpj5
supabase link --project-ref rixikhernphntvuwfzcy
```

You'll be asked for your database password. Get it from:
- Supabase Dashboard → Settings → Database → Database password

### Step 3: Apply Migrations

**Option A: Automated (Recommended)**
```bash
./apply-migrations.sh
```

**Option B: Manual**
```bash
supabase db push
```

## 🎉 That's It!

Your database is now set up with:
- ✅ All tables (products, orders, users, etc.)
- ✅ Row Level Security policies
- ✅ Guest checkout support
- ✅ Admin features
- ✅ Payment gateway integration
- ✅ And much more!

## 📝 Next Steps

1. **Create Admin User**
   - Sign up through your app
   - Go to Supabase Dashboard → Authentication → Users
   - Copy your user UUID
   - Run in SQL Editor:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_UUID_HERE';
     ```

2. **Start Your App**
   ```bash
   npm run dev
   ```

3. **Configure Your Store**
   - Log in as admin
   - Go to Admin Dashboard
   - Add products, categories, delivery locations
   - Configure payment gateways (bKash, Nagad)
   - Set up banners and promotions

## 📚 Need More Details?

See `DATABASE_SETUP_GUIDE.md` for:
- Detailed migration information
- Google OAuth setup
- Storage bucket configuration
- Testing checklist
- Troubleshooting guide

## 🆘 Having Issues?

### "Supabase CLI not found"
```bash
npm install -g supabase
```

### "Project not linked"
```bash
supabase link --project-ref rixikhernphntvuwfzcy
```

### "Migration failed"
- Check your database password
- Verify internet connection
- See `DATABASE_SETUP_GUIDE.md` for manual migration steps

## 🎊 You're All Set!

Your Shottopath e-commerce platform is ready to use with your own database. Happy selling! 🛍️
