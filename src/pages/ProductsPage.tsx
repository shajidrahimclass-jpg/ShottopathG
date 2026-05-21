import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WishlistButton } from '@/components/WishlistButton';
import { ProductOptionsDialog } from '@/components/ProductOptionsDialog';
import { ProductUserManualDialog } from '@/components/ProductUserManualDialog';
import { CategoryDialog } from '@/components/CategoryDialog';
import { DatabaseSetupWarning } from '@/components/DatabaseSetupWarning';
import { getProducts, getCategories, getActiveBanners } from '@/db/api';
import type { Product, Category, Banner } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShoppingCart, Package, Search, Star, Eye, ChevronLeft, ChevronRight, MoreHorizontal, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceType, getDeviceImages, getDeviceThumbnail } from '@/hooks/useDeviceType';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/animated-container';
import PageMeta from '@/components/common/PageMeta';
import { PullToRefresh } from '@/components/PullToRefresh';

export default function ProductsPage() {
  const { user } = useAuth();
  const { deviceType, isTransitioning } = useDeviceType();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatabaseWarning, setShowDatabaseWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<'cart' | 'buyNow'>('cart');
  const [showManualDialog, setShowManualDialog] = useState(false);
  const navigate = useNavigate();

  // Maximum number of categories to show initially
  const MAX_VISIBLE_CATEGORIES = 6;

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

  const fetchData = async () => {
    try {
      const [productsData, categoriesData, bannersData] = await Promise.all([
        getProducts(),
        getCategories(),
        getActiveBanners('products'),
      ]);
      
      // Sort products: in-stock first (shuffled), then out-of-stock (shuffled)
      // A product is out of stock if stock is 0 OR stock is less than minimum quantity
      const inStockProducts = productsData.filter(p => p.stock > 0 && p.stock >= (p.min_quantity || 1));
      const outOfStockProducts = productsData.filter(p => p.stock === 0 || p.stock < (p.min_quantity || 1));
      
      const shuffledInStock = [...inStockProducts].sort(() => 0.5 - Math.random());
      const shuffledOutOfStock = [...outOfStockProducts].sort(() => 0.5 - Math.random());
      
      const sortedProducts = [...shuffledInStock, ...shuffledOutOfStock];
      
      setProducts(sortedProducts);
      setCategories(categoriesData);
      setBanners(bannersData);
      setFilteredProducts(sortedProducts);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setShowDatabaseWarning(true);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for stock updates
    const handleStockUpdate = () => {
      fetchData();
    };

    window.addEventListener('stockUpdated', handleStockUpdate);

    return () => {
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, []);

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

  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  const addToCart = (product: Product) => {
    setSelectedProduct(product);
    setActionType('cart');
    
    // Check if manual exists and show dialog first
    if (product.user_manual) {
      setShowManualDialog(true);
      return;
    }
    
    // Otherwise show options dialog directly
    setDialogOpen(true);
  };

  const buyNow = (product: Product) => {
    setSelectedProduct(product);
    setActionType('buyNow');
    
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

    if (actionType === 'cart') {
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
    } else {
      // Buy Now
      const buyNowData: any = {
        product: selectedProduct,
        quantity: options.quantity,
        selectedColor: options.color,
        selectedSize: options.size,
      };
      
      if (options.bundleItems && options.bundleItems.length > 0) {
        buyNowData.bundleItems = options.bundleItems;
      }
      
      localStorage.setItem('buyNowProduct', JSON.stringify(buyNowData));
      navigate('/checkout?buyNow=true');
    }
  };

  return (
    <MainLayout>
      <PageMeta 
        title="Products - Browse Our Collection"
        description="Explore our wide range of quality products. Find the perfect items for your needs with great prices and fast delivery."
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container mx-auto px-4 py-6 md:py-8 animate-in fade-in duration-500">
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] rounded-xl overflow-hidden mb-8 md:mb-10 shadow-lg">
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
                      className="w-full h-full object-cover"
                    />
                  </a>
                ) : (
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                )}
                {banner.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h2 className="text-white text-2xl md:text-3xl font-bold">
                      {banner.title}
                    </h2>
                  </div>
                )}
              </div>
            ))}

            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevBanner}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-foreground rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-foreground rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
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
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentBannerIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Database Setup Warning */}
        <DatabaseSetupWarning 
          show={showDatabaseWarning && products.length === 0} 
          context="products"
        />

        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 animate-in slide-in-from-top duration-500 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Product Categories
          </h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-border/50 transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 animate-in slide-in-from-left duration-700">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
              onClick={() => setSelectedCategory('all')}
            >
              All Products
            </Badge>
            {categories.slice(0, MAX_VISIBLE_CATEGORIES).map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </Badge>
            ))}
            {categories.length > MAX_VISIBLE_CATEGORIES && (
              <Badge
                variant="outline"
                className="cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center gap-1"
                onClick={() => setCategoryDialogOpen(true)}
              >
                <MoreHorizontal className="h-4 w-4" />
                Show More
              </Badge>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <Skeleton className="h-56 w-full bg-muted" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-20 bg-muted" />
                  <Skeleton className="h-6 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                  <Skeleton className="h-10 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="inline-block p-6 bg-muted/50 rounded-full mb-6">
              <Package className="h-20 w-20 text-muted-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">No products found</h2>
            <p className="text-muted-foreground text-lg mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} variant="outline">
              Clear Filters
            </Button>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product, index) => (
              <StaggerItem key={product.id}>
                <Card 
                  className="group overflow-hidden hover-lift transition-smooth hover:border-primary/50 bg-card backdrop-blur-sm p-0 gap-0 relative h-full"
                >
                  {/* Discount Badge */}
                  {product.price && product.price > 0 && (
                    <div className="absolute top-3 left-3 z-10">

                    </div>
                  )}

                  {/* NEW Badge */}
                  {index < 3 && (
                    <motion.div 
                      className="absolute top-3 right-3 z-10"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >

                    </motion.div>
                  )}

                  <div
                    className="relative aspect-square w-full cursor-pointer overflow-hidden bg-gradient-to-br from-muted to-muted/50 rounded-t-lg"
                    onClick={() => navigate(`/products/${product.slug || product.id}`)}
                  >
                  {isTransitioning ? (
                    /* Loading skeleton during device transition */
                    (<div className="w-full h-full animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent mx-auto" />
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      </div>
                    </div>)
                  ) : getProductDisplayImage(product) ? (
                    <>
                      <img
                        src={getProductDisplayImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-110 protected-image animate-in fade-in duration-500"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable="false"
                        loading="lazy"
                      />
                      
                      {/* Enhanced gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      
                      {/* Bottom info bar on hover */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-white text-sm font-medium line-clamp-1">{product.name}</p>
                        <p className="text-white/80 text-xs">Click to view details</p>
                      </div>
                      
                      {/* Eye icon with enhanced animation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-0 group-hover:scale-100">
                          <div className="bg-primary/95 backdrop-blur-md rounded-full p-4 shadow-2xl ring-4 ring-primary/30 hover:ring-primary/50 transition-all">
                            <Eye className="h-6 w-6 text-primary-foreground" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      
                      {/* Corner accent */}
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-primary/20 border-l-[40px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted via-muted to-muted/80">
                      <Package className="h-16 w-16 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground/50">No image available</p>
                    </div>
                  )}
                  
                  {/* Stock badge - moved inside image container */}
                  {product.stock > 0 && product.stock >= (product.min_quantity || 1) && product.stock <= 5 && (
                    <div className="absolute bottom-3 right-3 z-10">
                      <Badge className="bg-orange-500 text-white shadow-lg font-semibold text-xs animate-pulse">
                        Low Stock
                      </Badge>
                    </div>
                  )}
                  {(product.stock === 0 || product.stock < (product.min_quantity || 1)) && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="shadow-lg">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <div className="absolute top-3 left-3 z-10">
                    <WishlistButton 
                      productId={product.id}
                      className="bg-white/90 hover:bg-white shadow-lg"
                    />
                  </div>
                </div>
                
                <CardContent className="p-4 space-y-3">
                  {product.category && (
                    <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                      {product.category}
                    </Badge>
                  )}
                  
                  <div>
                    <h3
                      className="font-bold text-lg mb-1.5 cursor-pointer hover:text-primary transition-colors duration-200 line-clamp-2 group-hover:text-primary leading-tight"
                      onClick={() => navigate(`/products/${product.slug || product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {product.description || 'No description available'}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">4.5</span>

                  </div>

                  <div className="pt-2 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">৳{product.price}</span>

                    </div>
                    
                    {product.stock > 0 && product.stock >= (product.min_quantity || 1) && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                          In Stock
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => addToCart(product)}
                        variant="outline"
                        className="flex-1 h-9 font-medium transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        disabled={product.stock === 0 || product.stock < (product.min_quantity || 1)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1.5" />
                        Add
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => buyNow(product)}
                        className="flex-1 h-9 font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-primary"
                        disabled={product.stock === 0 || product.stock < (product.min_quantity || 1)}
                      >
                        {(product.stock === 0 || product.stock < (product.min_quantity || 1)) ? 'Out of Stock' : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
      {/* Product Options Dialog */}
      {selectedProduct && (
        <ProductOptionsDialog
          product={selectedProduct}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleOptionsConfirm}
          actionType={actionType}
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
      {/* Category Dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      </PullToRefresh>
    </MainLayout>
  );
}
