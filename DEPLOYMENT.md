# Shottopath - E-commerce Platform

A modern, full-featured e-commerce platform built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- **Product Management**: Full CRUD operations for products with variants, images, and categories
- **Order Management**: Complete order lifecycle from cart to delivery
- **User Authentication**: Secure login/signup with email verification
- **Payment Integration**: Support for bKash, Nagad, and Cash on Delivery
- **Gift Cards**: Send digital gift cards via email with customizable templates
- **Reviews & Ratings**: Customer reviews with admin moderation
- **Wishlist & Cart**: Save products for later and manage shopping cart
- **Admin Dashboard**: Comprehensive admin panel for managing the entire platform
- **Real-time Chat**: Customer support chat with image uploads
- **Responsive Design**: Mobile-first design that works on all devices
- **SEO Optimized**: Meta tags, slugs, and sitemap for better search visibility

## 📋 Prerequisites

Before deploying, make sure you have:

- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- A Supabase account and project
- (Optional) Resend account for email functionality

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shajidrahimclass-jpg/shottopath.git
   cd shottopath
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**:
   
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run all migrations in the `supabase/migrations` folder
   - Set up storage buckets for images
   - Configure authentication settings

5. **Run locally**:
   ```bash
   pnpm dev
   ```

## 🌐 Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub** (already done):
   ```
   https://github.com/shajidrahimclass-jpg/shottopath
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the settings from `vercel.json`

3. **Configure Environment Variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Add the following:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your site will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set environment variables**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## 🔧 Build Configuration

The project uses the following build configuration (defined in `vercel.json`):

- **Build Command**: `pnpm install && pnpm build:prod`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Node Version**: 18.x

## 📦 Project Structure

```
shottopath/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utility functions
│   ├── types/           # TypeScript types
│   └── db/              # Supabase client
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── vercel.json          # Vercel configuration
```

## 🔐 Environment Variables

### Required Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables (for Edge Functions):

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `RESEND_API_KEY` | For sending gift card emails | [resend.com/api-keys](https://resend.com/api-keys) |

**Note**: Edge Function secrets are configured in Supabase Dashboard, not in Vercel.

## 🎨 Customization

### Admin Access

The default admin URL path is `/admin`. You can customize this in:
- Admin Settings → Admin URL Path

### Branding

Update the following in Admin Settings:
- Site Name
- Site Description
- Logo
- Copyright Text
- Colors and Theme

### Payment Methods

Configure payment methods in Admin Settings:
- Enable/disable COD, bKash, Nagad
- Set delivery charges
- Configure payment instructions

## 📧 Email Configuration (Optional)

To enable gift card email functionality:

1. Create a Resend account at [resend.com](https://resend.com)
2. Get your API key from [resend.com/api-keys](https://resend.com/api-keys)
3. Add the key to Supabase Edge Function secrets:
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Add: `RESEND_API_KEY=your_key_here`
4. Verify your sender domain or use `onboarding@resend.dev` for testing

See `supabase/functions/send-gift-card-email/README.md` for detailed instructions.

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error**: "No Output Directory named 'dist' found"
- **Solution**: Make sure `vercel.json` exists in the root directory

**Error**: "Module not found"
- **Solution**: Clear Vercel cache and redeploy
- Go to Deployments → ⋯ → Redeploy → Clear cache and redeploy

### Supabase Connection Issues

**Error**: "Invalid API key"
- **Solution**: Check that environment variables are set correctly in Vercel
- Make sure you're using the `VITE_` prefix for client-side variables

### Images Not Loading

- **Solution**: Check Supabase Storage bucket policies
- Ensure buckets are public or have proper RLS policies

## 📱 Mobile App

The platform includes download links for mobile apps. Configure in:
- Admin → App Downloads

## 🔒 Security Notes

### Important Security Reminders:

1. **Never commit secrets to Git**:
   - API keys
   - Database passwords
   - OAuth credentials

2. **Use environment variables** for all sensitive data

3. **Rotate credentials** if they're ever exposed

4. **Enable RLS** (Row Level Security) in Supabase for all tables

5. **Use HTTPS** in production (Vercel provides this automatically)

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For issues or questions:
- Check the documentation in the `/docs` folder
- Review the troubleshooting section above
- Contact the development team

## 🚀 Performance

The platform is optimized for performance:
- Code splitting for faster initial load
- Image optimization
- Lazy loading of components
- CDN delivery via Vercel Edge Network

## 📊 Analytics

The platform includes built-in analytics for:
- Order tracking
- Product views
- Download statistics
- User engagement

Access analytics in the Admin Dashboard.

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and Supabase**
