# Requirements Document

## 1. Application Overview

### 1.1 Application Name
Shottopoth

### 1.2 Application Description
Shottopoth is a Bangladeshi e-commerce web application built with React, TypeScript, Tailwind CSS, shadcn/ui, Vite, and Supabase backend. The platform supports product browsing and purchasing with voucher system, redeem codes, multiple user roles, order management, dark/light mode, announcements, banners, reviews with ratings, chat system, wishlist, gift cards, app downloads, and guest checkout configuration.

### 1.3 Technical Stack
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Backend: Supabase (project: rixikhernphntvuwfzcy)
- Storage: Supabase Storage (bucket: app-9cyfgucqbpj5_shottopoth_images)
- Currency: ৳ (Bangladeshi Taka)
- Language: English

## 2. User Roles and Permissions

### 2.1 Guest User
- Browse products and view details
- View reviews and helpful vote counts
- Share products
- Purchase capability depends on Force Sign In setting:
  - If enabled: must sign in to purchase
  - If disabled: can purchase without signing in
- Cannot write reviews or vote on helpfulness

### 2.2 Signed In User
- All guest capabilities
- Purchase products and place orders
- Write reviews with optional image attachments
- Vote on review helpfulness and change vote within time window
- Reply to admin responses on reviews
- Manage delivery addresses
- View order history and notifications
- Access chat with admin
- Manage wishlist
- Redeem codes
- Receive email notifications for admin review responses

### 2.3 Suspected User
- Cannot use Cash on Delivery payment
- Restricted to online payment methods only (Bkash/Nagad)
- Can vote on review helpfulness
- Receives inbox notification about account restrictions

### 2.4 Banned User
- Cannot purchase or place orders
- Cannot vote on review helpfulness
- Can browse products and view reviews
- Receives inbox notification about banned status

### 2.5 Admin User
- Access admin panel via dynamic URL path (from app_settings.admin_url_path)
- Manage products, categories, orders, users, vouchers, redeem codes
- Manage banners, announcements, reviews
- Configure site settings, SEO, invoice settings
- Access chat with customers
- Manage quick replies and gift card templates
- View analytics and download statistics
- Manage product bundles and stock
- Access database manager and source code viewer
- First registered user automatically becomes admin

## 3. Authentication System

### 3.1 Sign In Methods
- Email and password with email verification required
- Google Login via OSS Google Login method
- GitHub Login via OAuth authentication

### 3.2 Email Verification
- Required for email/password registration
- Verification email sent to user's address
- Users must verify before accessing full features

### 3.3 OAuth Login
- Google and GitHub login provide secure authentication
- No email verification required for OAuth users
- GitHub OAuth follows standard OAuth 2.0 protocol

### 3.4 Guest Checkout
- Controlled by Force Sign In setting in admin panel
- When enabled: users must sign in to purchase
- When disabled: users can purchase without account
- Setting applies globally to all guest users

## 4. Page Structure and Functionality

### 4.1 Customer-Facing Pages

#### 4.1.1 HomePage
- Hero banner carousel
- Featured products display (6 products)
- Features section
- Call-to-action buttons
- Logged-in users redirect to /products

#### 4.1.2 ProductsPage
- Product catalog with search functionality
- Category filter
- Banner carousel
- Product grid with add-to-cart, wishlist, buy-now buttons
- Pull-to-refresh on mobile
- Random product display on each page refresh

#### 4.1.3 ProductDetailPage
- Image gallery with zoom and navigation
- Device-specific images (PC vs mobile)
- Price, stock status, product description
- Size and color selector (if applicable)
- Add-to-cart and buy-now buttons
- Product user manual (if available)
- Reviews section (initial 3 reviews with View More)
- Related products
- Share functionality
- Product video (if available)

#### 4.1.4 CartPage
- Cart item list with quantity controls
- Remove item functionality
- Swipe-to-delete on mobile
- Subtotal calculation
- Checkout button

#### 4.1.5 CheckoutPage
- Delivery address selection or add new
- Delivery location selector (Dhaka, Dhaka Outer City, Out of Dhaka)
- Payment method selection
- Voucher code input
- Order notes field
- Terms and refund policy agreement checkbox
- Proceed to payment page

#### 4.1.6 PaymentPage
- Order summary display
- Payment instructions (Bkash/Nagad number from config)
- Payment screenshot upload
- Last 4 digits of payment number input
- Transaction ID input
- Payment number used for payment input
- Submit order button

#### 4.1.7 OrdersPage
- User's order history
- Status badges (Pending, On the Way, Confirmed, Delivered, Canceled)
- Expandable order details

#### 4.1.8 ProfilePage
- Edit profile (name, phone, address)
- Delivery addresses CRUD
- Change password

#### 4.1.9 ChatPage
- Real-time chat with admin
- Message display (user right, admin left)
- Image upload and zoom functionality
- Delete own messages
- Supabase Realtime on chat_messages table

#### 4.1.10 InboxPage
- Order messages grouped by order
- Chat message notifications with direct navigation
- Unread notification badge
- Order status change notifications with unique colors
- Account status notifications

#### 4.1.11 WishlistPage
- User's wishlist products grid
- Remove from wishlist functionality

#### 4.1.12 RedeemCodesPage
- View available redeem codes
- Redeem code functionality

#### 4.1.13 AppDownloadsPage
- Download links for app (APK, EXE, etc.)
- Analytics tracking for page views and downloads

#### 4.1.14 ProductReviewsPage
- All reviews for a product
- Filter by star rating (5 to 1 star)
- Sort by helpfulness
- Review image zoom
- Helpful voting system
- Admin responses and conversation threads

### 4.2 Auth Pages

#### 4.2.1 LoginPage
- Email/password sign in and sign up tabs
- Google OAuth button
- GitHub OAuth button

#### 4.2.2 ForgotPasswordPage
- Request password reset by email

#### 4.2.3 ResetPasswordPage
- Set new password after email link

#### 4.2.4 EmailVerificationPage
- Post-signup email sent notice

#### 4.2.5 AuthCallbackPage
- Handles OAuth redirects
- Ensures profile exists in database

### 4.3 Admin Pages

#### 4.3.1 AdminDashboard
- Statistics: total orders, revenue, products, users
- Recent orders table
- Charts and analytics

#### 4.3.2 AdminProducts
- Product list table
- Edit, delete, toggle active status

#### 4.3.3 AdminProductEditor
- Create/edit product form
- Fields: name, description, price, stock, category
- Device-specific images (PC + mobile)
- Thumbnail images
- Sizes and colors options
- User manual content
- Meta fields
- Gift card toggle

#### 4.3.4 AdminCategories
- CRUD categories with image

#### 4.3.5 AdminOrders
- Orders table with status filter
- Search by order ID or user information
- Pagination

#### 4.3.6 AdminOrderDetails
- Single order view with items and customer info
- Status update functionality
- Order messages chat
- Copy customer name, phone, address

#### 4.3.7 AdminChat
- Unified chat interface
- List of customers
- Real-time message thread per customer
- View user email and name
- Click user name to view details
- Quick reply functionality

#### 4.3.8 AdminQuickRepliesPage
- CRUD quick reply templates

#### 4.3.9 AdminVouchers
- CRUD discount vouchers
- Fields: type (percentage/fixed), usage limit, expiry, minimum amount

#### 4.3.10 AdminRedeemCodes
- CRUD redeem codes
- Fields: value, price, status

#### 4.3.11 AdminUsers
- Users table with search
- Change role (user/admin/banned/suspected)

#### 4.3.12 AdminAnnouncements
- CRUD announcements with image and text
- Copyable text content

#### 4.3.13 AdminBanners
- CRUD banners for home/products pages
- Drag to reorder
- Device-specific banners (PC vs mobile)

#### 4.3.14 AdminReviews
- View all reviews
- Toggle hidden status
- Reply to reviews
- Edit and delete admin responses
- Response status indicator
- Helpful vote analytics

#### 4.3.15 AdminSendGiftCard
- Send gift card email to customer
- Template selection

#### 4.3.16 AdminTemplateManagement
- CRUD gift card email templates

#### 4.3.17 AdminSettings
- Site settings: title, navbar name, description, favicon
- Copyright text
- Force Sign In toggle
- Admin URL path configuration
- Bkash number configuration

#### 4.3.18 AdminSEO
- Meta tags settings
- Default meta image

#### 4.3.19 AdminInvoiceEditor
- Invoice settings: company name, logo, address
- Bank details
- QR code

#### 4.3.20 AdminProductBundles
- CRUD product bundle associations
- Discount percent configuration

#### 4.3.21 AdminStockManagement
- View stock levels
- Add/adjust stock movements

#### 4.3.22 AdminAppDownloads
- CRUD app download entries (APK, EXE, etc.)

#### 4.3.23 AdminDownloadAnalytics
- Charts and statistics for app downloads
- Page view tracking

#### 4.3.24 AdminNotificationHistory
- View all admin notifications

#### 4.3.25 AdminNotificationPreferences
- Toggle which events trigger admin notifications

#### 4.3.26 AdminDatabaseManager
- View database tables summary

#### 4.3.27 AdminSourceCode
- Browse source files (read-only)

#### 4.3.28 AdminOAuthStatus
- Show Google OAuth configuration status

## 5. Business Rules and Logic

### 5.1 Product Selection
- Products with size, color, or quantity options trigger selection popup
- User must complete selections before checkout or add-to-cart

### 5.2 Product User Manual Agreement
- If admin adds user manual content, agreement popup appears on Buy Now or Add to Cart
- User must accept agreement to proceed
- Show More for user manual does not trigger popup

### 5.3 Voucher System
- Types: percentage discount or fixed amount discount
- Usage limits: one-time or multiple-use
- Minimum amount requirement enforced
- Voucher applies only when order subtotal meets minimum

### 5.4 Redeem Code System
- Admin creates redeem codes with value and pricing
- Users purchase redeem codes
- Users apply codes during checkout
- Used codes marked as redeemed and cannot be reused

### 5.5 Payment Methods
- Dhaka location: Cash on Delivery, Bkash, Nagad
- Dhaka Outer City and Out of Dhaka: Bkash, Nagad only
- Suspected users: Bkash and Nagad only (no Cash on Delivery)
- Banned users: cannot access payment

### 5.6 Order Status Flow
- Pending → On the Way → Confirmed → Delivered
- Canceled status available
- Each status change triggers inbox notification with unique color

### 5.7 Review System
- Signed in users can write reviews with optional images
- Users can vote reviews as helpful or not helpful
- Vote change allowed within time window
- Admin can respond to reviews
- Customers can reply to admin responses
- Reviews can be filtered by star rating and sorted by helpfulness
- Most helpful reviews highlighted with badge

### 5.8 Chat System
- Real-time messaging between users and admin
- Image upload and zoom functionality
- Message deletion by sender
- Chat notifications in inbox with direct navigation

### 5.9 Revenue Calculation
- Total revenue excludes delivery charges
- Only product prices included

### 5.10 Dynamic Banner System
- Banners auto-switch every 3 seconds
- Device-specific display (PC banners for PC users, mobile banners for mobile users)

### 5.11 Guest Checkout Logic
- Force Sign In setting controls guest purchase capability
- When enabled: authentication required for checkout
- When disabled: guest users can complete purchase without account

## 6. Database Schema

### 6.1 Core Tables
- profiles: user information and roles
- categories: product categories with images
- products: product details, pricing, stock, device-specific images
- delivery_locations: location names, charges, delivery duration
- delivery_addresses: user saved addresses
- payment_gateways: payment method configurations
- vouchers: discount vouchers with rules
- orders: order records with status
- order_items: products in each order
- order_messages: messages related to orders
- reviews: product reviews with ratings and images
- review_helpful_votes: helpful vote tracking
- review_responses: admin responses to reviews
- announcements: popup announcements
- banners: banner images for homepage and products page
- notifications: user notifications
- chat_messages: real-time chat messages
- quick_replies: admin quick reply templates
- terms_and_conditions: terms content
- user_manual: product user manual content
- product_user_manual_acceptances: user acceptance tracking
- invoice_settings: invoice configuration
- app_settings: site-wide settings including admin URL path
- admin_notification_preferences: admin notification toggles
- redeem_codes: redeem code inventory
- product_bundles: bundle associations
- product_bundle_items: items in bundles
- product_options: size and color options
- stock_movements: stock adjustment history
- bundle_analytics: bundle performance data
- suggested_bundles: bundle recommendations
- wishlist: user wishlist items
- recently_viewed: recently viewed products
- gift_card_templates: email templates for gift cards
- app_downloads: app download files
- app_download_page_views: page view tracking
- app_download_analytics: download statistics
- refunds_policy: refund policy content

### 6.2 Realtime Subscriptions
- chat_messages table for real-time chat
- order_messages table for order communication

## 7. UI/UX Features

### 7.1 Dark/Light Mode
- Theme switcher available throughout application
- Implemented with next-themes using class strategy

### 7.2 Animations
- Framer Motion for page transitions
- Product card animations
- Button hover and click effects
- Modal and popup animations
- Loading indicators
- Smooth transitions throughout

### 7.3 Responsive Design
- Desktop-first approach
- Fully responsive for mobile and tablet
- Bottom navigation bar on mobile
- Three-line menu icon in admin panel on mobile
- Touch-friendly interface elements
- Adaptive layouts for all screen sizes

### 7.4 Mobile Touch Gestures
- Swipe-to-delete for cart items
- Pull-to-refresh for product lists
- Pinch-to-zoom for product images
- Double-tap zoom on images

### 7.5 Image Handling
- Device-specific images (PC vs mobile)
- Image zoom functionality in product pages, reviews, and chat
- Lightbox overlay for zoomed images
- Responsive image sizing

### 7.6 Text Selection
- Disabled throughout entire application

### 7.7 Keyboard Shortcuts
- Admin panel keyboard shortcuts overlay
- Ctrl+K for search navigation

## 8. Security and Configuration

### 8.1 Environment Variables
- VITE_SUPABASE_URL: Supabase project URL
- VITE_SUPABASE_ANON_KEY: Supabase anonymous key

### 8.2 Admin Access
- Dynamic admin URL path from app_settings.admin_url_path
- Default: /pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef
- First registered user becomes admin automatically

### 8.3 Row-Level Security
- Implemented for image uploads
- Database-level access control

### 8.4 Cart Storage
- localStorage-based cart management

## 9. Acceptance Criteria

1. User registers with email/password and receives verification email
2. User logs in with Google OAuth via OSS Google Login method
3. User logs in with GitHub OAuth successfully
4. Guest user browses products and views details
5. Guest user purchases product when Force Sign In is disabled
6. Guest user redirected to login when Force Sign In is enabled and attempts purchase
7. Signed in user adds product to cart and completes checkout
8. User applies voucher code at checkout and discount is calculated correctly
9. User selects Bkash payment, uploads screenshot, and submits order
10. Order appears in user's order history with Pending status
11. Admin views order in admin panel and updates status to Confirmed
12. User receives inbox notification with unique color for Confirmed status
13. User writes review with image attachment and submits successfully
14. User votes review as helpful and vote count updates
15. Admin responds to review and user receives email notification
16. User replies to admin response creating conversation thread
17. Admin accesses chat page and sends message to user
18. User receives chat notification in inbox and clicks to navigate to chat page
19. Admin uploads banner image and banner displays on homepage with 3-second rotation
20. Admin toggles Force Sign In setting and guest checkout behavior changes accordingly
21. Admin creates redeem code and user purchases and applies it successfully
22. Suspected user attempts Cash on Delivery and is restricted to online payment only
23. Banned user attempts purchase and is shown banned message
24. Admin views Total Revenue excluding delivery charges
25. User swipes to delete cart item on mobile device
26. User pulls to refresh product list on mobile
27. User pinches to zoom product image on mobile
28. Dark mode toggle switches theme throughout application
29. Admin accesses database manager and views table summary
30. Admin uploads device-specific product images and correct images display for PC and mobile users

## 10. Features Not Implemented in This Version

- Multi-language support
- Advanced analytics dashboard beyond download analytics and helpful vote analytics
- Automated email marketing campaigns
- Loyalty points or rewards program
- Product comparison feature
- Advanced search filters beyond category and search
- Social media integration beyond product sharing
- Live chat with automated chatbot
- Subscription-based products
- Bulk order management tools
- Advanced inventory management with low stock alerts
- Third-party shipping provider integration
- Customer segmentation and targeted promotions
- A/B testing functionality
- Advanced fraud detection beyond role management
- Multi-currency support
- Tax calculation and management
- Return and refund request workflow
- Auction or bidding features
- Affiliate program management
- Advanced SEO tools beyond meta tag settings
- Recent view history display in user profile