import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { addToWishlist, removeFromWishlist, getWishlist, getWishlistCount } from '@/db/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WishlistContextType {
  wishlistItems: string[]; // Array of product IDs
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      setWishlistCount(0);
      return;
    }

    try {
      setLoading(true);
      const items = await getWishlist();
      const productIds = items.map(item => item.product_id);
      setWishlistItems(productIds);
      setWishlistCount(productIds.length);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.includes(productId);
  };

  const toggleWishlist = async (productId: string): Promise<void> => {
    if (!user) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }

    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        setWishlistItems(prev => prev.filter(id => id !== productId));
        setWishlistCount(prev => prev - 1);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(productId);
        setWishlistItems(prev => [...prev, productId]);
        setWishlistCount(prev => prev + 1);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const refreshWishlist = async () => {
    await loadWishlist();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        isInWishlist,
        toggleWishlist,
        refreshWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
