import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
}

export function WishlistButton({ 
  productId, 
  className, 
  size = 'icon',
  variant = 'ghost'
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, loading } = useWishlist();
  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'transition-all duration-300',
        inWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart 
        className={cn(
          'h-5 w-5 transition-all duration-300',
          inWishlist && 'fill-current'
        )} 
      />
    </Button>
  );
}
