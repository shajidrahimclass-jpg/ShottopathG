export type UserRole = 'user' | 'admin' | 'banned' | 'suspended';
export type OrderStatus = 'pending' | 'confirmed' | 'on_the_way' | 'delivered' | 'cancelled';
export type VoucherType = 'percentage' | 'fixed';

export interface Profile {
  id: string;
  email: string | null;
  username: string;
  name: string | null;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address: string;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  landmark?: string;
  address_type?: 'home' | 'office' | 'other';
  is_default: boolean;
  created_at: string;
}

export interface DeliveryLocation {
  id: string;
  name: string;
  charge: number;
  duration: string;
  payment_methods: string[];
  created_at: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  image_url: string | null;
  thumbnail: string | null;
  pc_thumbnail?: string | null;
  mobile_thumbnail?: string | null;
  pc_images?: string[];
  mobile_images?: string[];
  videos: string[];
  stock: number;
  min_quantity: number;
  is_active: boolean;
  category: string | null;
  sizes: string[];
  colors: string[];
  pieces: number | null;
  user_manual: string | null;
  meta_description: string | null;
  meta_image: string | null;
  is_gift_card: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface RecentlyViewed {
  id: string;
  user_id: string;
  product_id: string;
  viewed_at: string;
  product?: Product;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  copyable_text?: string | null;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link: string | null;
  display_order: number;
  is_active: boolean;
  page: 'home' | 'products';
  created_at: string;
  updated_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minimum_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export type RedeemCodeStatus = 'available' | 'sold' | 'redeemed';

export interface RedeemCode {
  id: string;
  code: string;
  value: number;
  price: number;
  status: RedeemCodeStatus;
  created_by: string | null;
  purchased_by: string | null;
  used_in_order: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  delivery_location_id: string | null;
  delivery_address: {
    name: string;
    phone: string;
    address: string;
  };
  payment_method: string;
  payment_amount: 'full' | 'delivery_only' | null;
  payment_details: string | null;
  transaction_id: string | null;
  voucher_code: string | null;
  notes: string | null;
  gift_card_email: string | null;
  guest_email: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  selected_color?: string | null;
  selected_size?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  images: string[];
  hidden: boolean;
  is_anonymous: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  user?: {
    username: string;
    email: string;
  };
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
  };
}

export interface ReviewWithUser extends Review {
  user: {
    username: string;
  };
  product?: {
    name: string;
    slug: string;
  };
  responses?: ReviewResponse[];
}

export type NotificationType = 'welcome' | 'order' | 'announcement' | 'system' | 'chat' | 'low_stock' | 'message';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  order_id: string | null;
  link?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminNotificationPreferences {
  id: string;
  user_id: string;
  new_orders: boolean;
  low_stock: boolean;
  customer_messages: boolean;
  system_events: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceSettings {
  id: string;
  company_name: string;
  company_logo: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  tax_id: string | null;
  terms_and_conditions: string | null;
  custom_notes: string | null;
  footer_text: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_routing_number: string | null;
  show_logo: boolean;
  show_tax_id: boolean;
  show_bank_details: boolean;
  qr_code_content: string | null;
  show_qr_code: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: string;
  site_title: string;
  navbar_name: string;
  site_description: string | null;
  default_meta_image: string | null;
  favicon_url: string | null;
  copyright_year: string | null;
  copyright_company: string | null;
  admin_url_path: string;
  force_sign_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface TermsAndConditions {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefundsPolicy {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserManual {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserManualAcceptance {
  id: string;
  user_id: string;
  user_manual_id: string;
  accepted_at: string;
}

export interface ProductUserManualAcceptance {
  id: string;
  user_id: string;
  product_id: string;
  accepted_at: string;
}

export interface ProductBundle {
  id: string;
  product_id: string;
  related_product_id: string;
  bundle_discount_percent: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductBundleWithProduct extends ProductBundle {
  related_product: Product;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BundleAnalytics {
  id: string;
  bundle_id: string;
  views: number;
  selections: number;
  purchases: number;
  revenue_generated: number;
  discount_given: number;
  last_selected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuggestedBundle {
  id: string;
  product_id: string;
  related_product_id: string;
  suggested_discount_percent: number;
  co_purchase_count: number;
  confidence_score: number;
  expected_revenue_impact: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SuggestedBundleWithProducts extends SuggestedBundle {
  product: Product;
  related_product: Product;
}

export type MessageSenderRole = 'user' | 'admin';

export interface OrderMessage {
  id: string;
  order_id: string;
  user_id: string;
  message: string;
  image_url: string | null;
  sender_role: MessageSenderRole;
  is_read: boolean;
  created_at: string;
}

export interface OrderMessageWithProfile extends OrderMessage {
  sender_name: string;
  sender_email: string | null;
}

export interface QuickReply {
  id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AppPlatform = 'google_play' | 'microsoft_store' | 'app_store' | 'apk' | 'exe';

export interface AppDownload {
  id: string;
  platform: AppPlatform;
  title: string;
  description: string | null;
  link_url: string | null;
  file_url: string | null;
  version: string | null;
  file_size: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppDownloadPageView {
  id: string;
  user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  os_name: string | null;
  os_version: string | null;
  browser_name: string | null;
  browser_version: string | null;
  screen_width: number | null;
  screen_height: number | null;
  referrer_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  page_variant: string | null;
  viewed_at: string;
}

export interface AppDownloadAnalytics {
  id: string;
  download_id: string;
  user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  os_name: string | null;
  os_version: string | null;
  browser_name: string | null;
  browser_version: string | null;
  screen_width: number | null;
  screen_height: number | null;
  referrer_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  page_variant: string | null;
  download_method: string | null;
  downloaded_at: string;
}

export interface DownloadStats {
  download_id: string;
  platform: AppPlatform;
  title: string;
  total_downloads: number;
  unique_users: number;
  countries_count: number;
  last_download_at: string | null;
}

export interface GiftCardTemplate {
  id: string;
  name: string;
  occasion: string;
  subject_line: string;
  header_text: string;
  greeting_message: string;
  primary_color: string;
  secondary_color: string;
  emoji: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
