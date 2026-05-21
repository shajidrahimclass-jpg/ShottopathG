import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentlyViewed, clearRecentlyViewed } from '@/db/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, X } from 'lucide-react';
import { useDeviceType, getDeviceThumbnail } from '@/hooks/useDeviceType';
import type { Product, RecentlyViewed as RecentlyViewedType } from '@/types';

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { deviceType } = useDeviceType();

  const loadRecentlyViewed = async () => {
    try {
      setLoading(true);
      const data = await getRecentlyViewed();
      setItems(data);
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const handleClear = async () => {
    try {
      await clearRecentlyViewed();
      setItems([]);
    } catch (error) {
      console.error('Failed to clear recently viewed:', error);
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Recently Viewed
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[200px] h-[280px] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Recently Viewed
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;

          return (
            <Card
              key={item.id}
              className="min-w-[200px] cursor-pointer hover:shadow-lg transition-all duration-300 group"
              onClick={() => navigate(`/products/${product.slug || product.id}`)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
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
                  {product.stock <= 5 && product.stock > 0 && (
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      Low Stock
                    </Badge>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-primary">
                    ৳{product.price.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
