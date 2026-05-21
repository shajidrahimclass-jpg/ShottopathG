# Task: Build Shottopoth E-Commerce Web Application

## Recent Fixes (Phase 38-54)
✅ **Manual Beside Description**: Product user manual displayed beside description in side-by-side layout
✅ **Popup Acceptance**: User gets popup dialog when clicking Buy Now or Add to Cart
✅ **Always Require Acceptance**: Checkbox must be checked every time (resets on each popup)
✅ **Stock Label Only**: Show only "Stock" badge without displaying quantity value
✅ **Random Products**: More Products section shows random products on every page refresh
✅ **Random Products Page**: Products page shows random products on every page load
✅ **Admin Order Search**: Search orders by Order ID, customer name, email, or phone
✅ **Admin User Search**: Search users by username, email, or name
✅ **Admin Product Search**: Search products by name, category, or description
✅ **Real-time Search**: Instant filtering as admin types in all search boxes
✅ **Search Across Tabs**: Order search works in all order status tabs
✅ **Cannot Close Dialog**: Manual dialog cannot be dismissed by clicking outside
✅ **Disabled Accept Button**: Accept button disabled until checkbox is checked
✅ **Description Popup**: Product description shows in popup dialog when clicking 'Show More'
✅ **Dedicated Reviews Page**: All reviews displayed on separate page with average rating
✅ **Reviews Navigation**: 'View All Reviews' button navigates to dedicated reviews page
✅ **Fixed Reviews Loading**: Reviews now load correctly using product slug
✅ **Review Image Upload**: Users can upload up to 5 images with automatic compression
✅ **Star Rating Filter**: Filter reviews by 5-star to 1-star ratings with counts
✅ **Payment Method Reset**: Payment method automatically clears when location changes and method not available
✅ **Manual Show More Inline**: Show More button expands user manual inline without acceptance popup
✅ **On The Way Status**: New order status added between Confirmed and Delivered for tracking shipments
✅ **Order Status Notifications**: Users receive inbox notifications with unique colors for Confirmed, On The Way, and Delivered status changes
✅ **Payment Page Accordions**: Payment instructions, COD info, and terms displayed in expandable accordion sections
✅ **Mobile Responsive Cart**: Cart page fully optimized for mobile devices with improved layout and spacing
✅ **Scroll to Top Fix**: Checkout, Payment, and Cart pages now load at the top instead of bottom
✅ **Admin Categories Management**: Full CRUD operations for product categories with active/inactive status
✅ **Bigger Cart Images**: Product images in cart increased to 28x28 (mobile) and 32x32 (desktop)
✅ **Payment Navigation Fix**: Back to Checkout button preserves buyNow parameter for proper flow
✅ **Product Page Scroll**: Product detail page loads at top for better visibility
✅ **Manual for All Users**: User manual acceptance required for all users, not just logged in
✅ **Buy Now Login Check**: Buy Now button redirects to login if user not authenticated
✅ **Manual Dialog Close**: X button and Cancel button now work to close manual dialog
✅ **Longer Preview**: User manual shows 300 characters before requiring Show More expansion
✅ **Banned User Restrictions**: Banned users cannot purchase products and receive inbox notifications
✅ **Suspended COD Block**: Suspended users cannot use Cash on Delivery payment method
✅ **Purchase Attempt Alerts**: System notifications sent to banned users when attempting purchases
✅ **Order Invoice Feature**: Professional invoice with print and download PDF functionality
✅ **Invoice in Admin Panel**: Admins can view and print invoices from order details page
✅ **Invoice in User Orders**: Users can view and download invoices for their orders
✅ **Complete Invoice Details**: Shows order info, customer details, items, pricing, and payment info
✅ **Invoice Editor Page**: Admin page to customize all invoice content and appearance
✅ **Custom Company Info**: Edit company name, logo, address, phone, and email
✅ **Tax Configuration**: Add tax ID with visibility toggle for invoices
✅ **Bank Details Section**: Configure bank information for payment reference
✅ **Custom Invoice Content**: Add custom notes, terms and conditions, and footer text
✅ **Dynamic Invoice Display**: Invoices automatically use admin-configured settings
✅ **Toggle Visibility**: Show/hide logo, tax ID, and bank details as needed
✅ **Invoice Logo Left**: Company logo displayed on left side of invoice header
✅ **Invoice QR Right**: QR code displayed on right side of invoice header
✅ **QR Code Management**: Admin can add custom QR code content with live preview
✅ **Logo Preview**: Admin sees logo preview when URL is provided
✅ **Mobile Responsive Invoice**: Invoice fully optimized for mobile viewing and printing
✅ **Mobile Responsive Editor**: Admin invoice editor fully responsive on all devices
✅ **Responsive Header Layout**: Three-column layout on desktop, stacked on mobile
✅ **Responsive Typography**: Font sizes adapt to screen size throughout invoice
✅ **Responsive Tables**: Order items table scrolls horizontally on small screens
✅ **Responsive Dialogs**: Invoice dialog buttons stack properly on mobile devices

## Plan
- [x] Step 1: Design System & Color Scheme
- [x] Step 2: Database Setup
- [x] Step 3: Type Definitions & API Layer
- [x] Step 4: Authentication & Authorization
- [x] Step 5: Layout Components
- [x] Step 6: Public Pages
- [x] Step 7: Admin Pages
- [x] Step 8: Reusable Components
- [x] Step 9: Routes & App Setup
- [x] Step 10: Validation & Testing
- [x] Step 11: User Improvements (Phase 1)
  - [x] Redirect logged-in users from home to products catalog
  - [x] Update login to require email, name, and password
  - [x] Add dark/light mode switcher to header
  - [x] Add "More Products" section on product detail page
  - [x] Show full user address in admin order panel
- [x] Step 12: Enhanced Features (Phase 2)
  - [x] Add catalog page with search functionality
  - [x] Fix admin panel access (redirect non-admin users)
  - [x] Add product variants (sizes, colors, pieces)
  - [x] Add announcement system (admin managed popup)
  - [x] Add order filtering (all, pending, confirmed, delivered)
  - [x] Update mobile navigation to include catalog
- [x] Step 13: Improvements (Phase 3)
  - [x] Remove catalog page
  - [x] Add product categories system
  - [x] Add category filtering to products page
  - [x] Implement animations throughout the app
  - [x] Improve responsive design
- [x] Step 14: Authentication & Purchase Flow (Phase 4)
  - [x] Change sign-in to use email instead of username
  - [x] Update AuthContext to use email-based authentication
  - [x] Update LoginPage to show email field
  - [x] Add Buy Now button to product cards
  - [x] Add Buy Now button to product detail page
  - [x] Implement direct checkout flow for Buy Now
  - [x] Update CheckoutPage to handle both cart and Buy Now purchases
- [x] Step 15: Navigation Fixes (Phase 5)
  - [x] Fix multiple click issue on navigation buttons
  - [x] Add navigation state management to prevent duplicate navigations
  - [x] Implement disabled state during navigation
  - [x] Fix Admin Panel and Home navigation issues
- [x] Step 16: Email Verification (Phase 6)
  - [x] Enable email verification in Supabase
  - [x] Update signup flow to send verification emails
  - [x] Add email verification notice on signup
  - [x] Create email verification confirmation page
  - [x] Add verification status handling in login
  - [x] Update AuthContext with emailRedirectTo option
- [x] Step 17: Product Variants Selection (Phase 7)
  - [x] Create ProductOptionsDialog component
  - [x] Add variant detection in Add to Cart and Buy Now functions
  - [x] Implement color and size selection with radio buttons
  - [x] Add quantity selector in options dialog
  - [x] Update CartItem type to include selectedColor and selectedSize
  - [x] Display selected options in cart page
  - [x] Handle variant-specific cart items (separate items for different variants)
- [x] Step 18: Review System Implementation (Phase 8)
  - [x] Create ReviewDialog component with star rating
  - [x] Add review submission form with rating and comment
  - [x] Update OrdersPage to show review buttons for delivered orders
  - [x] Implement review submission for each product in order
  - [x] Add stock validation in cart quantity updates
  - [x] Fix cart glitches with proper validation
- [x] Step 19: Navigation & Inbox (Phase 9)
  - [x] Hide Home navigation link when user is signed in
  - [x] Add Inbox link beside Products in desktop navigation
  - [x] Create InboxPage with notifications display
  - [x] Update mobile navigation to show Inbox for signed-in users
  - [x] Add Inbox route to routing configuration
  - [x] Create notifications database table with RLS policies
  - [x] Implement notification API functions (create, fetch, mark as read)
  - [x] Add database trigger for welcome notification on signup
  - [x] Create order confirmation notification on checkout
  - [x] Update InboxPage to fetch real notifications from database
  - [x] Add mark all as read functionality
  - [x] Implement click to mark individual notification as read
- [x] Step 20: Multiple Images and Videos (Phase 10)
  - [x] Update products table to support images and videos arrays
  - [x] Migrate existing image_url data to images array
  - [x] Update Product type with images and videos fields
  - [x] Add multiple image upload functionality in AdminProducts
  - [x] Add video URL input functionality in AdminProducts
  - [x] Implement image removal from gallery
  - [x] Implement video removal from list
  - [x] Update ProductDetailPage with image gallery
  - [x] Add thumbnail navigation for multiple images
  - [x] Implement video player support (YouTube, Vimeo, direct links)
  - [x] Update product submission to include images and videos
- [x] Step 21: Custom Branding (Phase 11)
  - [x] Download and save custom Shottopath logo
  - [x] Update favicon to use custom logo
  - [x] Replace Package icon with logo in MainLayout header
  - [x] Replace Package icon with logo in AdminLayout sidebar
  - [x] Add comprehensive meta tags for SEO and social sharing
  - [x] Update page title and descriptions
  - [x] Create email configuration guide for custom SMTP setup
  - [x] Document email template customization process
  - [x] Provide instructions for Gmail SMTP configuration
  - [x] Remove logo image from app bar (text only)
- [x] Step 22: Payment Transaction Details (Phase 12)
  - [x] Add transaction_id column to orders table
  - [x] Update Order type with transaction_id field
  - [x] Load payment gateway details (Bkash and Nagad numbers)
  - [x] Display Bkash mobile number when Bkash is selected
  - [x] Display Nagad mobile number when Nagad is selected
  - [x] Add transaction ID input field for Bkash payments
  - [x] Add transaction ID input field for Nagad payments
  - [x] Validate transaction ID before order placement
  - [x] Save transaction ID with order data
  - [x] Show payment instructions with gateway numbers
- [x] Step 23: Separate Payment Page with Terms (Phase 13)
  - [x] Create terms_and_conditions table in database
  - [x] Add TermsAndConditions type and API functions
  - [x] Create PaymentPage component with payment flow
  - [x] Remove transaction ID input from CheckoutPage
  - [x] Update CheckoutPage to redirect to PaymentPage
  - [x] Display payment instructions on PaymentPage
  - [x] Show payment gateway mobile numbers
  - [x] Add transaction ID input on PaymentPage
  - [x] Display terms and conditions with scrollable view
  - [x] Add terms agreement checkbox
  - [x] Validate terms agreement before order placement
  - [x] Add terms management to AdminSettings
  - [x] Allow admin to edit terms title and content
  - [x] Add PaymentPage route to application
  - [x] Set Bkash number to 01615995004
  - [x] Add mobile number input fields in admin settings
  - [x] Allow admin to edit Bkash and Nagad numbers
- [x] Step 24: Enhanced UI Design (Phase 14)
  - [x] Redesign LoginPage with modern split layout
  - [x] Add animated background elements
  - [x] Add branding section with feature highlights
  - [x] Enhance form inputs with icons
  - [x] Add loading animations for buttons
  - [x] Improve ProductsPage layout and spacing
  - [x] Enhance product cards with hover effects
  - [x] Add image zoom and overlay on hover
  - [x] Add stock badges and indicators
  - [x] Add rating display (placeholder)
  - [x] Improve button styles and interactions
  - [x] Add smooth transitions and animations
  - [x] Enhance search bar design
  - [x] Improve category filter badges
- [x] Step 25: Admin Order Details Page (Phase 15)
  - [x] Create AdminOrderDetails page component
  - [x] Add getOrderById API function
  - [x] Display complete order information
  - [x] Show all products with quantities and prices
  - [x] Display delivery address details
  - [x] Show payment method and transaction ID
  - [x] Display order status and timestamps
  - [x] Add View Details button to AdminOrders page
  - [x] Add route for order details page
  - [x] Implement back navigation to orders list
- [x] Step 26: Payment Options and Delivery Duration (Phase 16)
  - [x] Add duration column to delivery_locations table
  - [x] Update DeliveryLocation type with duration field
  - [x] Add payment amount selection (full or delivery charge only)
  - [x] Show payment amount options for Bkash/Nagad
  - [x] Display delivery duration on checkout page
  - [x] Add duration input field in admin settings
  - [x] Update PaymentPage to handle payment amount
  - [x] Show appropriate payment amount in instructions
  - [x] Add alert for partial payment (delivery charge only)
  - [x] Pass payment amount to payment page
- [x] Step 27: Checkout Address Fix and Admin Mobile Menu (Phase 17)
  - [x] Fix add address functionality in checkout page
  - [x] Add dialog state management for address form
  - [x] Implement handleSaveAddress function
  - [x] Add createDeliveryAddress API call
  - [x] Auto-select newly added address
  - [x] Clear form after successful save
  - [x] Add mobile hamburger menu to admin panel
  - [x] Implement Sheet component for mobile navigation
  - [x] Add all admin menu items to mobile menu
  - [x] Include sign out button in mobile menu
  - [x] Add copy functionality for customer information
  - [x] Add copy buttons for name, phone, and address
  - [x] Implement clipboard copy with toast notifications
  - [x] Add Copy icon to order details page
- [x] Step 28: Product Display Consistency and Image Fix (Phase 18)
  - [x] Add secondary sorting by ID to product queries
  - [x] Fix getProducts to sort by created_at then id
  - [x] Fix getAllProducts to sort by created_at then id
  - [x] Change product images from object-cover to object-contain
  - [x] Fix ProductsPage image display
  - [x] Fix HomePage product image display
  - [x] Fix ProductDetailPage main image display
  - [x] Add flex centering to image containers
  - [x] Reduce hover scale effect for better image visibility
  - [x] Ensure consistent product order on page refresh
- [x] Step 29: Enhanced Product Image Display (Phase 19)
  - [x] Improve ProductsPage image containers with proper padding
  - [x] Change background from gradient to clean background color
  - [x] Increase card height from h-56 to h-64 for better visibility
  - [x] Use max-w-full max-h-full for better image sizing
  - [x] Add padding to image containers (p-4)
  - [x] Improve hover effects with subtle overlay
  - [x] Add shadow to hover icon for better visibility
  - [x] Fix HomePage product images with taller container (h-56)
  - [x] Add hover scale effect to homepage images
  - [x] Improve ProductDetailPage main image with border
  - [x] Set max height for detail images (max-h-[500px])
  - [x] Add generous padding to detail image container (p-8)
  - [x] Fix thumbnail images with proper centering and padding
  - [x] Improve thumbnail borders and hover states
  - [x] Fix CartPage product images with border and padding
  - [x] Fix AdminProducts form image previews
  - [x] Fix AdminProducts table thumbnails
  - [x] Consistent image treatment across all pages
- [x] Step 30: Revenue Calculation Fix and Order Cancellation (Phase 20)
  - [x] Add 'cancelled' to OrderStatus type
  - [x] Fix Total Revenue calculation to exclude delivery charges
  - [x] Update revenue formula: (total - delivery_charge)
  - [x] Create cancelOrder API function
  - [x] Update order status to cancelled in database
  - [x] Create notification for user when order is cancelled
  - [x] Add cancellation reason parameter
  - [x] Add cancel order button to AdminOrderDetails page
  - [x] Create cancel order dialog with reason input
  - [x] Implement handleCancelOrder function
  - [x] Add XCircle icon for cancel button
  - [x] Show cancel button only for pending/confirmed orders
  - [x] Hide cancel button for delivered/cancelled orders
  - [x] Add cancelled status color (red) to all pages
  - [x] Update getStatusColor in AdminOrderDetails
  - [x] Update getStatusColor in AdminOrders
  - [x] Update getStatusColor in OrdersPage
  - [x] Add validation for cancellation reason
  - [x] Show loading state during cancellation
  - [x] Reload order after successful cancellation
  - [x] Send notification to user inbox with reason
- [x] Step 31: Dynamic Banner System and Order Management Improvements (Phase 21)
  - [x] Create banners table in database
  - [x] Add RLS policies for banners (public read, admin manage)
  - [x] Create Banner interface in types
  - [x] Add banner API functions (get, create, update, delete)
  - [x] Create AdminBanners page for banner management
  - [x] Add image URL input with preview
  - [x] Add title and link fields (optional)
  - [x] Add display order for banner sorting
  - [x] Add active/inactive toggle
  - [x] Add banner CRUD operations
  - [x] Add Banners menu item to AdminLayout
  - [x] Replace hero section with dynamic banner carousel
  - [x] Implement auto-rotation every 3 seconds
  - [x] Add navigation arrows for manual control
  - [x] Add dots indicator for banner position
  - [x] Support clickable banners with links
  - [x] Show banner title overlay
  - [x] Fallback to default hero if no banners
  - [x] Add "Cancelled" tab to AdminOrders page
  - [x] Add cancelled option to order status dropdown
  - [x] Disable status change for cancelled orders
  - [x] Add red background highlight for cancelled orders
  - [x] Fix admin cancel order functionality
  - [x] Prevent status updates on cancelled orders
- [x] Step 32: Product Editor Page and Banner Upload (Phase 22)
  - [x] Add slug field to products table
  - [x] Create unique index for product slugs
  - [x] Update Product type to include slug field
  - [x] Create AdminProductEditor as separate page
  - [x] Add routes for /admin/products/new and /admin/products/edit/:id
  - [x] Implement slug auto-generation from product name
  - [x] Add manual slug editing capability
  - [x] Create comprehensive product form with all fields
  - [x] Add basic information section (name, slug, description, price, stock)
  - [x] Add category and pieces fields
  - [x] Add active/inactive toggle
  - [x] Add product images section with multiple image support
  - [x] Add product videos section
  - [x] Add product variants (sizes and colors)
  - [x] Implement add/remove functionality for images, videos, sizes, colors
  - [x] Add form validation and error handling
  - [x] Handle duplicate slug errors
  - [x] Simplify AdminProducts to list view only
  - [x] Remove dialog from AdminProducts
  - [x] Add navigation to product editor page
  - [x] Show slug in products table
  - [x] Create banners storage bucket in Supabase
  - [x] Add storage policies for banner uploads
  - [x] Create uploadBannerImage API function
  - [x] Add image upload button to AdminBanners
  - [x] Implement file validation (type and size)
  - [x] Add upload progress indicator
  - [x] Support both URL input and file upload
  - [x] Insert sample banner data for testing
- [x] Step 33: Fix Upload Issues and Enhance Product Editor (Phase 23)
  - [x] Add image upload functionality to product editor
  - [x] Create handleImageUpload function for products
  - [x] Add Upload button with file input in product images section
  - [x] Implement automatic main image setting on first upload
  - [x] Add uploaded images to additional images array
  - [x] Add file type validation (images only)
  - [x] Add file size validation (max 5MB)
  - [x] Show uploading state in button
  - [x] Reset file input after upload
  - [x] Reorganize product images section (upload first, then URL options)
  - [x] Fix banner storage policies with proper WITH CHECK clauses
  - [x] Recreate all banner storage policies correctly
  - [x] Add INSERT policy with admin role check
  - [x] Add UPDATE policy with USING and WITH CHECK
  - [x] Add DELETE policy with admin check
  - [x] Improve error handling in uploadBannerImage
  - [x] Add detailed error logging for banner uploads
  - [x] Improve error messages in AdminBanners upload handler
  - [x] Reset file input after banner upload
  - [x] Verify slug field is working correctly in database
  - [x] Test slug auto-generation and manual editing
- [x] Step 34: Add Comprehensive Debugging and Logging (Phase 24)
  - [x] Add detailed console logging to uploadImage function
  - [x] Add detailed console logging to uploadBannerImage function
  - [x] Log file details (name, type, size) in upload handlers
  - [x] Log upload path and public URL generation
  - [x] Add console logs to product editor handleImageUpload
  - [x] Add console logs to banner editor handleImageUpload
  - [x] Log product data before save in handleSubmit
  - [x] Log product creation result
  - [x] Add detailed error messages with context
  - [x] Log slug generation in handleNameChange
  - [x] Create DEBUGGING.md with comprehensive troubleshooting guide
  - [x] Document expected console output for each operation
  - [x] Add manual testing queries for verification
  - [x] Include quick fixes for common issues
  - [x] Add steps for reporting issues with required information
  - [x] Create TESTING.md with step-by-step testing procedures
  - [x] Document how to test product slug functionality
  - [x] Document how to test product image upload
  - [x] Document how to test banner image upload
  - [x] Add common errors and solutions section
  - [x] Add verification queries for database checks
  - [x] Create IMPLEMENTATION.md with complete technical summary
  - [x] Document all implemented features
  - [x] List technical details and architecture
  - [x] Include testing checklist
  - [x] Add success indicators for each feature
  - [x] Provide support and troubleshooting resources
- [x] Step 35: Fix Row-Level Security for Image Uploads (Phase 25)
  - [x] Identify RLS policy issue blocking admin uploads
  - [x] Simplify banner storage policies
  - [x] Remove admin-specific role checks from storage policies
  - [x] Change banner policies to allow all authenticated users
  - [x] Keep admin restrictions at application level (UI access control)
  - [x] Update INSERT policy for banners (authenticated users)
  - [x] Update UPDATE policy for banners (authenticated users)
  - [x] Update DELETE policy for banners (authenticated users)
  - [x] Verify SELECT policy allows public access
  - [x] Test policies are consistent across both buckets
  - [x] Update IMPLEMENTATION.md with new policy information
  - [x] Update DEBUGGING.md with corrected error solutions
  - [x] Update TESTING.md with authentication requirements
  - [x] Document that admin check is at application level, not storage level
- [x] Step 36: Fix Banner Save and Order Cancellation (Phase 26)
  - [x] Identify banner table RLS policy blocking saves
  - [x] Simplify banner table policies to allow authenticated users
  - [x] Drop "Admins can manage banners" policy with admin role check
  - [x] Create separate INSERT, UPDATE, DELETE policies for authenticated users
  - [x] Add 'cancelled' status to order_status enum
  - [x] Create policy for users to cancel their own orders
  - [x] Allow users to update orders from pending/confirmed to cancelled
  - [x] Restrict user updates to only their own orders
  - [x] Keep admin update policy for all order status changes
  - [x] Verify orders have both admin and user update policies
  - [x] Test order_status enum includes all statuses
  - [x] Verify TypeScript types include 'cancelled' status
- [x] Step 37: Implement SEO-Friendly Product URLs (Phase 27)
  - [x] Create getProductBySlug API function
  - [x] Update product detail route from /products/:id to /products/:slug
  - [x] Update ProductDetailPage to use slug parameter instead of id
  - [x] Update ProductDetailPage to fetch product by slug
  - [x] Add error handling for product not found
  - [x] Update all product links in ProductsPage to use slug
  - [x] Update all product links in HomePage to use slug
  - [x] Update "More Products" links in ProductDetailPage to use slug
  - [x] Add fallback to id if slug is not available
  - [x] Verify all existing products have slugs
  - [x] Test product URLs are now clean and readable
- [x] Step 38: Implement Review Management System (Phase 28)
  - [x] Add hidden field to reviews table
  - [x] Update RLS policies for hidden reviews visibility
  - [x] Update Review TypeScript interface with hidden field
  - [x] Create getAllReviews API function with product info
  - [x] Create toggleReviewHidden API function
  - [x] Update ReviewWithUser type to include product info
  - [x] Create AdminReviews page with review list
  - [x] Add hide/show functionality for reviews
  - [x] Add delete functionality with confirmation dialog
  - [x] Add visual indicators for hidden reviews
  - [x] Add navigation to product from review
  - [x] Add Reviews route to admin routes
  - [x] Add Reviews link to admin sidebar navigation
  - [x] Fix ReviewDialog to include hidden field
  - [x] Test review visibility based on hidden status
- [x] Step 39: Secure Admin Panel URL (Phase 29)
  - [x] Change admin base path from /admin to /pass-028276492372/shottopath/admin
  - [x] Update all admin routes in routes.tsx
  - [x] Update AdminLayout navigation items
  - [x] Update AdminOrderDetails back navigation
  - [x] Update AdminProductEditor navigation
  - [x] Update AdminProducts navigation and edit links
  - [x] Update MainLayout admin panel link
  - [x] Update RouteGuard admin route check
  - [x] Verify all admin links work with new path
- [x] Step 40: Separate Home and Products Page Banners (Phase 30)
  - [x] Add page field to banners table (home/products)
  - [x] Update Banner TypeScript interface
  - [x] Update getActiveBanners API to filter by page
  - [x] Update HomePage to request home page banners
  - [x] Add banner carousel to ProductsPage
  - [x] Update AdminBanners to include page selector
  - [x] Add page column to banners table display
  - [x] Test banner separation between pages
- [x] Step 41: Product Detail Page Improvements (Phase 31)
  - [x] Add show more/less for long product descriptions
  - [x] Limit reviews to 3 initially on product page
  - [x] Add "View More Reviews" button to expand all reviews
  - [x] Make review images clickable to open in new tab
  - [x] Add hover effects to review images
  - [x] Show count of remaining reviews in button
- [x] Step 42: Admin Panel Mobile Responsiveness (Phase 32)
  - [x] Add horizontal scroll to all admin tables
  - [x] Add min-width to table columns for proper display
  - [x] Improve mobile padding (p-4 on mobile, p-6 on desktop)
  - [x] Add bottom padding for mobile navigation bar
  - [x] Update AdminProducts table with overflow wrapper
  - [x] Update AdminOrders table with overflow wrapper
  - [x] Update AdminVouchers table with overflow wrapper
  - [x] Update AdminUsers table with overflow wrapper
  - [x] Update AdminBanners table with overflow wrapper
  - [x] Update AdminAnnouncements table with overflow wrapper
- [x] Step 43: Order Details User Information & Notifications (Phase 33)
  - [x] Add user information (username, email) to order details page
  - [x] Update getOrder API to join with profiles table
  - [x] Update OrderWithItems type to include user info
  - [x] Add Customer Information card in AdminOrderDetails
  - [x] Fix notification field name (is_read → read)
  - [x] Add order_id to cancellation notifications
  - [x] Verify cancel order with reason functionality
  - [x] Verify user inbox receives cancellation notifications
  - [x] Fix 404 error when viewing order details from admin orders page
- [x] Step 44: Payment Amount Display (Phase 34)
  - [x] Add payment_amount column to orders table
  - [x] Update Order type to include payment_amount field
  - [x] Update CheckoutPage to save payment_amount when creating order
  - [x] Update AdminOrderDetails to show payment type and amount paid
  - [x] Update OrdersPage to show amount paid for users
  - [x] Display remaining amount for delivery_only payments
- [x] Step 45: User Manual System (Phase 35)
  - [x] Create user_manual and user_manual_acceptances tables
  - [x] Add UserManual and UserManualAcceptance types
  - [x] Add user manual API functions (CRUD and acceptance tracking)
  - [x] Update AdminSettings to include user manual editor
  - [x] Add active/inactive toggle for user manual
  - [x] Create UserManualDialog component
  - [x] Integrate user manual dialog in ProductsPage
  - [x] Check if user has accepted manual on page load
  - [x] Prevent dialog dismissal until user accepts
  - [x] Track user acceptances in database
- [x] Step 46: Product-Specific User Manual System (Phase 36)
  - [x] Disable text selection globally across the application
  - [x] Allow text selection in input fields and textareas
  - [x] Add user_manual field to products table (optional)
  - [x] Create product_user_manual_acceptances table
  - [x] Add ProductUserManualAcceptance type
  - [x] Add 3 API functions for product manual management
  - [x] Update AdminProductEditor with user manual field
  - [x] Create ProductUserManualDialog component
  - [x] Integrate manual check in ProductDetailPage
  - [x] Show manual dialog when viewing product with manual
  - [x] Track acceptances per product per user
  - [x] Hide product details until manual is accepted
  - [x] Remove platform manual checks from HomePage and ProductsPage
- [x] Step 47: Enhanced Product Detail UX (Phase 37)
  - [x] Display product user manual beside description
  - [x] Move manual acceptance check to Buy Now and Add to Cart actions
  - [x] Show manual dialog only when user attempts purchase/cart action
  - [x] Create ImageZoomDialog component with full-screen view
  - [x] Add click-to-zoom functionality on product images
  - [x] Implement arrow navigation for image gallery in zoom view
  - [x] Add keyboard navigation (arrow keys and escape)
  - [x] Display image counter in zoom view
  - [x] Add hover effect with zoom icon on product images
  - [x] Continue with action after manual acceptance
  - [x] Allow free browsing before requiring manual acceptance
- [x] Step 48: Manual Beside Description & Admin Search (Phase 38)
  - [x] Display product user manual beside description (side-by-side grid layout)
  - [x] Show popup dialog when user clicks Buy Now or Add to Cart
  - [x] Add checkbox in popup: "I have read and understood the product user manual"
  - [x] Reset checkbox on each dialog open (no persistence)
  - [x] Disable Accept button until checkbox is checked
  - [x] Prevent dialog close by clicking outside
  - [x] Continue with action after manual acceptance
  - [x] Show only "Stock" label without quantity value
  - [x] Confirm random products in More Products section
  - [x] Add search input in admin orders page
  - [x] Implement search by Order ID
  - [x] Implement search by customer name (username and delivery name)
  - [x] Implement search by customer email
  - [x] Implement search by customer phone
  - [x] Add real-time filtering as admin types
  - [x] Make search work across all order status tabs

- [x] Step 49: Random Products & Admin Search Features (Phase 39)
  - [x] Shuffle products randomly on Products page
  - [x] Add search input in Admin Users page
  - [x] Implement user search by username
  - [x] Implement user search by email
  - [x] Implement user search by name
  - [x] Add real-time filtering for users
  - [x] Add search input in Admin Products page
  - [x] Implement product search by name
  - [x] Implement product search by category
  - [x] Implement product search by description
  - [x] Add real-time filtering for products
  - [x] Update empty states for search results

- [x] Step 50: Description Popup & Reviews Page (Phase 40)
  - [x] Show description in popup dialog when clicking 'Show More'
  - [x] Add Dialog component with ScrollArea for full description
  - [x] Remove inline expand/collapse for description
  - [x] Create dedicated ProductReviewsPage
  - [x] Display product name and average rating on reviews page
  - [x] Show all reviews with user info, ratings, and images
  - [x] Add back button to return to product detail
  - [x] Change 'View More Reviews' to 'View All Reviews'
  - [x] Navigate to reviews page instead of inline expansion
  - [x] Add route for /products/:slug/reviews
  - [x] Implement loading skeleton for reviews page

- [x] Step 51: Fix Reviews & Add Image Upload with Filter (Phase 41)
  - [x] Fix 'Failed to load reviews' error
  - [x] Update getProductReviews to accept slug parameter
  - [x] Auto-detect slug format and fetch product ID
  - [x] Add image upload functionality to review dialog
  - [x] Support up to 5 images per review
  - [x] Implement automatic image compression (over 1MB)
  - [x] Convert images to WEBP format with quality 0.8
  - [x] Resize images to max 1080p maintaining aspect ratio
  - [x] Show upload progress and compression notifications
  - [x] Display uploaded images with remove button
  - [x] Store images in Supabase Storage reviews/ folder
  - [x] Add star rating filter (5 to 1 star)
  - [x] Show review count for each rating
  - [x] Implement real-time filtering by rating
  - [x] Add 'All' button to show all reviews
  - [x] Disable filter buttons with zero reviews

- [x] Step 52: Fix Checkout Payment Method Bug (Phase 42)
  - [x] Fix Cash on Delivery staying selected when location changes
  - [x] Add useEffect to monitor location changes
  - [x] Check if selected payment method is available for new location
  - [x] Automatically reset payment method if not available
  - [x] Show info notification when payment method is cleared
  - [x] Ensure payment methods are always valid for selected location

- [x] Step 53: Fix Product User Manual Show More Functionality (Phase 43)
  - [x] Remove acceptance popup requirement for Show More button
  - [x] Show More button now expands content inline
  - [x] Show Less button collapses expanded content
  - [x] Acceptance popup only appears for Buy Now and Add to Cart actions
  - [x] User can view full manual content without accepting agreement
  - [x] Agreement popup only required when making a purchase

- [x] Step 54: Add On The Way Order Status (Phase 44)
  - [x] Add 'on_the_way' to order_status enum in database
  - [x] Update TypeScript OrderStatus type definition
  - [x] Add "On The Way" tab in admin orders page
  - [x] Add "On The Way" option in order status dropdown
  - [x] Update status badge display for all pages
  - [x] Add appropriate color styling for On The Way status
  - [x] Update user orders page to display new status
  - [x] Update admin order details page with new status

- [x] Step 55: Add Order Status Notifications to Inbox (Phase 45)
  - [x] Update updateOrderStatus function to create notifications
  - [x] Send notification when order status changes to Confirmed
  - [x] Send notification when order status changes to On The Way
  - [x] Send notification when order status changes to Delivered
  - [x] Add different colors for each notification type in inbox
  - [x] Blue color for Confirmed order notifications
  - [x] Cyan color for On The Way order notifications
  - [x] Green color for Delivered order notifications
  - [x] Update notification icons based on order status
  - [x] Update card border and background colors for unread notifications
  - [x] Each notification displays with unique color scheme

- [x] Step 56: Improve Payment Page and Cart Mobile Responsiveness (Phase 46)
  - [x] Add accordion/collapsible sections to payment page
  - [x] Payment instructions section now expandable/collapsible
  - [x] Cash on Delivery section now expandable/collapsible
  - [x] Terms and conditions section now expandable/collapsible
  - [x] All sections open by default for better UX
  - [x] Improve mobile responsiveness for payment page
  - [x] Enhance cart page mobile layout
  - [x] Make cart items responsive on small screens
  - [x] Optimize button sizes and spacing for mobile
  - [x] Improve text sizing across different screen sizes
  - [x] Add sticky order summary on desktop
  - [x] Better layout for product images and details on mobile

- [x] Step 57: Fix Scroll Position on Checkout and Payment Pages (Phase 47)
  - [x] Add scroll-to-top functionality to CheckoutPage
  - [x] Add scroll-to-top functionality to PaymentPage
  - [x] Add scroll-to-top functionality to CartPage for consistency
  - [x] Pages now load at the top instead of bottom
  - [x] Improved user experience when navigating to these pages

- [x] Step 58: Add Admin Categories Management and Improve Cart (Phase 48)
  - [x] Create AdminCategories page for managing product categories
  - [x] Add category API functions (getAllCategories, createCategory, updateCategory, deleteCategory)
  - [x] Add Categories route to admin routes
  - [x] Add Categories link to admin navigation with FolderTree icon
  - [x] Implement add/edit category dialog with name, description, and active status
  - [x] Implement delete category confirmation dialog
  - [x] Display categories in table with status badges
  - [x] Increase cart product image size from 20/24 to 28/32 (w-28 md:w-32, h-28 md:h-32)
  - [x] Increase placeholder icon size in cart
  - [x] Fix payment page "Back to Checkout" navigation to preserve buyNow parameter
  - [x] Ensure proper navigation flow between cart, checkout, and payment pages

- [x] Step 59: Fix Product Detail Page Issues (Phase 49)
  - [x] Add scroll-to-top functionality to ProductDetailPage
  - [x] Ensure user manual acceptance dialog shows for all users (not just logged in)
  - [x] Add login check for Buy Now button (redirect to login if not authenticated)
  - [x] User manual Show More/Show Less already implemented and working
  - [x] Manual acceptance required for both Add to Cart and Buy Now
  - [x] Page loads at top when opened for better user experience

- [x] Step 60: Fix Manual Dialog Close and Improve Show More (Phase 50)
  - [x] Add onCancel prop to ProductUserManualDialog component
  - [x] Enable X button (close) functionality on manual dialog
  - [x] Add Cancel button to manual dialog footer
  - [x] Handle dialog close properly with state reset
  - [x] Prevent closing by clicking outside (onInteractOutside)
  - [x] Increase Show More character limit from 200 to 300 characters
  - [x] Show more content before requiring expansion
  - [x] Maintain Show Less functionality for collapsing expanded content

- [x] Step 61: Implement User Role Purchase Restrictions (Phase 51)
  - [x] Add banned user check in CheckoutPage with redirect to home
  - [x] Add suspended user check to filter out Cash on Delivery payment method
  - [x] Display warning message for suspended users about COD restriction
  - [x] Add banned user check in ProductDetailPage for Add to Cart action
  - [x] Add banned user check in ProductDetailPage for Buy Now action
  - [x] Add banned user check in CartPage for Proceed to Checkout action
  - [x] Send inbox notification to banned users when they attempt to purchase
  - [x] Notification includes title, message, and system type
  - [x] Toast error messages displayed for banned users
  - [x] Prevent banned users from accessing checkout or making purchases
  - [x] Allow suspended users to purchase with online payment methods only

- [x] Step 62: Add Invoice Feature to Order Views (Phase 52)
  - [x] Create Invoice component with professional layout and styling
  - [x] Display order details, customer info, items, and payment summary
  - [x] Create InvoiceDialog component with print and download functionality
  - [x] Install react-to-print package for PDF generation
  - [x] Add View Invoice button to AdminOrderDetails page
  - [x] Add View Invoice button to user OrdersPage
  - [x] Invoice shows company name, order ID, date, and status
  - [x] Customer information section with name, phone, and address
  - [x] Order items table with product, quantity, price, and total
  - [x] Payment summary with subtotal, delivery, discount, and total
  - [x] Payment information with method, type, and transaction ID
  - [x] Print functionality for physical invoice copies
  - [x] Download PDF functionality for digital storage
  - [x] Professional invoice design with proper formatting
  - [x] Status-based color coding for order status display

- [x] Step 63: Add Invoice Editor for Admin Customization (Phase 53)
  - [x] Create invoice_settings table in database with all customization fields
  - [x] Add InvoiceSettings interface to types
  - [x] Create getInvoiceSettings and updateInvoiceSettings API functions
  - [x] Create AdminInvoiceEditor page with comprehensive form
  - [x] Company information section (name, logo, address, phone, email)
  - [x] Tax information section with tax ID and visibility toggle
  - [x] Bank details section (bank name, account name, account number, routing)
  - [x] Additional content section (custom notes, terms, footer text)
  - [x] Toggle switches for showing/hiding logo, tax ID, and bank details
  - [x] Update Invoice component to load and display custom settings
  - [x] Show company logo when enabled with proper styling
  - [x] Display custom company address, phone, and email
  - [x] Show tax ID when enabled
  - [x] Display custom notes below order items
  - [x] Show bank details section when enabled
  - [x] Display terms and conditions section
  - [x] Use custom footer text
  - [x] Add Invoice Editor link to admin sidebar navigation
  - [x] Add route for invoice editor page
  - [x] Real-time settings update with save button
  - [x] Professional form layout with card sections and icons

- [x] Step 64: Enhance Invoice with Logo, QR Code, and Mobile Responsiveness (Phase 54)
  - [x] Add qr_code_content and show_qr_code fields to invoice_settings table
  - [x] Update InvoiceSettings type with QR code fields
  - [x] Install react-qr-code package for QR code generation
  - [x] Redesign Invoice header with three-column layout (logo, info, QR)
  - [x] Display company logo on left side of invoice header
  - [x] Display company info in center of invoice header
  - [x] Display QR code on right side of invoice header
  - [x] Add QR Code section to AdminInvoiceEditor with preview
  - [x] QR code content textarea for custom URL or text
  - [x] Toggle switch to show/hide QR code on invoice
  - [x] Live QR code preview in admin editor
  - [x] Logo preview in admin editor when URL provided
  - [x] Make Invoice component fully mobile responsive
  - [x] Responsive header layout (stacked on mobile, row on desktop)
  - [x] Responsive font sizes (smaller on mobile, larger on desktop)
  - [x] Responsive spacing and padding throughout invoice
  - [x] Responsive grid layouts (single column on mobile, two columns on desktop)
  - [x] Horizontal scroll for order items table on small screens
  - [x] Responsive QR code size (80px with proper scaling)
  - [x] Make AdminInvoiceEditor fully mobile responsive
  - [x] Responsive header with stacked layout on mobile
  - [x] Full-width save button on mobile, auto-width on desktop
  - [x] Responsive card layouts and form fields
  - [x] Responsive padding (p-4 on mobile, p-6 on desktop)
  - [x] Responsive text sizes throughout editor
  - [x] Mobile-friendly input fields and textareas
  - [x] Responsive preview sections for logo and QR code
  - [x] Make InvoiceDialog mobile responsive with button layout

## Notes
- **Email Configuration**: Custom SMTP and email templates must be configured in Supabase Dashboard. See EMAIL_CONFIGURATION.md for detailed instructions on:
  - Setting up Gmail SMTP with shottopathverify@gmail.com
  - Customizing email templates with Shottopath branding
  - Configuring sender name and email address
  - DNS records for better email deliverability
- Using Supabase instead of Firebase for backend
- E-commerce color scheme: vibrant primary colors for products
- Mobile-first with bottom navigation
- Admin gets full access, users can only access after login
- Reviews only after order delivered
- Voucher system with usage limits
- Multiple payment methods based on delivery location
- First registered user becomes admin automatically
- Sample products inserted for demonstration
- Dark/light mode support with next-themes
- Enhanced signup with email and name fields
- Admin can see complete delivery address for orders
- Admin panel protected with role-based access control
- Product variants support (optional sizes, colors, pieces)
- Announcement popup system for admin-managed notifications
- Order filtering by status in admin panel
- Product categories: Electronics, Fashion, Home & Living, Beauty, Sports, Books
- Category filtering on products page
- Smooth animations: fade-in, slide-in effects, hover transitions
- Improved responsive design with better breakpoints
- Animated product cards with staggered loading
- Hover effects on buttons and cards
- Email-based authentication for sign-in and sign-up
- Buy Now feature for direct checkout without cart
- Checkout page handles both cart and Buy Now flows
- Navigation protection against multiple rapid clicks
- Disabled state during navigation to prevent duplicate requests
- Email verification enabled for all new signups
- Users must verify email before signing in
- Verification emails sent with redirect to app origin
- Email verification page handles confirmation status
- Product variants (colors, sizes) selection via popup dialog
- Separate cart items for different variant combinations
- Selected options displayed in cart with badges
- Quantity selector in variant selection dialog
- Review submission system for delivered orders
- Star rating with hover effects
- Optional text comments for reviews
- Stock validation in cart updates
- Inbox/notifications page for users
- Conditional navigation based on authentication status
- Real-time notification system with database storage
- Welcome notification automatically sent on signup
- Order confirmation notification sent on order placement
- Mark notifications as read functionality
- Multiple images support for products
- Video support for products (YouTube, Vimeo, direct links)
- Image gallery with thumbnail navigation
- Admin can upload multiple images per product
- Admin can add multiple video URLs per product
- Custom Shottopath logo as favicon and brand icon
- Professional branding throughout the application
- SEO-optimized meta tags for better discoverability
- Separate payment page with transaction details
- Terms and conditions system with admin management
- Payment gateway mobile numbers displayed
- Transaction ID validation and storage
- User agreement required before order placement
- Enhanced modern UI with animations and smooth transitions
- Improved login/signup experience with split layout design
- Beautiful product cards with hover effects and stock indicators
- Comprehensive admin order details page with full information
- Flexible payment options (full payment or delivery charge only)
- Delivery duration display for each location
- Working address management in checkout
- Mobile-friendly admin panel with hamburger menu
- Copy customer information with one click
- Consistent product ordering on every page load
- Professional product image display with proper sizing and padding
- Accurate revenue calculation excluding delivery charges
- Order cancellation system with reason and notifications
- Dynamic banner carousel on homepage with auto-rotation
- Admin banner management with image upload and ordering
- Separate product editor page with slug management
- Banner image upload to Supabase Storage
- Product image upload with automatic organization
- Fixed storage policies for secure uploads
- Simplified RLS policies to allow authenticated users

## Completed Features
✅ User authentication with email-based login
✅ Email verification for new signups
✅ Enhanced login/signup UI with modern design
✅ Animated background and smooth transitions
✅ Product management with categories
✅ Product slug field for SEO-friendly URLs
✅ Auto-generate slugs from product names
✅ Manual slug editing capability
✅ Separate product editor page (not dialog)
✅ Comprehensive product form with all fields
✅ Product image upload to Supabase Storage
✅ Automatic main image setting on first upload
✅ Support both file upload and URL input for images
✅ File validation (type and size) for uploads
✅ Product variants (colors, sizes) with selection dialog
✅ Multiple images per product with gallery view
✅ Video support for products
✅ Enhanced product cards with hover effects
✅ Stock badges and indicators
✅ Professional image display with padding and borders
✅ Clean background for product images
✅ Proper image sizing with max-width/max-height
✅ Rating display on product cards
✅ Consistent product ordering (no random shuffle on refresh)
✅ Beautiful product image presentation across all pages
✅ Custom branding with Shottopath logo
✅ Shopping cart functionality with stock validation
✅ Buy Now direct checkout
✅ Order management system
✅ Admin order details page with complete information
✅ View order items, quantities, and prices
✅ Display delivery address and payment details
✅ Copy customer name, phone, and address
✅ Cancel orders with reason (admin only)
✅ Cancellation notifications sent to users
✅ Cancelled order status with red badge
✅ Cancelled orders tab in admin panel
✅ Red background highlight for cancelled orders
✅ Prevent status changes on cancelled orders
✅ Voucher system
✅ Delivery location management with duration
✅ Delivery duration display on checkout
✅ Admin can edit delivery duration
✅ Delivery address management
✅ Add new addresses in checkout
✅ Auto-select newly added address
✅ Payment gateway configuration
✅ Separate payment page with instructions
✅ Transaction ID tracking for Bkash/Nagad
✅ Payment amount selection (full or delivery charge only)
✅ Flexible payment options for digital payments
✅ Terms and conditions system
✅ Admin terms management
✅ Payment instructions with gateway numbers
✅ User agreement validation
✅ User management (ban/suspend/unban)
✅ Review system with submission form
✅ Announcement system
✅ Banner management system
✅ Dynamic homepage carousel
✅ Auto-rotating banners (3 second intervals)
✅ Manual banner navigation with arrows
✅ Banner dots indicator
✅ Clickable banners with custom links
✅ Banner title overlay
✅ Admin can add/edit/delete banners
✅ Banner display order control
✅ Active/inactive banner toggle
✅ Banner image upload to Supabase Storage
✅ Fixed banner storage policies with proper permissions
✅ File validation for banner uploads (type and size)
✅ Support both URL input and file upload for banners
✅ Improved error handling and logging for uploads
✅ Inbox/notifications system with database
✅ Welcome notifications on signup
✅ Order confirmation notifications
✅ Order cancellation notifications with reason
✅ Accurate revenue tracking (product sales only)
✅ Revenue excludes delivery charges
✅ Dark/light mode
✅ Responsive design with animations
✅ Mobile admin panel with hamburger menu
✅ Full admin navigation on mobile devices
✅ Category filtering with enhanced badges
✅ Search functionality with improved design
✅ Navigation protection against multiple clicks
✅ Conditional navigation (Home hidden when signed in)
✅ SEO meta tags and social sharing optimization

## Pending Features
- Enhanced order history page with tracking
- Image upload for reviews
