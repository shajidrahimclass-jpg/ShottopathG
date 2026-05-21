import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Home, Package, LogOut, Shield, Moon, Sun, Inbox, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { getUserNotifications } from '@/db/api';
import { supabase } from '@/db/supabase';
import { adminPath } from '@/config/admin';
import { UserManualDialog } from '@/components/UserManualDialog';
import type { UserManual } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { wishlistCount } = useWishlist();
  const { appSettings } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userManual, setUserManual] = useState<UserManual | null>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      const items = JSON.parse(cart);
      const count = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
      setCartCount(count);
    }
  }, [location]);

  // Check for active user manual
  useEffect(() => {
    const checkUserManual = async () => {
      if (!user) return;

      try {
        // Get active user manual
        const { data: manuals } = await (supabase
          .from('user_manual')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any);

        if (!manuals) return;

        // Check if user has already accepted this manual
        const { data: acceptance } = await (supabase
          .from('user_manual_acceptances')
          .select('id')
          .eq('user_id', user.id)
          .eq('user_manual_id', manuals.id)
          .maybeSingle() as any);

        if (!acceptance) {
          setUserManual(manuals);
          setShowManual(true);
        }
      } catch (error) {
        console.error('Error checking user manual:', error);
      }
    };

    checkUserManual();
  }, [user]);

  const handleAcceptManual = async () => {
    if (!user || !userManual) return;

    try {
      const insertData: any = {
        user_id: user.id,
        user_manual_id: userManual.id,
      };

      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase.from('user_manual_acceptances').insert([insertData]);

      if (error) {
        console.error('Error accepting user manual:', error);
        return;
      }

      setShowManual(false);
    } catch (error) {
      console.error('Error accepting user manual:', error);
    }
  };

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const notifications = await getUserNotifications(user.id);
        const unreadCount = notifications.filter(n => !n.read).length;
        setUnreadNotifications(unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time notification updates
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    // Reset navigation state when location changes
    setIsNavigating(false);
  }, [location]);

  const handleNavigation = (path: string) => {
    if (isNavigating || location.pathname === path) return;
    setIsNavigating(true);
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to={user ? "/products" : "/"} className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {appSettings?.navbar_name || 'Shottopoth'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {!user && (
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors duration-200">
                Home
              </Link>
            )}
            <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors duration-200">
              Products
            </Link>
            {user && (
              <>
                <Link to="/inbox" className="text-sm font-medium hover:text-primary transition-colors duration-200 flex items-center gap-1">
                  <div className="relative">
                    <Inbox className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Badge>
                    )}
                  </div>
                  Inbox
                </Link>
                <Link to="/orders" className="text-sm font-medium hover:text-primary transition-colors duration-200">
                  Order
                </Link>
                <Link to="/profile" className="text-sm font-medium hover:text-primary transition-colors duration-200">
                  Profile
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                to={adminPath()}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-200 flex items-center gap-1 border border-primary/30 rounded-md px-3 py-1 hover:bg-primary/10"
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="bg-[#ffffff00] bg-none">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {/* Desktop: Cart Button | Mobile: Orders Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleNavigation(window.innerWidth >= 768 ? '/cart' : '/orders')} 
              className="relative bg-[#ffffff00] bg-none"
            >
              <ShoppingCart className="h-5 w-5 hidden md:block" />
              <Package className="h-5 w-5 md:hidden" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs md:flex hidden">
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* Wishlist Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleNavigation('/wishlist')} 
              className="relative bg-[#ffffff00] bg-none"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {wishlistCount}
                </Badge>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {profile?.username || 'User'}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/orders')}>
                    Order
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => handleNavigation(adminPath())}>
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => handleNavigation('/login')}>Sign In</Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className={`grid ${isAdmin ? 'grid-cols-5' : user ? 'grid-cols-4' : 'grid-cols-4'} h-16`}>
          {!user && (
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full rounded-none transition-all duration-200 hover:bg-accent"
              onClick={() => handleNavigation('/')}
              disabled={isNavigating}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center h-full rounded-none transition-all duration-200 hover:bg-accent"
            onClick={() => handleNavigation('/products')}
            disabled={isNavigating}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs mt-1">Products</span>
          </Button>
          {user && (
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full rounded-none relative transition-all duration-200 hover:bg-accent"
              onClick={() => handleNavigation('/inbox')}
              disabled={isNavigating}
            >
              <Inbox className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute top-2 right-6 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground animate-pulse">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Badge>
              )}
              <span className="text-xs mt-1">Inbox</span>
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center h-full rounded-none relative transition-all duration-200 hover:bg-accent"
            onClick={() => handleNavigation('/cart')}
            disabled={isNavigating}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge className="absolute top-2 right-6 h-4 w-4 flex items-center justify-center p-0 text-xs animate-pulse">
                {cartCount}
              </Badge>
            )}
            <span className="text-xs mt-1">Cart</span>
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full rounded-none transition-all duration-200 hover:bg-accent text-primary"
              onClick={() => handleNavigation(adminPath())}
              disabled={isNavigating}
            >
              <Shield className="h-5 w-5" />
              <span className="text-xs mt-1">Admin</span>
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center h-full rounded-none transition-all duration-200 hover:bg-accent"
            onClick={() => handleNavigation(user ? '/profile' : '/login')}
            disabled={isNavigating}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">{user ? 'Profile' : 'Login'}</span>
          </Button>
        </div>
      </nav>
      <footer className="border-t bg-muted/50 py-6 mb-16 md:mb-0">
        <div className="container text-center text-sm text-muted-foreground">
          © {appSettings?.copyright_year?.trim() || new Date().getFullYear()} {appSettings?.copyright_company?.trim() || appSettings?.navbar_name || 'Shottopoth'}. All rights reserved.
        </div>
      </footer>

      {/* Global User Manual Dialog */}
      {userManual && (
        <UserManualDialog
          manual={userManual}
          open={showManual}
          onAccept={handleAcceptManual}
        />
      )}
    </div>
  );
}
