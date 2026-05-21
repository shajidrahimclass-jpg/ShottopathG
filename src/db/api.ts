import { supabase } from './supabase';
import type {
  Profile,
  DeliveryAddress,
  DeliveryLocation,
  PaymentGateway,
  Product,
  Voucher,
  RedeemCode,
  Order,
  OrderItem,
  Review,
  OrderWithItems,
  ReviewWithUser,
  ReviewResponse,
  ReviewHelpfulVote,
  Announcement,
  Banner,
  Category,
  Notification,
  NotificationType,
  TermsAndConditions,
  RefundsPolicy,
  UserManual,
  UserManualAcceptance,
  ProductUserManualAcceptance,
  InvoiceSettings,
  AppSettings,
  ProductBundleWithProduct,
  StockMovement,
  BundleAnalytics,
  SuggestedBundle,
  Wishlist,
  RecentlyViewed,
  SuggestedBundleWithProducts,
  ProductBundle,
  AppDownload,
  AppDownloadPageView,
  AppDownloadAnalytics,
  DownloadStats,
} from '@/types';

// Profile APIs — fetches with retry to handle the edge case where the DB
// trigger hasn't finished writing at the exact moment of the first fetch.
export const getProfile = async (userId: string, retries = 3): Promise<Profile | null> => {
  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.message?.includes('relation "profiles" does not exist') ||
            error.message?.includes('does not exist')) {
          console.error('Database not set up. Please apply migrations first.');
          return null;
        }
        console.error(`Error fetching profile (attempt ${attempt}):`, error);
        if (attempt === retries) return null;
      } else if (data) {
        return data;
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 600 * attempt));
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Delivery Address APIs
export const getDeliveryAddresses = async (userId: string): Promise<DeliveryAddress[]> => {
  const { data, error } = await supabase
    .from('delivery_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createDeliveryAddress = async (address: Omit<DeliveryAddress, 'id' | 'created_at'>): Promise<DeliveryAddress> => {
  const { data, error } = await supabase
    .from('delivery_addresses')
    .insert(address)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateDeliveryAddress = async (id: string, updates: Partial<DeliveryAddress>): Promise<DeliveryAddress> => {
  const { data, error } = await supabase
    .from('delivery_addresses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteDeliveryAddress = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('delivery_addresses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Delivery Location APIs
export const getDeliveryLocations = async (): Promise<DeliveryLocation[]> => {
  const { data, error } = await supabase
    .from('delivery_locations')
    .select('*')
    .order('charge', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const updateDeliveryLocation = async (id: string, updates: Partial<DeliveryLocation>): Promise<DeliveryLocation> => {
  const { data, error } = await supabase
    .from('delivery_locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Payment Gateway APIs
export const getPaymentGateways = async (): Promise<PaymentGateway[]> => {
  const { data, error } = await supabase
    .from('payment_gateways')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const updatePaymentGateway = async (id: string, updates: Partial<PaymentGateway>): Promise<PaymentGateway> => {
  const { data, error } = await supabase
    .from('payment_gateways')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Product APIs
export const getProducts = async (limit?: number): Promise<Product[]> => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('Database not set up. Please apply migrations. See QUICK_START.md');
        return [];
      }
      throw error;
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });
    
    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('Database not set up. Please apply migrations. See QUICK_START.md');
        return [];
      }
      throw error;
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
};

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('Database not set up. Please apply migrations. See QUICK_START.md');
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Voucher APIs
export const getVouchers = async (): Promise<Voucher[]> => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getVoucherByCode = async (code: string): Promise<Voucher | null> => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createVoucher = async (voucher: Omit<Voucher, 'id' | 'usage_count' | 'created_at'>): Promise<Voucher> => {
  const { data, error } = await supabase
    .from('vouchers')
    .insert(voucher)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateVoucher = async (id: string, updates: Partial<Voucher>): Promise<Voucher> => {
  const { data, error } = await supabase
    .from('vouchers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteVoucher = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vouchers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Order APIs
export const getOrders = async (userId?: string): Promise<OrderWithItems[]> => {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data: orders, error } = await query;
  
  if (error) throw error;
  
  if (!orders || orders.length === 0) return [];
  
  const orderIds = orders.map(o => o.id);
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);
  
  if (itemsError) throw itemsError;
  
  return orders.map(order => ({
    ...order,
    items: Array.isArray(items) ? items.filter(item => item.order_id === order.id) : [],
  }));
};

export const getOrder = async (id: string): Promise<OrderWithItems | null> => {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  if (!order) return null;
  
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);
  
  if (itemsError) throw itemsError;
  
  // Get user information
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', order.user_id)
    .maybeSingle();
  
  if (userError) {
    console.error('Failed to fetch user profile:', userError);
  }
  
  return {
    ...order,
    items: Array.isArray(items) ? items : [],
    user: userProfile || undefined,
  };
};

// Alias for admin usage
export const getOrderById = getOrder;

export const createOrder = async (
  order: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]
): Promise<Order> => {
  // Check stock availability and deduct stock for each product
  for (const item of items) {
    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', item.product_id)
      .single();
    
    if (productError) throw new Error(`Failed to check stock for product: ${productError.message}`);
    
    if (!product) {
      throw new Error(`Product not found: ${item.product_name}`);
    }
    
    // Check if sufficient stock is available
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
    }
    
    // Deduct stock
    const newStock = product.stock - item.quantity;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.product_id);
    
    if (updateError) throw new Error(`Failed to update stock for ${product.name}: ${updateError.message}`);
  }
  
  // Create order
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  
  if (orderError) throw orderError;
  
  // Create order items
  const orderItems = items.map(item => ({
    ...item,
    order_id: newOrder.id,
  }));
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  
  if (itemsError) throw itemsError;
  
  // Dispatch stock update event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stockUpdated'));
  }
  
  return newOrder;
};

export const updateOrderStatus = async (id: string, status: Order['status']): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Create notification for status changes
  if (status === 'confirmed' || status === 'on_the_way' || status === 'delivered') {
    const notificationMessages = {
      confirmed: {
        title: 'Order Confirmed',
        message: `Your order #${id.slice(0, 8)} has been confirmed and is being prepared for shipment.`
      },
      on_the_way: {
        title: 'Order On The Way',
        message: `Your order #${id.slice(0, 8)} is now on the way to your delivery address.`
      },
      delivered: {
        title: 'Order Delivered',
        message: `Your order #${id.slice(0, 8)} has been delivered successfully. Thank you for shopping with us!`
      }
    };
    
    const notification = notificationMessages[status as 'confirmed' | 'on_the_way' | 'delivered'];
    
    if (notification) {
      await createNotification({
        user_id: data.user_id,
        type: 'order',
        title: notification.title,
        message: notification.message,
        read: false,
        order_id: id
      });
    }
  }
  
  return data;
};

export const cancelOrder = async (id: string, reason: string): Promise<Order> => {
  // Get order items before cancelling to restore stock
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', id);
  
  if (itemsError) throw itemsError;
  
  // Restore stock for each product
  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      
      if (productError) {
        console.error(`Failed to get product stock for ${item.product_id}:`, productError);
        continue; // Continue with other items even if one fails
      }
      
      if (product) {
        // Restore stock
        const newStock = product.stock + item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);
        
        if (updateError) {
          console.error(`Failed to restore stock for ${item.product_id}:`, updateError);
        }
      }
    }
    
    // Dispatch stock update event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('stockUpdated'));
    }
  }
  
  // Update order status to cancelled
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (orderError) throw orderError;

  // Create notification for user
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: order.user_id,
      title: 'Order Cancelled',
      message: `Your order #${id.slice(0, 8)} has been cancelled. Reason: ${reason}`,
      type: 'order',
      read: false,
      order_id: id,
    });

  if (notificationError) {
    console.error('Failed to create notification:', notificationError);
  }

  return order;
};

// Review APIs
export const getProductReviews = async (productIdOrSlug: string): Promise<ReviewWithUser[]> => {
  // First, check if it's a slug and get the product ID
  let productId = productIdOrSlug;
  
  // If it contains hyphens, it's likely a slug
  if (productIdOrSlug.includes('-')) {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('slug', productIdOrSlug)
      .single();
    
    if (product) {
      productId = product.id;
    }
  }
  
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles!reviews_user_id_fkey(username),
      responses:review_responses(
        id,
        review_id,
        user_id,
        content,
        is_admin,
        created_at,
        updated_at
      )
    `)
    .eq('product_id', productId)
    .eq('hidden', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Fetch user data for responses separately with error handling
  const reviewsWithUsers = await Promise.all((data || []).map(async (review) => {
    let responsesWithUsers: any[] = [];
    
    try {
      responsesWithUsers = await Promise.all((review.responses || []).map(async (response: any) => {
        try {
          const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', response.user_id)
            .maybeSingle();
          
          return {
            ...response,
            user: { username: userData?.username || 'Unknown' }
          };
        } catch (err) {
          console.error('Error fetching user for response:', err);
          return {
            ...response,
            user: { username: 'Unknown' }
          };
        }
      }));
    } catch (err) {
      console.error('Error fetching responses:', err);
      responsesWithUsers = [];
    }

    return {
      ...review,
      user: { username: review.user?.username || 'Unknown' },
      responses: responsesWithUsers
    };
  }));
  
  return reviewsWithUsers as ReviewWithUser[];
};

export const getUserReviews = async (userId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createReview = async (review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review> => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateReview = async (id: string, updates: Partial<Review>): Promise<Review> => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteReview = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getAllReviews = async (): Promise<ReviewWithUser[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles!reviews_user_id_fkey(username),
      product:products!reviews_product_id_fkey(name, slug),
      responses:review_responses(
        id,
        review_id,
        user_id,
        content,
        is_admin,
        created_at,
        updated_at
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Fetch user data for responses separately with error handling
  const reviewsWithUsers = await Promise.all((data || []).map(async (review) => {
    let responsesWithUsers: any[] = [];
    
    try {
      responsesWithUsers = await Promise.all((review.responses || []).map(async (response: any) => {
        try {
          const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', response.user_id)
            .maybeSingle();
          
          return {
            ...response,
            user: { username: userData?.username || 'Unknown' }
          };
        } catch (err) {
          console.error('Error fetching user for response:', err);
          return {
            ...response,
            user: { username: 'Unknown' }
          };
        }
      }));
    } catch (err) {
      console.error('Error fetching responses:', err);
      responsesWithUsers = [];
    }

    return {
      ...review,
      user: { username: review.user?.username || 'Unknown' },
      product: { name: review.product?.name || 'Unknown', slug: review.product?.slug || '' },
      responses: responsesWithUsers
    };
  }));
  
  return reviewsWithUsers as ReviewWithUser[];
};

export const toggleReviewHidden = async (id: string, hidden: boolean): Promise<Review> => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ hidden, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Review Response APIs
export const getReviewResponses = async (reviewId: string): Promise<ReviewResponse[]> => {
  const { data, error } = await supabase
    .from('review_responses')
    .select('*')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  // Fetch user data separately with error handling
  const responsesWithUsers = await Promise.all((data || []).map(async (response) => {
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', response.user_id)
        .maybeSingle();
      
      return {
        ...response,
        user: { username: userData?.username || 'Unknown' }
      };
    } catch (err) {
      console.error('Error fetching user for response:', err);
      return {
        ...response,
        user: { username: 'Unknown' }
      };
    }
  }));
  
  return responsesWithUsers;
};

export const createReviewResponse = async (
  reviewId: string,
  content: string,
  isAdmin: boolean = false
): Promise<ReviewResponse> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('review_responses')
    .insert({
      review_id: reviewId,
      user_id: user.id,
      content,
      is_admin: isAdmin
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Fetch user data separately
  const { data: userData } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user_id)
    .maybeSingle();
  
  return {
    ...data,
    user: { username: userData?.username || 'Unknown' }
  };
};

export const updateReviewResponse = async (
  id: string,
  content: string
): Promise<ReviewResponse> => {
  const { data, error } = await supabase
    .from('review_responses')
    .update({ content })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Fetch user data separately
  const { data: userData } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user_id)
    .maybeSingle();
  
  return {
    ...data,
    user: { username: userData?.username || 'Unknown' }
  };
};

export const deleteReviewResponse = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('review_responses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Image Upload API
export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
  console.log('Uploading image:', file.name, 'to folder:', folder);
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  console.log('Upload path:', fileName);
  const { data, error } = await supabase.storage
    .from('app-9cyfgucqbpj5_shottopoth_images')
    .upload(fileName, file);
  
  if (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
  
  console.log('Upload successful, getting public URL for:', data.path);
  const { data: { publicUrl } } = supabase.storage
    .from('app-9cyfgucqbpj5_shottopoth_images')
    .getPublicUrl(data.path);
  
  console.log('Public URL:', publicUrl);
  return publicUrl;
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  console.log('Uploading banner image:', file.name);
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  console.log('Banner upload path:', fileName);
  const { data, error } = await supabase.storage
    .from('banners')
    .upload(fileName, file);
  
  if (error) {
    console.error('Banner upload error:', error);
    throw new Error(error.message || 'Failed to upload banner image');
  }
  
  console.log('Banner upload successful, getting public URL for:', data.path);
  const { data: { publicUrl } } = supabase.storage
    .from('banners')
    .getPublicUrl(data.path);
  
  console.log('Banner public URL:', publicUrl);
  return publicUrl;
};

// Announcement APIs
export const getAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<Announcement> => {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateAnnouncement = async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
  const { data, error } = await supabase
    .from('announcements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Banner APIs
export const getBanners = async (): Promise<Banner[]> => {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getActiveBanners = async (page: 'home' | 'products' = 'home'): Promise<Banner[]> => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .eq('page', page)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('Database not set up. Please apply migrations. See QUICK_START.md');
        return [];
      }
      throw error;
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};

export const createBanner = async (banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>): Promise<Banner> => {
  const { data, error } = await supabase
    .from('banners')
    .insert(banner)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateBanner = async (id: string, updates: Partial<Banner>): Promise<Banner> => {
  const { data, error } = await supabase
    .from('banners')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteBanner = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Category APIs
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('Database not set up. Please apply migrations. See QUICK_START.md');
        return [];
      }
      throw error;
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createCategory = async (category: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Notification APIs
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createNotification = async (
  notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false);
  
  if (error) throw error;
};

// Terms and Conditions APIs
export const getActiveTerms = async (): Promise<TermsAndConditions | null> => {
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getAllTerms = async (): Promise<TermsAndConditions[]> => {
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createTerms = async (terms: Omit<TermsAndConditions, 'id' | 'created_at' | 'updated_at'>): Promise<TermsAndConditions> => {
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .insert(terms)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTerms = async (id: string, terms: Partial<TermsAndConditions>): Promise<void> => {
  const { error } = await supabase
    .from('terms_and_conditions')
    .update({ ...terms, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteTerms = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('terms_and_conditions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Refunds Policy
export const getActiveRefundsPolicy = async (): Promise<RefundsPolicy | null> => {
  const { data, error } = await supabase
    .from('refunds_policy')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getAllRefundsPolicy = async (): Promise<RefundsPolicy[]> => {
  const { data, error } = await supabase
    .from('refunds_policy')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const updateRefundsPolicy = async (id: string, policy: Partial<RefundsPolicy>): Promise<void> => {
  const { error } = await supabase
    .from('refunds_policy')
    .update({ ...policy, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
};

// User Manual APIs
export const getAllUserManuals = async (): Promise<UserManual[]> => {
  const { data, error } = await supabase
    .from('user_manual')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getActiveUserManual = async (): Promise<UserManual | null> => {
  const { data, error } = await supabase
    .from('user_manual')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createUserManual = async (manual: Omit<UserManual, 'id' | 'created_at' | 'updated_at'>): Promise<UserManual> => {
  const { data, error } = await supabase
    .from('user_manual')
    .insert(manual)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUserManual = async (id: string, updates: Partial<Omit<UserManual, 'id' | 'created_at' | 'updated_at'>>): Promise<UserManual> => {
  const { data, error } = await supabase
    .from('user_manual')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteUserManual = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_manual')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// User Manual Acceptance APIs
export const checkUserManualAcceptance = async (userId: string, manualId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_manual_acceptances')
    .select('id')
    .eq('user_id', userId)
    .eq('user_manual_id', manualId)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};

export const acceptUserManual = async (userId: string, manualId: string): Promise<UserManualAcceptance> => {
  const { data, error } = await supabase
    .from('user_manual_acceptances')
    .insert({
      user_id: userId,
      user_manual_id: manualId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUserManualAcceptances = async (userId: string): Promise<UserManualAcceptance[]> => {
  const { data, error } = await supabase
    .from('user_manual_acceptances')
    .select('*')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Product User Manual Functions
export const checkProductUserManualAcceptance = async (userId: string, productId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('product_user_manual_acceptances')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};

export const acceptProductUserManual = async (userId: string, productId: string): Promise<ProductUserManualAcceptance> => {
  const { data, error } = await supabase
    .from('product_user_manual_acceptances')
    .insert({
      user_id: userId,
      product_id: productId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getProductUserManualAcceptances = async (userId: string): Promise<ProductUserManualAcceptance[]> => {
  const { data, error } = await supabase
    .from('product_user_manual_acceptances')
    .select('*')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Invoice Settings APIs
export const getInvoiceSettings = async (): Promise<InvoiceSettings | null> => {
  const { data, error } = await supabase
    .from('invoice_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateInvoiceSettings = async (
  id: string,
  settings: Partial<Omit<InvoiceSettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<InvoiceSettings> => {
  const { data, error } = await supabase
    .from('invoice_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// App Settings APIs
export const getAppSettings = async (): Promise<AppSettings | null> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateAppSettings = async (
  id: string,
  settings: Partial<Omit<AppSettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('app_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ==================== Order Messages ====================

export const getOrderMessages = async (orderId: string) => {
  const { data, error } = await supabase
    .from('order_messages')
    .select(`
      *,
      profiles!order_messages_user_id_fkey (
        name,
        email
      )
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(msg => ({
    ...msg,
    sender_name: msg.profiles?.name || 'Unknown',
    sender_email: msg.profiles?.email || null,
  }));
};

export const sendOrderMessage = async (
  orderId: string,
  message: string,
  senderRole: 'user' | 'admin',
  imageUrl?: string | null
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('order_messages')
    .insert({
      order_id: orderId,
      user_id: user.id,
      message: message.trim(),
      image_url: imageUrl || null,
      sender_role: senderRole,
      is_read: false,
    })
    .select()
    .single();
  
  if (error) throw error;

  // If admin sends a message, create a notification for the user
  if (senderRole === 'admin') {
    try {
      // Get the order to find the user_id
      const { data: orderData } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (orderData?.user_id) {
        await createNotification({
          user_id: orderData.user_id,
          type: 'chat',
          title: 'New Message from Admin',
          message: message.length > 100 ? message.substring(0, 100) + '...' : message,
          read: false,
          order_id: orderId,
        });
      }
    } catch (notifError) {
      console.error('Failed to create chat notification:', notifError);
      // Don't throw error, message was sent successfully
    }
  }

  return data;
};

export const markMessagesAsRead = async (orderId: string, senderRole: 'user' | 'admin') => {
  // Mark messages as read where the sender is NOT the current role
  // (e.g., if user is reading, mark admin messages as read)
  const { error } = await supabase
    .from('order_messages')
    .update({ is_read: true })
    .eq('order_id', orderId)
    .eq('sender_role', senderRole === 'user' ? 'admin' : 'user')
    .eq('is_read', false);
  
  if (error) throw error;
};

export const getUnreadMessageCount = async (orderId: string, forRole: 'user' | 'admin') => {
  // Count unread messages sent by the opposite role
  const { count, error } = await supabase
    .from('order_messages')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .eq('sender_role', forRole === 'user' ? 'admin' : 'user')
    .eq('is_read', false);
  
  if (error) throw error;
  return count || 0;
};

export const getAllOrdersWithUnreadMessages = async () => {
  const { data, error } = await supabase
    .from('order_messages')
    .select(`
      order_id,
      orders!inner (
        id,
        order_number,
        user_id,
        profiles!orders_user_id_fkey (
          name,
          email
        )
      )
    `)
    .eq('sender_role', 'user')
    .eq('is_read', false);
  
  if (error) throw error;
  
  // Group by order_id and count unread messages
  const orderMap = new Map();
  (data || []).forEach((msg: any) => {
    const orderId = msg.order_id;
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        order_id: orderId,
        order_number: msg.orders?.order_number || 'N/A',
        user_name: msg.orders?.profiles?.name || 'Unknown',
        user_email: msg.orders?.profiles?.email || null,
        unread_count: 0,
      });
    }
    orderMap.get(orderId).unread_count++;
  });
  
  return Array.from(orderMap.values());
};

// ==================== Quick Replies ====================

export const getQuickReplies = async () => {
  const { data, error } = await supabase
    .from('quick_replies')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createQuickReply = async (title: string, message: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('quick_replies')
    .insert({
      title: title.trim(),
      message: message.trim(),
      created_by: user.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateQuickReply = async (id: string, title: string, message: string) => {
  const { data, error } = await supabase
    .from('quick_replies')
    .update({
      title: title.trim(),
      message: message.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteQuickReply = async (id: string) => {
  const { error } = await supabase
    .from('quick_replies')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Delete order message
export const deleteOrderMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('order_messages')
    .delete()
    .eq('id', messageId);
  
  if (error) throw error;
};

// Upload chat image to storage
export const uploadChatImage = async (file: File, orderId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${orderId}_${Date.now()}.${fileExt}`;
  const filePath = `chat_images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('app-9cyfgucqbpj5_shottopoth_images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('app-9cyfgucqbpj5_shottopoth_images')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Redeem Codes API
export const getRedeemCodes = async (): Promise<RedeemCode[]> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getAvailableRedeemCodes = async (): Promise<RedeemCode[]> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getUserRedeemCodes = async (userId: string): Promise<RedeemCode[]> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .select('*')
    .eq('purchased_by', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createRedeemCode = async (redeemCode: Omit<RedeemCode, 'id' | 'created_at' | 'updated_at'>): Promise<RedeemCode> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .insert(redeemCode)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateRedeemCode = async (id: string, updates: Partial<RedeemCode>): Promise<RedeemCode> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteRedeemCode = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('redeem_codes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const validateRedeemCode = async (code: string): Promise<RedeemCode | null> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .select('*')
    .eq('code', code)
    .eq('status', 'sold')
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const purchaseRedeemCode = async (codeId: string, userId: string): Promise<RedeemCode> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .update({ 
      status: 'sold', 
      purchased_by: userId,
      updated_at: new Date().toISOString() 
    })
    .eq('id', codeId)
    .eq('status', 'available')
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const redeemCode = async (code: string, orderId: string, userId: string): Promise<RedeemCode> => {
  const { data, error } = await supabase
    .from('redeem_codes')
    .update({ 
      status: 'redeemed', 
      used_in_order: orderId,
      updated_at: new Date().toISOString() 
    })
    .eq('code', code)
    .eq('purchased_by', userId)
    .eq('status', 'sold')
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Product Bundles
export const getProductBundles = async (productId: string): Promise<ProductBundleWithProduct[]> => {
  const { data, error } = await supabase
    .from('product_bundles')
    .select(`
      *,
      related_product:products!product_bundles_related_product_id_fkey(*)
    `)
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return (data || []) as ProductBundleWithProduct[];
};

export const getAllProductBundles = async (): Promise<ProductBundleWithProduct[]> => {
  const { data, error } = await supabase
    .from('product_bundles')
    .select(`
      *,
      related_product:products!product_bundles_related_product_id_fkey(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as ProductBundleWithProduct[];
};

export const createProductBundle = async (bundle: Omit<ProductBundle, 'id' | 'created_at' | 'updated_at'>): Promise<ProductBundle> => {
  const { data, error } = await supabase
    .from('product_bundles')
    .insert(bundle)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProductBundle = async (id: string, updates: Partial<ProductBundle>): Promise<ProductBundle> => {
  const { data, error } = await supabase
    .from('product_bundles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProductBundle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('product_bundles')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Stock Movements
export const getStockMovements = async (productId?: string): Promise<StockMovement[]> => {
  let query = supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (productId) {
    query = query.eq('product_id', productId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createStockMovement = async (movement: {
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  notes?: string;
}): Promise<StockMovement> => {
  // Get current stock
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', movement.product_id)
    .single();
  
  if (productError) throw productError;
  
  const previousStock = product.stock;
  let newStock = previousStock;
  
  if (movement.movement_type === 'in') {
    newStock = previousStock + movement.quantity;
  } else if (movement.movement_type === 'out') {
    newStock = Math.max(0, previousStock - movement.quantity);
  } else {
    newStock = movement.quantity; // adjustment sets absolute value
  }
  
  // Create movement record
  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      ...movement,
      previous_stock: previousStock,
      new_stock: newStock,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update product stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', movement.product_id);
  
  if (updateError) throw updateError;
  
  return data;
};

// Bundle Analytics
export const getBundleAnalytics = async (bundleId?: string): Promise<BundleAnalytics[]> => {
  let query = supabase
    .from('bundle_analytics')
    .select('*');
  
  if (bundleId) {
    query = query.eq('bundle_id', bundleId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const updateBundleAnalytics = async (bundleId: string, updates: Partial<BundleAnalytics>): Promise<void> => {
  const { error } = await supabase
    .from('bundle_analytics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('bundle_id', bundleId);
  
  if (error) throw error;
};

// Suggested Bundles
export const getSuggestedBundles = async (status?: 'pending' | 'approved' | 'rejected'): Promise<SuggestedBundleWithProducts[]> => {
  let query = supabase
    .from('suggested_bundles')
    .select(`
      *,
      product:products!suggested_bundles_product_id_fkey(*),
      related_product:products!suggested_bundles_related_product_id_fkey(*)
    `)
    .order('confidence_score', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SuggestedBundleWithProducts[];
};

export const approveSuggestedBundle = async (suggestionId: string): Promise<void> => {
  // Get suggestion
  const { data: suggestion, error: fetchError } = await supabase
    .from('suggested_bundles')
    .select('*')
    .eq('id', suggestionId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Create actual bundle
  await createProductBundle({
    product_id: suggestion.product_id,
    related_product_id: suggestion.related_product_id,
    bundle_discount_percent: suggestion.suggested_discount_percent,
    display_order: 0,
    is_active: true,
  });
  
  // Update suggestion status
  const { error: updateError } = await supabase
    .from('suggested_bundles')
    .update({
      status: 'approved',
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', suggestionId);
  
  if (updateError) throw updateError;
};

export const rejectSuggestedBundle = async (suggestionId: string): Promise<void> => {
  const { error } = await supabase
    .from('suggested_bundles')
    .update({
      status: 'rejected',
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', suggestionId);
  
  if (error) throw error;
};

// Analyze frequently bought together products
export const analyzeFrequentlyBoughtTogether = async (): Promise<void> => {
  // This would typically be run as a scheduled job
  // For now, we'll create a simple implementation
  
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_items(product_id)')
    .eq('status', 'delivered');
  
  if (ordersError) throw ordersError;
  
  // Count product pairs
  const pairCounts: Record<string, { count: number; products: [string, string] }> = {};
  
  orders?.forEach(order => {
    const productIds = order.order_items?.map((item: any) => item.product_id) || [];
    
    // Generate all pairs
    for (let i = 0; i < productIds.length; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const pair = [productIds[i], productIds[j]].sort().join('-');
        if (!pairCounts[pair]) {
          pairCounts[pair] = { count: 0, products: [productIds[i], productIds[j]] };
        }
        pairCounts[pair].count++;
      }
    }
  });
  
  // Create suggestions for pairs with count >= 3
  const suggestions = Object.values(pairCounts)
    .filter(pair => pair.count >= 3)
    .map(pair => ({
      product_id: pair.products[0],
      related_product_id: pair.products[1],
      co_purchase_count: pair.count,
      confidence_score: Math.min(100, pair.count * 10),
      suggested_discount_percent: 15, // Default 15% discount
      expected_revenue_impact: 0, // Would need more complex calculation
      status: 'pending' as const,
    }));
  
  // Insert suggestions (ignore duplicates)
  if (suggestions.length > 0) {
    await supabase
      .from('suggested_bundles')
      .upsert(suggestions, { onConflict: 'product_id,related_product_id', ignoreDuplicates: true });
  }
};


// ============================================================================
// Wishlist Functions
// ============================================================================

export const addToWishlist = async (productId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('wishlist')
    .insert({ user_id: user.id, product_id: productId });

  if (error && error.code !== '23505') {
    throw error;
  }
};

export const removeFromWishlist = async (productId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);

  if (error) throw error;
};

export const getWishlist = async (): Promise<Wishlist[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id,
      user_id,
      product_id,
      created_at,
      product:product_id(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as Wishlist[];
};

export const isInWishlist = async (productId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

export const getWishlistCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) throw error;
  return count || 0;
};

// ============================================================================
// Recently Viewed Functions
// ============================================================================

const RECENTLY_VIEWED_LIMIT = 10;
const RECENTLY_VIEWED_EXPIRY_DAYS = 30;

export const addToRecentlyViewed = async (productId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { error } = await supabase
      .from('recently_viewed')
      .upsert(
        { user_id: user.id, product_id: productId, viewed_at: new Date().toISOString() },
        { onConflict: 'user_id,product_id' }
      );

    if (error) throw error;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - RECENTLY_VIEWED_EXPIRY_DAYS);
    
    await supabase
      .from('recently_viewed')
      .delete()
      .eq('user_id', user.id)
      .lt('viewed_at', expiryDate.toISOString());
  } else {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const filtered = recentlyViewed.filter((id: string) => id !== productId);
    filtered.unshift(productId);
    const limited = filtered.slice(0, RECENTLY_VIEWED_LIMIT);
    localStorage.setItem('recentlyViewed', JSON.stringify(limited));
  }
};

export const getRecentlyViewed = async (): Promise<RecentlyViewed[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data, error } = await supabase
      .from('recently_viewed')
      .select(`
        id,
        user_id,
        product_id,
        viewed_at,
        product:product_id(*)
      `)
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(RECENTLY_VIEWED_LIMIT);

    if (error) throw error;
    
    return (data || []).filter((item: any) => 
      item.product && item.product.stock > 0 && item.product.is_active
    ) as unknown as RecentlyViewed[];
  } else {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    if (recentlyViewed.length === 0) return [];
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', recentlyViewed)
      .eq('is_active', true)
      .gt('stock', 0);

    if (error) throw error;
    
    const sorted = recentlyViewed
      .map((id: string) => data?.find(p => p.id === id))
      .filter((p: any) => p !== undefined);
    
    return sorted.map((product: any) => ({
      id: product.id,
      product_id: product.id,
      viewed_at: new Date().toISOString(),
      product,
    }));
  }
};

export const clearRecentlyViewed = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { error } = await supabase
      .from('recently_viewed')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  } else {
    localStorage.removeItem('recentlyViewed');
  }
};

// App Downloads APIs
export const getAppDownloads = async (): Promise<AppDownload[]> => {
  const { data, error } = await supabase
    .from('app_downloads')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getAllAppDownloads = async (): Promise<AppDownload[]> => {
  const { data, error } = await supabase
    .from('app_downloads')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createAppDownload = async (download: Omit<AppDownload, 'id' | 'created_at' | 'updated_at'>): Promise<AppDownload> => {
  const { data, error } = await supabase
    .from('app_downloads')
    .insert(download)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateAppDownload = async (id: string, updates: Partial<AppDownload>): Promise<AppDownload> => {
  const { data, error } = await supabase
    .from('app_downloads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteAppDownload = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('app_downloads')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const uploadAppFile = async (
  file: File, 
  platform: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${platform}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Set appropriate content type
  let contentType = file.type;
  if (!contentType || contentType === 'application/octet-stream') {
    if (fileExt === 'apk') {
      contentType = 'application/vnd.android.package-archive';
    } else if (fileExt === 'exe') {
      contentType = 'application/x-msdownload';
    }
  }

  // For files larger than 50MB, we need to use chunked upload
  // Supabase free tier has a 50MB limit per file
  const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
  
  if (file.size > CHUNK_SIZE) {
    // Chunked upload for large files
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const chunkPath = `${uploadId}/chunk-${chunkIndex}`;
      
      const { error: chunkError } = await supabase.storage
        .from('app-files')
        .upload(chunkPath, chunk, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/octet-stream'
        });
      
      if (chunkError) {
        console.error(`Failed to upload chunk ${chunkIndex}:`, chunkError);
        // Clean up uploaded chunks
        for (let i = 0; i < chunkIndex; i++) {
          await supabase.storage
            .from('app-files')
            .remove([`${uploadId}/chunk-${i}`]);
        }
        throw new Error(`Upload failed at chunk ${chunkIndex + 1}/${totalChunks}: ${chunkError.message}`);
      }
      
      // Report progress
      if (onProgress) {
        const progress = ((chunkIndex + 1) / totalChunks) * 100;
        onProgress(Math.round(progress));
      }
    }
    
    // After all chunks are uploaded, create a metadata file
    const metadata = {
      originalName: file.name,
      totalChunks,
      uploadId,
      contentType,
      size: file.size,
      platform,
      fileName
    };
    
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    
    const { error: metadataError } = await supabase.storage
      .from('app-files')
      .upload(`${uploadId}/metadata.json`, metadataBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/json'
      });
    
    if (metadataError) {
      console.error('Failed to upload metadata:', metadataError);
      console.error('Metadata path:', `${uploadId}/metadata.json`);
      console.error('Metadata content:', metadata);
      // Clean up uploaded chunks
      for (let i = 0; i < totalChunks; i++) {
        await supabase.storage
          .from('app-files')
          .remove([`${uploadId}/chunk-${i}`]);
      }
      throw new Error(`Failed to save upload metadata: ${metadataError.message}`);
    }
    
    // Return a special URL that indicates this is a chunked upload
    // The download will need to reconstruct the file from chunks
    const { data } = supabase.storage
      .from('app-files')
      .getPublicUrl(`${uploadId}/metadata.json`);
    
    return data.publicUrl;
  } else {
    // Direct upload for smaller files
    const { error: uploadError } = await supabase.storage
      .from('app-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      
      // Provide more helpful error messages
      if (uploadError.message.includes('exceeded the maximum allowed size')) {
        throw new Error('File size exceeds Supabase plan limit. Please upgrade your Supabase plan or use a smaller file.');
      }
      
      throw new Error(uploadError.message || 'Upload failed');
    }

    if (onProgress) {
      onProgress(100);
    }

    const { data } = supabase.storage
      .from('app-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

// App Download Analytics APIs
export const trackPageView = async (data: Omit<AppDownloadPageView, 'id' | 'viewed_at'>): Promise<void> => {
  const { error } = await supabase
    .from('app_download_page_views')
    .insert(data);
  
  if (error) throw error;
};

export const trackDownload = async (data: Omit<AppDownloadAnalytics, 'id' | 'downloaded_at'>): Promise<void> => {
  const { error } = await supabase
    .from('app_download_analytics')
    .insert(data);
  
  if (error) throw error;
};

export const getDownloadStats = async (): Promise<DownloadStats[]> => {
  const { data, error } = await supabase
    .from('app_download_stats')
    .select('*')
    .order('total_downloads', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getDownloadHistory = async (limit = 100, offset = 0): Promise<AppDownloadAnalytics[]> => {
  const { data, error } = await supabase
    .from('app_download_analytics')
    .select('*')
    .order('downloaded_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getGeographicDistribution = async (): Promise<{ country: string; count: number }[]> => {
  const { data, error } = await supabase
    .from('app_download_analytics')
    .select('country')
    .not('country', 'is', null);
  
  if (error) throw error;
  
  const countryMap = new Map<string, number>();
  data?.forEach((item: { country: string }) => {
    const count = countryMap.get(item.country) || 0;
    countryMap.set(item.country, count + 1);
  });
  
  return Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
};

export const getDeviceStats = async (): Promise<{
  byDeviceType: { device_type: string; count: number }[];
  byOS: { os_name: string; count: number }[];
  byBrowser: { browser_name: string; count: number }[];
}> => {
  const { data, error } = await supabase
    .from('app_download_analytics')
    .select('device_type, os_name, browser_name');
  
  if (error) throw error;
  
  const deviceTypeMap = new Map<string, number>();
  const osMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  
  data?.forEach((item: { device_type: string | null; os_name: string | null; browser_name: string | null }) => {
    if (item.device_type) {
      const count = deviceTypeMap.get(item.device_type) || 0;
      deviceTypeMap.set(item.device_type, count + 1);
    }
    if (item.os_name) {
      const count = osMap.get(item.os_name) || 0;
      osMap.set(item.os_name, count + 1);
    }
    if (item.browser_name) {
      const count = browserMap.get(item.browser_name) || 0;
      browserMap.set(item.browser_name, count + 1);
    }
  });
  
  return {
    byDeviceType: Array.from(deviceTypeMap.entries())
      .map(([device_type, count]) => ({ device_type, count }))
      .sort((a, b) => b.count - a.count),
    byOS: Array.from(osMap.entries())
      .map(([os_name, count]) => ({ os_name, count }))
      .sort((a, b) => b.count - a.count),
    byBrowser: Array.from(browserMap.entries())
      .map(([browser_name, count]) => ({ browser_name, count }))
      .sort((a, b) => b.count - a.count),
  };
};

export const getConversionRate = async (): Promise<{ views: number; downloads: number; rate: number }> => {
  const { count: viewsCount } = await supabase
    .from('app_download_page_views')
    .select('*', { count: 'exact', head: true });
  
  const { count: downloadsCount } = await supabase
    .from('app_download_analytics')
    .select('*', { count: 'exact', head: true });
  
  const views = viewsCount || 0;
  const downloads = downloadsCount || 0;
  const rate = views > 0 ? (downloads / views) * 100 : 0;
  
  return { views, downloads, rate };
};

export const getPopularTimes = async (): Promise<{ hour: number; count: number }[]> => {
  const { data, error } = await supabase
    .from('app_download_analytics')
    .select('downloaded_at');
  
  if (error) throw error;
  
  const hourMap = new Map<number, number>();
  
  data?.forEach((item: { downloaded_at: string }) => {
    const hour = new Date(item.downloaded_at).getHours();
    const count = hourMap.get(hour) || 0;
    hourMap.set(hour, count + 1);
  });
  
  return Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
};

export const getReferrerStats = async (): Promise<{ referrer: string; count: number }[]> => {
  const { data, error } = await supabase
    .from('app_download_analytics')
    .select('referrer_url')
    .not('referrer_url', 'is', null);
  
  if (error) throw error;
  
  const referrerMap = new Map<string, number>();
  data?.forEach((item: { referrer_url: string }) => {
    const count = referrerMap.get(item.referrer_url) || 0;
    referrerMap.set(item.referrer_url, count + 1);
  });
  
  return Array.from(referrerMap.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

export const refreshDownloadStats = async (): Promise<void> => {
  const { error } = await supabase.rpc('refresh_download_stats');
  if (error) throw error;
};

// Review Helpful Voting APIs
export const voteReviewHelpful = async (
  reviewId: string,
  isHelpful: boolean
): Promise<ReviewHelpfulVote> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('review_helpful_votes')
    .select('*')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingVote) {
    // Check if vote can be updated (within 24 hours)
    const createdAt = new Date(existingVote.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      throw new Error('Vote can only be changed within 24 hours');
    }

    // Update existing vote
    const { data, error } = await supabase
      .from('review_helpful_votes')
      .update({ is_helpful: isHelpful })
      .eq('id', existingVote.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new vote
  const { data, error } = await supabase
    .from('review_helpful_votes')
    .insert({
      review_id: reviewId,
      user_id: user.id,
      is_helpful: isHelpful
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserReviewVote = async (reviewId: string): Promise<ReviewHelpfulVote | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('review_helpful_votes')
    .select('*')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getReviewVoteStats = async (reviewId: string): Promise<{
  helpfulCount: number;
  notHelpfulCount: number;
  percentage: number;
}> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('helpful_count, not_helpful_count')
    .eq('id', reviewId)
    .single();

  if (error) throw error;

  const total = data.helpful_count + data.not_helpful_count;
  const percentage = total > 0 ? Math.round((data.helpful_count / total) * 100) : 0;

  return {
    helpfulCount: data.helpful_count,
    notHelpfulCount: data.not_helpful_count,
    percentage
  };
};

export const detectSuspiciousVoting = async (userId: string): Promise<boolean> => {
  // Check if user voted on more than 50 reviews in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('review_helpful_votes')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);

  if (error) throw error;

  return (data?.length || 0) > 50;
};
