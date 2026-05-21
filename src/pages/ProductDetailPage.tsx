import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WishlistButton } from '@/components/WishlistButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductOptionsDialog } from '@/components/ProductOptionsDialog';
import { ProductUserManualDialog } from '@/components/ProductUserManualDialog';
import { ImageZoomDialog } from '@/components/ImageZoomDialog';
import PageMeta from '@/components/common/PageMeta';
import { getProductBySlug, getProductReviews, getProducts, addToRecentlyViewed, voteReviewHelpful, getUserReviewVote } from '@/db/api';
import type { Product, ReviewWithUser } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PinchZoomImage } from '@/components/PinchZoomImage';
import { ShoppingCart, Package, Star, ChevronDown, FileText, ZoomIn, ArrowLeft, Eye, Share2, Copy, Facebook, Twitter, Mail, MessageCircle, Check, MessageSquare, ThumbsUp, ThumbsDown, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { createNotification } from '@/db/api';
import { useDeviceType, getDeviceImages, getDeviceThumbnail } from '@/hooks/useDeviceType';
import { maskUsername } from '@/lib/utils';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const { appSettings } = useAppSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [moreProducts, setMoreProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'cart' | 'buyNow'>('cart');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showReviewImageZoom, setShowReviewImageZoom] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewImageIndex, setReviewImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [votingReviewId, setVotingReviewId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Detect device type for device-specific images with transition state
  const { deviceType, isTransitioning } = useDeviceType();

  // Get device-specific images based on current device
  const displayImages = useMemo(() => {
    if (!product) return [];
    return getDeviceImages(
      deviceType,
      product.pc_images,
      product.mobile_images
    );
  }, [product, deviceType]);

  // Helper function to get display image for any product
  const getProductDisplayImage = (prod: Product): string => {
    const deviceImages = getDeviceImages(
      deviceType,
      prod.pc_images,
      prod.mobile_images
    );
    
    // Priority: device-specific thumbnail > regular thumbnail > first device image > image_url
    const thumbnail = getDeviceThumbnail(
      deviceType,
      prod.pc_thumbnail,
      prod.mobile_thumbnail,
      prod.thumbnail
    );
    
    return thumbnail || 
           (deviceImages && deviceImages.length > 0 ? deviceImages[0] : '') ||
           prod.image_url || 
           '';
  };

  useEffect(() => {
    // Reset state and scroll to top when slug changes
    setLoading(true);
    setProduct(null);
    setReviews([]);
    setMoreProducts([]);
    setSelectedImageIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const fetchData = async () => {
      if (!slug) return;

      try {
        const productData = await getProductBySlug(slug);
        
        if (!productData) {
          toast.error('Product not found');
          navigate('/products');
          return;
        }

        const [reviewsData, allProducts] = await Promise.all([
          getProductReviews(productData.id),
          getProducts(8),
        ]);

        setProduct(productData);
        setReviews(reviewsData);
        
        // Add to recently viewed
        addToRecentlyViewed(productData.id).catch(err => 
          console.error('Failed to add to recently viewed:', err)
        );
        
        // Filter out current product and get 4 random products
        const otherProducts = allProducts.filter(p => p.id !== productData.id);
        const shuffled = otherProducts.sort(() => 0.5 - Math.random());
        setMoreProducts(shuffled.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Failed to load product');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, navigate]);

  // Load user votes for reviews
  useEffect(() => {
    const loadUserVotes = async () => {
      if (!user || reviews.length === 0) return;

      const votes: Record<string, boolean> = {};
      await Promise.all(
        reviews.map(async (review) => {
          try {
            const vote = await getUserReviewVote(review.id);
            if (vote) {
              votes[review.id] = vote.is_helpful;
            }
          } catch (error) {
            console.error('Failed to load vote for review:', review.id, error);
          }
        })
      );
      setUserVotes(votes);
    };

    loadUserVotes();
  }, [reviews, user]);

  const handleVoteReview = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    if (profile?.role === 'banned') {
      toast.error('Banned users cannot vote on reviews');
      return;
    }

    setVotingReviewId(reviewId);

    try {
      await voteReviewHelpful(reviewId, isHelpful);
      
      // Update local state
      setUserVotes(prev => ({ ...prev, [reviewId]: isHelpful }));
      
      // Update review counts locally
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const hadVote = userVotes[reviewId] !== undefined;
            const wasHelpful = userVotes[reviewId];
            
            let newHelpfulCount = review.helpful_count;
            let newNotHelpfulCount = review.not_helpful_count;
            
            if (hadVote) {
              // Changing vote
              if (wasHelpful && !isHelpful) {
                newHelpfulCount--;
                newNotHelpfulCount++;
              } else if (!wasHelpful && isHelpful) {
                newHelpfulCount++;
                newNotHelpfulCount--;
              }
            } else {
              // New vote
              if (isHelpful) {
                newHelpfulCount++;
              } else {
                newNotHelpfulCount++;
              }
            }
            
            return {
              ...review,
              helpful_count: newHelpfulCount,
              not_helpful_count: newNotHelpfulCount
            };
          }
          return review;
        })
      );
      
      toast.success('Thank you for your feedback!');
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(error.message || 'Failed to submit vote');
    } finally {
      setVotingReviewId(null);
    }
  };

  const addToCart = async () => {
    if (!product) return;

    // Check if user is banned
    if (user && profile?.role === 'banned') {
      toast.error('Your account has been banned. You cannot make purchases.');
      
      // Send notification to user
      await createNotification({
        user_id: user.id,
        title: 'Purchase Attempt Blocked',
        message: 'Your account has been banned and you cannot make purchases. Please contact support for assistance.',
        type: 'system',
        order_id: null,
        read: false,
      }).catch(console.error);
      
      return;
    }

    // Check if manual exists and show dialog
    if (product.user_manual) {
      setActionType('cart');
      setShowManualDialog(true);
      return;
    }

    // Always show options dialog (for variants or just quantity)
    setActionType('cart');
    setDialogOpen(true);
  };

  const buyNow = async () => {
    if (!product) return;
    
    // Check force_sign_in setting
    const forceSignIn = appSettings?.force_sign_in ?? true; // Default to true if not loaded
    
    if (forceSignIn && !user) {
      toast.error('Please sign in to purchase products');
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }

    // Check if user is banned
    if (user && profile?.role === 'banned') {
      toast.error('Your account has been banned. You cannot make purchases.');
      
      // Send notification to user
      await createNotification({
        user_id: user.id,
        title: 'Purchase Attempt Blocked',
        message: 'Your account has been banned and you cannot make purchases. Please contact support for assistance.',
        type: 'system',
        order_id: null,
        read: false,
      }).catch(console.error);
      
      return;
    }
    
    // Check if manual exists and show dialog
    if (product.user_manual) {
      setActionType('buyNow');
      setShowManualDialog(true);
      return;
    }

    // Always show options dialog (for variants or just quantity)
    setActionType('buyNow');
    setDialogOpen(true);
  };

  const handleAcceptManual = () => {
    setShowManualDialog(false);
    
    // Continue with the action that triggered the manual - always show options dialog
    setDialogOpen(true);
  };

  const addToCartAfterManual = () => {
    if (!product) return;

    // Always show options dialog (for variants or just quantity)
    setActionType('cart');
    setDialogOpen(true);
  };

  const buyNowAfterManual = () => {
    if (!product) return;

    // Always show options dialog (for variants or just quantity)
    setActionType('buyNow');
    setDialogOpen(true);
  };

  const handleOptionsConfirm = (options: { 
    color?: string; 
    size?: string; 
    quantity: number;
    bundleItems?: Array<{ product: Product; quantity: number }>;
  }) => {
    if (!product) return;

    if (actionType === 'cart') {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Add main product
      const existingItemIndex = cart.findIndex(
        (item: { product: Product; selectedColor?: string; selectedSize?: string }) =>
          item.product.id === product.id &&
          item.selectedColor === options.color &&
          item.selectedSize === options.size
      );

      if (existingItemIndex >= 0) {
        const newQuantity = cart[existingItemIndex].quantity + options.quantity;
        // Check if new quantity exceeds stock
        if (newQuantity > product.stock) {
          toast.error(`Cannot add more items. Maximum available: ${product.stock}`);
          return;
        }
        cart[existingItemIndex].quantity = newQuantity;
      } else {
        // Check if quantity exceeds stock
        if (options.quantity > product.stock) {
          toast.error(`Cannot add more items. Maximum available: ${product.stock}`);
          return;
        }
        cart.push({
          product,
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
      // Buy Now - include bundle items
      const buyNowData: any = {
        product,
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

  // Share functions
  const getProductUrl = () => {
    return `${window.location.origin}/products/${product?.slug || product?.id}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getProductUrl());
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} - ৳${product.price}`,
          url: getProductUrl(),
        });
        toast.success('Shared successfully!');
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    }
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getProductUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(getProductUrl());
    const text = encodeURIComponent(`Check out ${product?.name} - ৳${product?.price}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(getProductUrl());
    const text = encodeURIComponent(`Check out ${product?.name} - ৳${product?.price}\n${getProductUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Check out ${product?.name}`);
    const body = encodeURIComponent(`I found this product and thought you might be interested:\n\n${product?.name}\nPrice: ৳${product?.price}\n\n${getProductUrl()}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };


  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full bg-muted" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-muted" />
              <Skeleton className="h-6 w-1/2 bg-muted" />
              <Skeleton className="h-24 w-full bg-muted" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {product && <PageMeta product={product} title={product.name} />}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 animate-in fade-in duration-500">
        {/* Mobile Back Button */}
        <div className="mb-3 md:mb-4 md:hidden animate-in slide-in-from-left duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
          <div className="space-y-3 md:space-y-4 animate-in slide-in-from-left duration-700">
            {/* Main Image/Video Display */}
            <div 
              className="bg-muted rounded-lg md:rounded-xl overflow-hidden flex items-center justify-center border border-border/50 relative group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 aspect-square md:aspect-auto md:h-96 lg:h-[500px]"
              onClick={() => !isTransitioning && setShowImageZoom(true)}
            >
              {isTransitioning ? (
                /* Loading skeleton during device transition */
                (<div className="w-full h-full animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
                      <p className="text-sm text-muted-foreground animate-pulse">Loading {deviceType} images...</p>
                    </div>
                  </div>
                </div>)
              ) : displayImages && displayImages.length > 0 ? (
                <>
                  <PinchZoomImage
                    src={displayImages[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-110 protected-image animate-in fade-in duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
                  
                  {/* Zoom icon with animation */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
                      <div className="bg-primary/90 backdrop-blur-md rounded-full p-3 md:p-5 shadow-2xl ring-2 md:ring-4 ring-primary/20">
                        <ZoomIn className="h-6 w-6 md:h-10 md:w-10 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </>
              ) : product.image_url ? (
                <>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-110 protected-image"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  
                  {/* Zoom icon with animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
                      <div className="bg-primary/90 backdrop-blur-md rounded-full p-3 md:p-5 shadow-2xl ring-2 md:ring-4 ring-primary/20">
                        <ZoomIn className="h-6 w-6 md:h-10 md:w-10 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {displayImages && displayImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-1.5 md:gap-2">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative rounded-md md:rounded-lg overflow-hidden border-2 transition-all duration-300 bg-muted flex items-center justify-center h-14 sm:h-16 md:h-20 hover:scale-105 hover:shadow-lg ${
                      selectedImageIndex === index
                        ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover object-center transition-transform duration-300 protected-image"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable="false"
                    />
                    {selectedImageIndex === index && (
                      <div className="absolute inset-0 bg-primary/10 rounded-lg" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Videos Section */}
            {product.videos && product.videos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm md:text-base font-semibold">Product Videos</h3>
                <div className="space-y-3 md:space-y-4">
                  {product.videos.map((videoUrl, index) => (
                    <div key={index} className="rounded-lg overflow-hidden bg-muted">
                      {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                        <iframe
                          src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                          className="w-full h-48 sm:h-56 md:h-64"
                          allowFullScreen
                          title={`Product video ${index + 1}`}
                        />
                      ) : videoUrl.includes('vimeo.com') ? (
                        <iframe
                          src={videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                          className="w-full h-48 sm:h-56 md:h-64"
                          allowFullScreen
                          title={`Product video ${index + 1}`}
                        />
                      ) : (
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-48 sm:h-56 md:h-64"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 md:space-y-6 animate-in slide-in-from-right duration-700">
            <div>
              <div className="flex items-start gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold flex-1">{product.name}</h1>
                {product.is_gift_card && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-semibold hover:scale-105 transition-transform duration-300 cursor-pointer shrink-0">
                          <Gift className="h-4 w-4 md:h-5 md:w-5" />
                          <span>Gift Card</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a digital gift card product</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                {reviews.length > 0 && (
                  <>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(averageRating)
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {averageRating.toFixed(1)} ({reviews.length} reviews)
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="text-3xl md:text-4xl font-bold text-primary">৳{product.price}</span>
              {product.min_quantity && product.min_quantity > 1 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Minimum order: {product.min_quantity} items
                </p>
              )}
            </div>

            {/* Description and Manual Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Description */}
              <div>
                <h3 className="text-sm md:text-base font-semibold mb-2">Description</h3>
                <div className="text-sm md:text-base text-muted-foreground">
                  {product.description ? (
                    <>
                      <p className="whitespace-pre-wrap">
                        {product.description.length <= 200
                          ? product.description
                          : `${product.description.substring(0, 200)}...`}
                      </p>
                      {product.description.length > 200 && (
                        <Button
                          variant="link"
                          className="p-0 h-auto mt-2 text-primary"
                          onClick={() => setShowDescriptionDialog(true)}
                        >
                          Show More <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <p>No description available</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm md:text-base font-semibold mb-2">Availability</h3>
              {product.stock > 0 && product.stock >= (product.min_quantity || 1) ? (
                <Badge variant="secondary" className="bg-success/10 text-success text-xs md:text-sm">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs md:text-sm">Out of Stock</Badge>
              )}
            </div>

            <div className="space-y-2 md:space-y-3">
              <Button
                size="lg"
                className="w-full text-sm md:text-base h-10 md:h-11"
                onClick={buyNow}
                disabled={product.stock === 0 || product.stock < (product.min_quantity || 1)}
              >
                Buy Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full text-sm md:text-base h-10 md:h-11"
                onClick={addToCart}
                disabled={product.stock === 0 || product.stock < (product.min_quantity || 1)}
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Add to Cart
              </Button>
              
              {/* Wishlist Button */}
              <WishlistButton 
                productId={product.id}
                size="lg"
                variant="outline"
                className="w-full text-sm md:text-base h-10 md:h-11"
              />
              
              {/* Share Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full hover-scale transition-all duration-300 text-sm md:text-base h-10 md:h-11"
                  >
                    <Share2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Share Product
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 animate-in fade-in slide-in-from-top-2 duration-200">
                  <DropdownMenuLabel className="text-center">Share this product</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Native Share (Mobile) */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <>
                      <DropdownMenuItem
                        onClick={handleNativeShare}
                        className="cursor-pointer hover:bg-accent transition-colors"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share via...
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Copy Link */}
                  <DropdownMenuItem
                    onClick={handleCopyLink}
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-success" />
                        <span className="text-success">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Social Media Options */}
                  <DropdownMenuItem
                    onClick={handleShareFacebook}
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                    Share on Facebook
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={handleShareTwitter}
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                    Share on Twitter
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={handleShareWhatsApp}
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                    Share on WhatsApp
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={handleShareEmail}
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-2 text-orange-600" />
                    Share via Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <Separator className="my-6 md:my-8" />

        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-2xl md:text-3xl font-bold">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 md:h-5 md:w-5 ${
                        i < Math.round(averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-base md:text-lg font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-xs md:text-sm text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            )}
          </div>
          
          {reviews.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="pt-6 md:pt-8 pb-6 md:pb-8 text-center">
                <div className="flex flex-col items-center gap-2 md:gap-3">
                  <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                  <p className="text-base md:text-lg font-medium">No reviews yet</p>
                  <p className="text-sm md:text-base text-muted-foreground">Be the first to review this product!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                {reviews.slice(0, 3).map((review, index) => (
                  <Card 
                    key={review.id}
                    className="animate-in fade-in slide-in-from-left hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/30"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-2 md:gap-3 w-full sm:w-auto">
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-base md:text-lg flex-shrink-0">
                            {review.is_anonymous 
                              ? (maskUsername(review.user?.username || 'Anonymous')[0])
                              : (review.user?.username || 'A')[0].toUpperCase()
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base md:text-lg truncate">
                              {review.is_anonymous 
                                ? maskUsername(review.user?.username || 'Anonymous')
                                : (review.user?.username || 'Anonymous')
                              }
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 md:h-4 md:w-4 ${
                                      i < review.rating
                                        ? 'fill-warning text-warning'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>

                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(review.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-foreground leading-relaxed mb-4 pl-15">{review.comment}</p>
                      )}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-3 flex-wrap pl-15 mb-4">
                          {review.images.map((img, idx) => (
                            <div 
                              key={idx}
                              className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300"
                              onClick={() => {
                                setReviewImages(review.images || []);
                                setReviewImageIndex(idx);
                                setShowReviewImageZoom(true);
                              }}
                            >
                              <img
                                src={img}
                                alt={`Review ${idx + 1}`}
                                className="h-24 w-24 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Helpful Voting */}
                      <div className="mt-4 pl-15 flex items-center gap-4 border-t pt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userVotes[review.id] === true ? "default" : "outline"}
                            className="gap-2"
                            onClick={() => handleVoteReview(review.id, true)}
                            disabled={votingReviewId === review.id || !user || profile?.role === 'banned'}
                          >
                            <ThumbsUp className={`h-4 w-4 ${votingReviewId === review.id ? 'animate-pulse' : ''}`} />
                            <span>{review.helpful_count}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant={userVotes[review.id] === false ? "default" : "outline"}
                            className="gap-2"
                            onClick={() => handleVoteReview(review.id, false)}
                            disabled={votingReviewId === review.id || !user || profile?.role === 'banned'}
                          >
                            <ThumbsDown className={`h-4 w-4 ${votingReviewId === review.id ? 'animate-pulse' : ''}`} />
                          </Button>
                        </div>
                        {(review.helpful_count + review.not_helpful_count) > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {Math.round((review.helpful_count / (review.helpful_count + review.not_helpful_count)) * 100)}% found this helpful
                          </span>
                        )}
                        {review.helpful_count >= 5 && (
                          <Badge variant="secondary" className="ml-auto">
                            Most Helpful
                          </Badge>
                        )}
                      </div>

                      {/* Admin Responses */}
                      {review.responses && review.responses.length > 0 && (
                        <div className="mt-4 pl-15 space-y-3 border-t pt-4">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <MessageSquare className="h-4 w-4" />
                            <span>Responses ({review.responses.length})</span>
                          </div>
                          {review.responses.map((response) => (
                            <div key={response.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {response.is_admin ? 'Admin' : (response.user?.username || 'Unknown')}
                                </span>
                                {response.is_admin && (
                                  <Badge variant="default" className="text-xs">Admin</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(response.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm">{response.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {reviews.length > 3 && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/products/${slug}/reviews`)}
                    className="min-w-[200px] hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    View All Reviews ({reviews.length}) <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <Separator className="my-12" />

        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                You May Also Like
              </h2>
              <p className="text-sm text-muted-foreground">Discover more amazing products</p>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate('/products')}
              className="hidden md:flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
            >
              View All Products
              <ChevronDown className="h-4 w-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-2">
                  <Skeleton className="aspect-square w-full bg-muted" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-full bg-muted" />
                    <Skeleton className="h-4 w-3/4 bg-muted" />
                    <Skeleton className="h-6 w-1/2 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : moreProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {moreProducts.map((prod, index) => (
                  <Card
                    key={`${prod.id}-${index}`}
                    className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-3 animate-in fade-in slide-in-from-bottom hover:border-primary/30 bg-card p-0"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      navigate(`/products/${prod.slug || prod.id}`);
                    }}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30">
                      {isTransitioning ? (
                        /* Loading skeleton during device transition */
                        (<div className="w-full h-full animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent" />
                        </div>)
                      ) : getProductDisplayImage(prod) ? (
                        <>
                          <img
                            src={getProductDisplayImage(prod)}
                            alt={prod.name}
                            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-2 animate-in fade-in duration-500"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                              }
                            }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <Package className="h-12 w-12 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
                        </div>
                      )}
                      {prod.stock !== undefined && (prod.stock <= 0 || prod.stock < (prod.min_quantity || 1)) && (
                        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                          Out of Stock
                        </div>
                      )}
                      {prod.stock !== undefined && prod.stock > 0 && prod.stock >= (prod.min_quantity || 1) && prod.stock <= 5 && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
                          Low Stock
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[2.5rem] leading-tight">
                        {prod.name}
                      </h3>
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex flex-col">
                          <p className="text-xl md:text-2xl font-bold text-primary group-hover:scale-105 transition-transform duration-300 origin-left">
                            ৳{prod.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground group-hover:text-primary transition-colors duration-300">
                          <span className="font-medium">View Details</span>
                          <ChevronDown className="h-3 w-3 rotate-[-90deg] group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/30 rounded-lg transition-all duration-500 pointer-events-none" />
                  </Card>
                ))}
              </div>
              <div className="mt-8 text-center md:hidden">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/products')}
                  className="w-full max-w-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  View All Products
                  <ChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No more products available at the moment</p>
            </div>
          )}
        </div>
      </div>
      {/* Product Options Dialog */}
      {product && (
        <ProductOptionsDialog
          product={product}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleOptionsConfirm}
          actionType={actionType}
        />
      )}
      {/* Product User Manual Dialog */}
      {product && product.user_manual && (
        <ProductUserManualDialog
          product={product}
          open={showManualDialog}
          onAccept={handleAcceptManual}
          onCancel={() => setShowManualDialog(false)}
        />
      )}
      {/* Description Dialog */}
      {product && (
        <Dialog open={showDescriptionDialog} onOpenChange={setShowDescriptionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">Product Description</DialogTitle>
              <DialogDescription>
                {product.name}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                {product.description}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      {/* Image Zoom Dialog */}
      {product && (displayImages?.length > 0 || product.image_url) && (
        <ImageZoomDialog
          images={displayImages?.length > 0 ? displayImages : product.image_url ? [product.image_url] : []}
          currentIndex={selectedImageIndex}
          open={showImageZoom}
          onClose={() => setShowImageZoom(false)}
          onNavigate={(index) => setSelectedImageIndex(index)}
        />
      )}
      {/* Review Image Zoom Dialog */}
      {reviewImages.length > 0 && (
        <ImageZoomDialog
          images={reviewImages}
          currentIndex={reviewImageIndex}
          open={showReviewImageZoom}
          onClose={() => {
            setShowReviewImageZoom(false);
            setReviewImages([]);
            setReviewImageIndex(0);
          }}
          onNavigate={(index) => setReviewImageIndex(index)}
        />
      )}
    </MainLayout>
  );
}
