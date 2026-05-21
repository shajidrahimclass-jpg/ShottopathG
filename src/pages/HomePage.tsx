import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { DownloadPromoBanner } from '@/components/DownloadPromoBanner';
import { DatabaseSetupWarning } from '@/components/DatabaseSetupWarning';
import { getProducts, getActiveBanners } from '@/db/api';
import type { Product, Banner } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShoppingCart, Package, TrendingUp, Shield, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceType, getDeviceImages, getDeviceThumbnail } from '@/hooks/useDeviceType';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/animated-container';
import PageMeta from '@/components/common/PageMeta';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { PullToRefresh } from '@/components/PullToRefresh';
import { ProductOptionsDialog } from '@/components/ProductOptionsDialog';
import { ProductUserManualDialog } from '@/components/ProductUserManualDialog';
import { toast } from 'sonner';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDatabaseWarning, setShowDatabaseWarning] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deviceType, isTransitioning } = useDeviceType();
  const { appSettings } = useAppSettings();

  // Helper function to get display image for a product
  const getProductDisplayImage = (product: Product): string => {
    const deviceImages = getDeviceImages(
      deviceType,
      product.pc_images,
      product.mobile_images
    );
    
    // Priority: device-specific thumbnail > regular thumbnail > first device image > image_url
    const thumbnail = getDeviceThumbnail(
      deviceType,
      product.pc_thumbnail,
      product.mobile_thumbnail,
      product.thumbnail
    );
    
    return thumbnail ||
           (deviceImages && deviceImages.length > 0 ? deviceImages[0] : '') ||
           product.image_url || 
           '';
  };

  useEffect(() => {
    // Redirect logged-in users to products catalog
    if (user) {
      navigate('/products');
      return;
    }

    fetchData();

    // Listen for stock updates
    const handleStockUpdate = () => {
      fetchData();
    };

    window.addEventListener('stockUpdated', handleStockUpdate);

    return () => {
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [productsData, bannersData] = await Promise.all([
        getProducts(6),
        getActiveBanners('home'),
      ]);
      
      // Sort products: in-stock first, then out-of-stock
      // A product is out of stock if stock is 0 OR stock is less than minimum quantity
      const inStockProducts = productsData.filter(p => p.stock > 0 && p.stock >= (p.min_quantity || 1));
      const outOfStockProducts = productsData.filter(p => p.stock === 0 || p.stock < (p.min_quantity || 1));
      const sortedProducts = [...inStockProducts, ...outOfStockProducts];
      
      setProducts(sortedProducts);
      setBanners(bannersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setShowDatabaseWarning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  // Auto-rotate banners every 3 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const addToCart = (product: Product) => {
    setSelectedProduct(product);
    
    // Check if manual exists and show dialog first
    if (product.user_manual) {
      setShowManualDialog(true);
      return;
    }
    
    // Otherwise show options dialog directly
    setDialogOpen(true);
  };

  const handleAcceptManual = () => {
    setShowManualDialog(false);
    // After accepting manual, show options dialog
    setDialogOpen(true);
  };

  const handleOptionsConfirm = (options: { 
    color?: string; 
    size?: string; 
    quantity: number;
    bundleItems?: Array<{ product: Product; quantity: number }>;
  }) => {
    if (!selectedProduct) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Add main product
    const existingItemIndex = cart.findIndex(
      (item: { product: Product; selectedColor?: string; selectedSize?: string }) =>
        item.product.id === selectedProduct.id &&
        item.selectedColor === options.color &&
        item.selectedSize === options.size
    );

    if (existingItemIndex >= 0) {
      const newQuantity = cart[existingItemIndex].quantity + options.quantity;
      // Check if new quantity exceeds stock
      if (newQuantity > selectedProduct.stock) {
        toast.error(`Cannot add more items. Maximum available: ${selectedProduct.stock}`);
        return;
      }
      cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Check if quantity exceeds stock
      if (options.quantity > selectedProduct.stock) {
        toast.error(`Cannot add more items. Maximum available: ${selectedProduct.stock}`);
        return;
      }
      cart.push({
        product: selectedProduct,
        quantity: options.quantity,
        selectedColor: options.color,
        selectedSize: options.size,
      });
    }

    // Add bundle items
    if (options.bundleItems && options.bundleItems.length > 0) {
      for (const bundleItem of options.bundleItems) {
        const existingBundleIndex = cart.findIndex(
          (item: { product: Product }) => item.product.id === bundleItem.product.id
        );
        
        if (existingBundleIndex >= 0) {
          const newQuantity = cart[existingBundleIndex].quantity + bundleItem.quantity;
          // Check if new quantity exceeds stock
          if (newQuantity > bundleItem.product.stock) {
            toast.error(`Cannot add ${bundleItem.product.name}. Maximum available: ${bundleItem.product.stock}`);
            return;
          }
          cart[existingBundleIndex].quantity = newQuantity;
        } else {
          // Check if quantity exceeds stock
          if (bundleItem.quantity > bundleItem.product.stock) {
            toast.error(`Cannot add ${bundleItem.product.name}. Maximum available: ${bundleItem.product.stock}`);
            return;
          }
          cart.push({
            product: bundleItem.product,
            quantity: bundleItem.quantity,
          });
        }
      }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    
    const totalItems = options.quantity + (options.bundleItems?.reduce((sum, item) => sum + item.quantity, 0) || 0);
    toast.success(`Added ${totalItems} item(s) to cart`);
    navigate('/cart');
  };

  return (
    <MainLayout>
      <PageMeta 
        title={appSettings?.site_title || 'Shottopoth - Your Trusted E-Commerce Platform'}
        description={appSettings?.site_description || 'Shop the best products at Shottopoth. Quality products, great prices, and excellent customer service.'}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Dynamic Banner Carousel */}
        {banners.length > 0 ? (
          <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-muted">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {banner.link ? (
                <a href={banner.link} className="block w-full h-full">
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover object-center protected-image"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                </a>
              ) : (
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover protected-image"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
              )}
              {banner.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                  <div className="container mx-auto">
                    <h2 className="text-2xl md:text-4xl font-bold text-white">{banner.title}</h2>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Previous banner"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Next banner"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentBannerIndex
                      ? 'bg-white w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="relative bg-gradient-primary text-white py-20 md:py-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {"Welcome to Shottopath"}
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl mb-8 text-white/90"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Discover amazing products at great prices. Shop now and enjoy fast delivery across Bangladesh.
              </motion.p>
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button size="lg" variant="secondary" onClick={() => navigate('/products')} className="hover-scale">
                  Browse Products
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}
      <section className="py-16 animate-fade-in-up">
        <div className="container mx-auto px-4">
          {/* Database Setup Warning */}
          <DatabaseSetupWarning 
            show={showDatabaseWarning && products.length === 0} 
            context="general"
          />
          
          {/* Download Promo Banner */}
          <div className="mb-12">
            <DownloadPromoBanner />
          </div>

          <motion.div 
            className="flex justify-between items-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-muted-foreground">Check out our latest and most popular items</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/products')}>
              View All
            </Button>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <Skeleton className="aspect-square w-full bg-muted" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <StaggerItem key={product.id}>
                  <Card className="group overflow-hidden hover-lift transition-smooth bg-[transparent00] bg-none p-0 h-full">
                    <div
                      className="relative aspect-square w-full bg-white cursor-pointer overflow-hidden flex items-center justify-center rounded-t-xl"
                      onClick={() => navigate(`/products/${product.slug || product.id}`)}
                    >
                      {isTransitioning ? (
                        /* Loading skeleton during device transition */
                        <div className="w-full h-full animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto" />
                            <p className="text-xs text-muted-foreground">Loading...</p>
                          </div>
                        </div>
                      ) : getProductDisplayImage(product) ? (
                        <>
                          <motion.img
                            src={getProductDisplayImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover object-center protected-image"
                            onContextMenu={(e) => e.preventDefault()}
                            draggable="false"
                            whileHover={{ scale: 1.1, rotate: 2 }}
                            transition={{ duration: 0.4 }}
                          />
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                          
                          {/* Gift Card Badge */}
                          {product.is_gift_card && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg flex items-center gap-1 md:gap-1.5 text-xs md:text-sm font-semibold z-10 hover:scale-110 transition-transform duration-300">
                                    <Gift className="h-3 w-3 md:h-4 md:w-4" />
                                    <span>Gift Card</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This is a digital gift card product</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/50">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                    <h3
                      className="font-semibold mb-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/products/${product.slug || product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">৳{product.price}</span>
                      <Button size="sm" onClick={() => addToCart(product)} className="hover-scale">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Recently Viewed Section */}
      <section className="container mx-auto px-4 py-12">
        <RecentlyViewed />
      </section>
      </PullToRefresh>

      {/* Product Options Dialog */}
      {selectedProduct && (
        <ProductOptionsDialog
          product={selectedProduct}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleOptionsConfirm}
          actionType="cart"
        />
      )}
      {/* Product User Manual Dialog */}
      {selectedProduct && selectedProduct.user_manual && (
        <ProductUserManualDialog
          product={selectedProduct}
          open={showManualDialog}
          onAccept={handleAcceptManual}
          onCancel={() => setShowManualDialog(false)}
        />
      )}
    </MainLayout>
  );
}
