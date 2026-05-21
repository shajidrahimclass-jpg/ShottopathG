import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductReviewsPage from './pages/ProductReviewsPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrdersPage from './pages/OrdersPage';
import ChatPage from './pages/ChatPage';
import InboxPage from './pages/InboxPage';
import RedeemCodesPage from './pages/RedeemCodesPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AppDownloadsPage from './pages/AppDownloadsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductEditor from './pages/admin/AdminProductEditor';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminChatPage from './pages/admin/AdminChatPage';
import AdminQuickRepliesPage from './pages/admin/AdminQuickRepliesPage';
import AdminOrderDetails from './pages/admin/AdminOrderDetails';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminRedeemCodes from './pages/admin/AdminRedeemCodes';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminBanners from './pages/admin/AdminBanners';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSendGiftCard from './pages/admin/AdminSendGiftCard';
import AdminTemplateManagement from './pages/admin/AdminTemplateManagement';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSEO from './pages/admin/AdminSEO';
import AdminInvoiceEditor from './pages/admin/AdminInvoiceEditor';
import AdminDatabaseManager from './pages/admin/AdminDatabaseManager';
import AdminSourceCode from './pages/admin/AdminSourceCode';
import AdminOAuthStatus from './pages/admin/AdminOAuthStatus';
import AdminProductBundles from './pages/admin/AdminProductBundles';
import AdminStockManagement from './pages/admin/AdminStockManagement';
import AdminNotificationHistory from './pages/admin/AdminNotificationHistory';
import AdminNotificationPreferences from './pages/admin/AdminNotificationPreferences';
import AdminAppDownloads from './pages/admin/AdminAppDownloads';
import AdminDownloadAnalytics from './pages/admin/AdminDownloadAnalytics';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';
import { adminPath } from './config/admin';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const getRoutes = (): RouteConfig[] => [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
  },
  {
    name: 'Products',
    path: '/products',
    element: <ProductsPage />,
  },
  {
    name: 'Product Detail',
    path: '/products/:slug',
    element: <ProductDetailPage />,
  },
  {
    name: 'Product Reviews',
    path: '/products/:slug/reviews',
    element: <ProductReviewsPage />,
  },
  {
    name: 'Cart',
    path: '/cart',
    element: <CartPage />,
  },
  {
    name: 'Wishlist',
    path: '/wishlist',
    element: <WishlistPage />,
  },
  {
    name: 'Checkout',
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    name: 'Payment',
    path: '/payment',
    element: <PaymentPage />,
  },
  {
    name: 'Orders',
    path: '/orders',
    element: <OrdersPage />,
  },
  {
    name: 'Chat',
    path: '/chat',
    element: <ChatPage />,
  },
  {
    name: 'Inbox',
    path: '/inbox',
    element: <InboxPage />,
  },
  {
    name: 'Redeem Codes',
    path: '/redeem-codes',
    element: <RedeemCodesPage />,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    name: 'App Downloads',
    path: '/app',
    element: <AppDownloadsPage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    name: 'Email Verification',
    path: '/verify-email',
    element: <EmailVerificationPage />,
  },
  {
    name: 'Auth Callback',
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    name: 'Admin Dashboard',
    path: adminPath(),
    element: <AdminDashboard />,
  },
  {
    name: 'Admin Products',
    path: adminPath('products'),
    element: <AdminProducts />,
  },
  {
    name: 'Admin Product Editor - New',
    path: adminPath('products/new'),
    element: <AdminProductEditor />,
  },
  {
    name: 'Admin Product Editor - Edit',
    path: adminPath('products/edit/:id'),
    element: <AdminProductEditor />,
  },
  {
    name: 'Admin Categories',
    path: adminPath('categories'),
    element: <AdminCategories />,
  },
  {
    name: 'Admin Product Bundles',
    path: adminPath('bundles'),
    element: <AdminProductBundles />,
  },
  {
    name: 'Admin Stock Management',
    path: adminPath('stock'),
    element: <AdminStockManagement />,
  },
  {
    name: 'Admin Orders',
    path: adminPath('orders'),
    element: <AdminOrders />,
  },
  {
    name: 'Admin Order Details',
    path: adminPath('orders/:id'),
    element: <AdminOrderDetails />,
  },
  {
    name: 'Admin Chat',
    path: adminPath('chat'),
    element: <AdminChatPage />,
  },
  {
    name: 'Admin Quick Replies',
    path: adminPath('quick-replies'),
    element: <AdminQuickRepliesPage />,
  },
  {
    name: 'Admin Vouchers',
    path: adminPath('vouchers'),
    element: <AdminVouchers />,
  },
  {
    name: 'Admin Redeem Codes',
    path: adminPath('redeem-codes'),
    element: <AdminRedeemCodes />,
  },
  {
    name: 'Admin Users',
    path: adminPath('users'),
    element: <AdminUsers />,
  },
  {
    name: 'Admin Announcements',
    path: adminPath('announcements'),
    element: <AdminAnnouncements />,
  },
  {
    name: 'Admin Banners',
    path: adminPath('banners'),
    element: <AdminBanners />,
  },
  {
    name: 'Admin Reviews',
    path: adminPath('reviews'),
    element: <AdminReviews />,
  },
  {
    name: 'Admin Send Gift Card',
    path: adminPath('send-gift-card'),
    element: <AdminSendGiftCard />,
  },
  {
    name: 'Admin Template Management',
    path: adminPath('template-management'),
    element: <AdminTemplateManagement />,
  },
  {
    name: 'Admin Settings',
    path: adminPath('settings'),
    element: <AdminSettings />,
  },
  {
    name: 'Admin SEO',
    path: adminPath('seo'),
    element: <AdminSEO />,
  },
  {
    name: 'Admin Invoice Editor',
    path: adminPath('invoice-editor'),
    element: <AdminInvoiceEditor />,
  },
  {
    name: 'Admin Database Manager',
    path: adminPath('database'),
    element: <AdminDatabaseManager />,
  },
  {
    name: 'Admin Source Code',
    path: adminPath('source-code'),
    element: <AdminSourceCode />,
  },
  {
    name: 'Admin App Downloads',
    path: adminPath('app-downloads'),
    element: <AdminAppDownloads />,
  },
  {
    name: 'Admin Download Analytics',
    path: adminPath('download-analytics'),
    element: <AdminDownloadAnalytics />,
  },
  {
    name: 'Admin OAuth Status',
    path: adminPath('oauth-status'),
    element: <AdminOAuthStatus />,
  },
  {
    name: 'Admin Notifications',
    path: adminPath('notifications'),
    element: <AdminNotificationHistory />,
  },
  {
    name: 'Admin Notification Preferences',
    path: adminPath('notification-preferences'),
    element: <AdminNotificationPreferences />,
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
  },
];

export default getRoutes;
