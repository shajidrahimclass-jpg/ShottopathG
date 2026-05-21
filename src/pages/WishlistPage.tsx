import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '@/db/api';
import { useWishlist } from '@/contexts/WishlistContext';
import { useDeviceType, getDeviceThumbnail } from '@/hooks/useDeviceType';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { refreshWishlist } = useWishlist();
  const { deviceType } = useDeviceType();

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setItems(data);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      setItems(prev => prev.filter(item => item.product_id !== productId));
      refreshWishlist();
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleMoveToCart = async (product: Product) => {
    try {
      // Navigate to product page where user can add to cart
      navigate(`/products/${product.slug || product.id}`);
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  };

  const getProductImage = (product: Product): string => {
    const thumbnail = getDeviceThumbnail(
      deviceType,
      product.pc_thumbnail,
      product.mobile_thumbnail,
      product.thumbnail
    );
    return thumbnail || product.image_url || '';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <Heart className="h-24 w-24 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold">Your Wishlist is Empty</h1>
            <p className="text-muted-foreground">
              Save your favorite products to your wishlist and shop them later!
            </p>
            <Button onClick={() => navigate('/products')} size="lg">
              Browse Products
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 fill-current text-red-500" />
            My Wishlist
            <Badge variant="secondary" className="text-lg">
              {items.length}
            </Badge>
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const isOutOfStock = product.stock === 0 || product.stock < (product.min_quantity || 1);

            return (
              <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div
                    className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted cursor-pointer"
                    onClick={() => navigate(`/products/${product.slug || product.id}`)}
                  >
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    {isOutOfStock && (
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        Out of Stock
                      </Badge>
                    )}
                    {!isOutOfStock && product.stock <= 5 && (
                      <Badge className="absolute top-2 left-2 bg-orange-500">
                        Low Stock
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(product.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <h3
                      className="font-semibold text-base line-clamp-2 min-h-[3rem] cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/products/${product.slug || product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-2xl font-bold text-primary">
                      ৳{product.price.toFixed(2)}
                    </p>

                    <div className="mt-auto space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => handleMoveToCart(product)}
                        disabled={isOutOfStock}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/products/${product.slug || product.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
