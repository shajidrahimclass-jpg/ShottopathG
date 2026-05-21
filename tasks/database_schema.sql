-- ============================================================
-- Shottopath E-Commerce Platform - Full Database Schema
-- Target: rixikhernphntvuwfzcy.supabase.co
-- Apply via: Supabase Dashboard → SQL Editor → Run All
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (User Management - ties to Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- ============================================================
-- 2. PUBLIC PROFILES (Public-facing user info)
-- ============================================================
CREATE TABLE public_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    bio TEXT,
    website_url TEXT,
    social_links JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_public_profiles_profile_id ON public_profiles(profile_id);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(1000),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    compare_at_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    weight DECIMAL(10,2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    dimensions JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    visibility VARCHAR(50) DEFAULT 'visible',
    category_ids UUID[],
    tag_ids UUID[],
    image_urls TEXT[],
    seo_title VARCHAR(70),
    seo_description VARCHAR(320),
    meta_data JSONB,
    average_rating DECIMAL(2,1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_visibility ON products(visibility);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_category_ids ON products USING GIN(category_ids);

-- ============================================================
-- 4. WISHLIST
-- ============================================================
CREATE TABLE wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, product_id)
);

CREATE INDEX idx_wishlist_profile_id ON wishlist(profile_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);

-- ============================================================
-- 5. RECENTLY VIEWED
-- ============================================================
CREATE TABLE recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 1,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, product_id)
);

CREATE INDEX idx_recently_viewed_profile_id ON recently_viewed(profile_id);
CREATE INDEX idx_recently_viewed_last_viewed ON recently_viewed(last_viewed_at DESC);

-- ============================================================
-- 6. PRODUCT BUNDLES
-- ============================================================
CREATE TABLE product_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(50) DEFAULT 'percentage',
    discount_value DECIMAL(10,2) DEFAULT 0,
    bundle_price DECIMAL(12,2),
    original_total_price DECIMAL(12,2),
    savings_amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_bundles_slug ON product_bundles(slug);
CREATE INDEX idx_product_bundles_status ON product_bundles(status);

-- Junction table for bundle products
CREATE TABLE product_bundle_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    is_optional BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bundle_id, product_id)
);

CREATE INDEX idx_bundle_items_bundle_id ON product_bundle_items(bundle_id);

-- ============================================================
-- 7. SUGGESTED BUNDLES
-- ============================================================
CREATE TABLE suggested_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    suggested_bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    reason TEXT,
    priority INTEGER DEFAULT 0,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, suggested_bundle_id)
);

CREATE INDEX idx_suggested_bundles_product ON suggested_bundles(product_id);

-- ============================================================
-- 8. REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    body TEXT,
    pros TEXT[],
    cons TEXT[],
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_profile_id ON reviews(profile_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================================
-- 9. REVIEW HELPFUL VOTES
-- ============================================================
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, profile_id)
);

CREATE INDEX idx_review_votes_review_id ON review_helpful_votes(review_id);

-- ============================================================
-- 10. REVIEW RESPONSES
-- ============================================================
CREATE TABLE review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_admin_response BOOLEAN DEFAULT FALSE,
    parent_response_id UUID REFERENCES review_responses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_responses_review ON review_responses(review_id);

-- ============================================================
-- 11. STOCK MOVEMENTS
-- ============================================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(100),
    notes TEXT,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

-- ============================================================
-- 12. PAYMENT GATEWAYS
-- ============================================================
CREATE TABLE payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    provider VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_test_mode BOOLEAN DEFAULT TRUE,
    config JSONB,
    webhook_url TEXT,
    webhook_secret TEXT,
    supported_currencies TEXT[],
    supported_methods TEXT[],
    processing_fee_percent DECIMAL(5,2) DEFAULT 0,
    processing_fee_fixed DECIMAL(10,2) DEFAULT 0,
    logo_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_gateways_code ON payment_gateways(code);
CREATE INDEX idx_payment_gateways_active ON payment_gateways(is_active);

-- ============================================================
-- 13. ORDERS
-- ============================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    coupon_code VARCHAR(100),
    discount_breakdown JSONB,
    tax_breakdown JSONB,
    shipping_breakdown JSONB,
    billing_address JSONB,
    shipping_address JSONB,
    shipping_method VARCHAR(255),
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    notes TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    ip_address INET,
    user_agent TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_profile_id ON orders(profile_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- 14. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    bundle_id UUID REFERENCES product_bundles(id) ON DELETE SET NULL,
    name VARCHAR(500) NOT NULL,
    sku VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_bundle_item BOOLEAN DEFAULT FALSE,
    bundle_parent_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================
-- 15. ORDER MESSAGES
-- ============================================================
CREATE TABLE order_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sender_type VARCHAR(50) DEFAULT 'customer',
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_messages_order ON order_messages(order_id);
CREATE INDEX idx_order_messages_created ON order_messages(created_at DESC);
CREATE INDEX idx_order_messages_unread ON order_messages(is_read) WHERE is_read = FALSE;

-- ============================================================
-- 16. INVOICE SETTINGS
-- ============================================================
CREATE TABLE invoice_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255),
    store_address TEXT,
    store_email VARCHAR(255),
    store_phone VARCHAR(50),
    store_tax_id VARCHAR(100),
    store_registration_number VARCHAR(100),
    invoice_prefix VARCHAR(50) DEFAULT 'INV-',
    invoice_suffix VARCHAR(50),
    next_invoice_number INTEGER DEFAULT 1000,
    invoice_template VARCHAR(100) DEFAULT 'default',
    footer_notes TEXT,
    terms_conditions TEXT,
    bank_details JSONB,
    logo_url TEXT,
    signature_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. REFUNDS POLICY
-- ============================================================
CREATE TABLE refunds_policy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    return_window_days INTEGER DEFAULT 30,
    is_refund_allowed BOOLEAN DEFAULT TRUE,
    is_exchange_allowed BOOLEAN DEFAULT TRUE,
    is_store_credit_allowed BOOLEAN DEFAULT FALSE,
    conditions TEXT[],
    excluded_categories UUID[],
    excluded_products UUID[],
    restocking_fee_percent DECIMAL(5,2) DEFAULT 0,
    max_refund_amount DECIMAL(12,2),
    policy_text TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refunds_policy_default ON refunds_policy(is_default);

-- ============================================================
-- 18. VOUCHERS / COUPONS
-- ============================================================
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255),
    description TEXT,
    discount_type VARCHAR(50) NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    minimum_order_amount DECIMAL(12,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(12,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    applicable_products UUID[],
    excluded_products UUID[],
    applicable_categories UUID[],
    excluded_categories UUID[],
    applicable_customer_groups TEXT[],
    is_free_shipping BOOLEAN DEFAULT FALSE,
    is_first_order_only BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_active ON vouchers(is_active);
CREATE INDEX idx_vouchers_dates ON vouchers(start_date, end_date);

-- ============================================================
-- 19. GIFT CARD TEMPLATES
-- ============================================================
CREATE TABLE gift_card_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    thumbnail_url TEXT,
    design_data JSONB,
    preset_amounts DECIMAL(12,2)[],
    min_amount DECIMAL(12,2),
    max_amount DECIMAL(12,2),
    expiry_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    is_customizable BOOLEAN DEFAULT FALSE,
    occasion_tags TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. REDEEM CODES
-- ============================================================
CREATE TABLE redeem_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    is_percentage BOOLEAN DEFAULT FALSE,
    gift_card_template_id UUID REFERENCES gift_card_templates(id) ON DELETE SET NULL,
    voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ,
    redeemed_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    expiry_date TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX idx_redeem_codes_redeemed ON redeem_codes(is_redeemed);

-- ============================================================
-- 21. USER MANUAL
-- ============================================================
CREATE TABLE user_manual (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    content TEXT NOT NULL,
    content_format VARCHAR(50) DEFAULT 'markdown',
    language VARCHAR(10) DEFAULT 'en',
    version VARCHAR(50) DEFAULT '1.0',
    is_latest_version BOOLEAN DEFAULT TRUE,
    parent_manual_id UUID REFERENCES user_manual(id) ON DELETE SET NULL,
    page_count INTEGER,
    file_size_bytes INTEGER,
    download_url TEXT,
    file_type VARCHAR(50),
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    tags TEXT[],
    is_required_acceptance BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_manual_product ON user_manual(product_id);
CREATE INDEX idx_user_manual_slug ON user_manual(slug);
CREATE INDEX idx_user_manual_published ON user_manual(is_published);

-- ============================================================
-- 22. USER MANUAL ACCEPTANCES
-- ============================================================
CREATE TABLE user_manual_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manual_id UUID NOT NULL REFERENCES user_manual(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    version_accepted VARCHAR(50),
    signature TEXT,
    notes TEXT,
    UNIQUE(manual_id, profile_id)
);

CREATE INDEX idx_manual_acceptances_manual ON user_manual_acceptances(manual_id);
CREATE INDEX idx_manual_acceptances_profile ON user_manual_acceptances(profile_id);

-- ============================================================
-- 23. PRODUCT USER MANUAL ACCEPTANCES
-- ============================================================
CREATE TABLE product_user_manual_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    manual_id UUID NOT NULL REFERENCES user_manual(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_required_for_use BOOLEAN DEFAULT TRUE,
    UNIQUE(product_id, profile_id, manual_id)
);

CREATE INDEX idx_product_manual_accept_product ON product_user_manual_acceptances(product_id);
CREATE INDEX idx_product_manual_accept_profile ON product_user_manual_acceptances(profile_id);

-- ============================================================
-- 24. TERMS AND CONDITIONS
-- ============================================================
CREATE TABLE terms_and_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    content TEXT NOT NULL,
    content_format VARCHAR(50) DEFAULT 'markdown',
    version VARCHAR(50) NOT NULL,
    is_current_version BOOLEAN DEFAULT FALSE,
    effective_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    document_type VARCHAR(100) DEFAULT 'terms',
    jurisdiction VARCHAR(255),
    is_required_at_checkout BOOLEAN DEFAULT TRUE,
    is_required_at_registration BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_terms_slug ON terms_and_conditions(slug);
CREATE INDEX idx_terms_current ON terms_and_conditions(is_current_version);
CREATE INDEX idx_terms_effective ON terms_and_conditions(effective_date);

-- ============================================================
-- 25. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    data JSONB,
    action_url TEXT,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_important BOOLEAN DEFAULT FALSE,
    source VARCHAR(100),
    reference_id UUID,
    reference_type VARCHAR(100),
    delivery_method VARCHAR(50) DEFAULT 'in_app',
    email_sent_at TIMESTAMPTZ,
    push_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile ON notifications(profile_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read, created_at) WHERE is_read = FALSE;

-- ============================================================
-- 26. QUICK REPLIES
-- ============================================================
CREATE TABLE quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    shortcut VARCHAR(100),
    category VARCHAR(100),
    tags TEXT[],
    is_global BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quick_replies_profile ON quick_replies(profile_id);
CREATE INDEX idx_quick_replies_global ON quick_replies(is_global);
CREATE INDEX idx_quick_replies_category ON quick_replies(category);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES (Supabase)
-- ============================================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Public Profiles RLS
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own public profile" ON public_profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profiles.id = public_profiles.profile_id));

-- Products RLS (public read)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (status = 'active' AND visibility = 'visible');
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Wishlist RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own wishlist" ON wishlist FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profiles.id = wishlist.profile_id));

-- Orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Order Items RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND orders.profile_id = auth.uid()));

-- Reviews RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published reviews are publicly readable" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can manage their own reviews" ON reviews FOR ALL USING (auth.uid() = profile_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON notifications FOR ALL USING (auth.uid() = profile_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_public_profiles_updated_at BEFORE UPDATE ON public_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_bundles_updated_at BEFORE UPDATE ON product_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_responses_updated_at BEFORE UPDATE ON review_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gift_card_templates_updated_at BEFORE UPDATE ON gift_card_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_manual_updated_at BEFORE UPDATE ON user_manual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_terms_and_conditions_updated_at BEFORE UPDATE ON terms_and_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_policy_updated_at BEFORE UPDATE ON refunds_policy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_settings_updated_at BEFORE UPDATE ON invoice_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quick_replies_updated_at BEFORE UPDATE ON quick_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suggested_bundles_updated_at BEFORE UPDATE ON suggested_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Update product review stats
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products SET
        average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = NEW.product_id AND status = 'approved'),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id AND status = 'approved'),
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_stats_after_review AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();

-- Update product stock from stock movements
CREATE OR REPLACE FUNCTION update_product_stock_from_movement()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products SET
        quantity = NEW.new_quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_stock AFTER INSERT ON stock_movements FOR EACH ROW EXECUTE FUNCTION update_product_stock_from_movement();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default payment gateways
INSERT INTO payment_gateways (name, code, provider, is_active, is_test_mode, supported_currencies, supported_methods, sort_order) VALUES
('Stripe', 'stripe', 'stripe', true, true, ARRAY['USD', 'EUR', 'GBP', 'CAD', 'AUD'], ARRAY['credit_card', 'debit_card'], 1),
('PayPal', 'paypal', 'paypal', false, true, ARRAY['USD', 'EUR', 'GBP'], ARRAY['paypal', 'credit_card'], 2),
('Cash on Delivery', 'cod', 'manual', false, false, ARRAY['USD'], ARRAY['cash'], 99);

-- Default invoice settings
INSERT INTO invoice_settings (store_name, invoice_prefix, footer_notes, is_active) VALUES
('My Store', 'INV-', 'Thank you for your business!', true);

-- Default refunds policy
INSERT INTO refunds_policy (name, return_window_days, is_refund_allowed, is_exchange_allowed, restocking_fee_percent, is_default, policy_text) VALUES
('Standard 30-Day Return', 30, true, true, 0, true, 'Items may be returned within 30 days of delivery for a full refund or exchange.');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
