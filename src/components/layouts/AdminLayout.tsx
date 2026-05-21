import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, LayoutDashboard, ShoppingBag, Tag, Users, Settings, LogOut, Megaphone, Image, Menu, Star, FolderTree, FileText, Zap, Database, Code, Globe, Shield, Gift, TrendingUp, Search, X, Clock, Download, BarChart3, Mail, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { AdminKeyboardShortcuts } from '@/components/admin/AdminKeyboardShortcuts';
import { adminPath } from '@/config/admin';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { path: adminPath(), label: 'Dashboard', icon: LayoutDashboard, keywords: ['home', 'overview', 'main'] },
  { path: adminPath('products'), label: 'Products', icon: Package, keywords: ['items', 'catalog', 'inventory'] },
  { path: adminPath('categories'), label: 'Categories', icon: FolderTree, keywords: ['groups', 'types', 'classification'] },
  { path: adminPath('bundles'), label: 'Product Bundles', icon: Gift, keywords: ['packages', 'deals', 'combo'] },
  { path: adminPath('stock'), label: 'Stock Management', icon: TrendingUp, keywords: ['inventory', 'quantity', 'warehouse'] },
  { path: adminPath('orders'), label: 'Orders', icon: ShoppingBag, keywords: ['purchases', 'sales', 'transactions'] },
  { path: adminPath('vouchers'), label: 'Vouchers', icon: Tag, keywords: ['coupons', 'discounts', 'promo'] },
  { path: adminPath('users'), label: 'Users', icon: Users, keywords: ['customers', 'accounts', 'members'] },
  { path: adminPath('reviews'), label: 'Reviews', icon: Star, keywords: ['ratings', 'feedback', 'comments'] },
  { path: adminPath('send-gift-card'), label: 'Send Gift Card', icon: Mail, keywords: ['gift', 'code', 'email', 'send'] },
  { path: adminPath('template-management'), label: 'Gift Card Templates', icon: Palette, keywords: ['email', 'design', 'templates', 'gift'] },
  { path: adminPath('quick-replies'), label: 'Quick Replies', icon: Zap, keywords: ['templates', 'responses', 'messages'] },
  { path: adminPath('announcements'), label: 'Announcements', icon: Megaphone, keywords: ['news', 'alerts', 'notifications'] },
  { path: adminPath('banners'), label: 'Banners', icon: Image, keywords: ['slides', 'carousel', 'images'] },
  { path: adminPath('app-downloads'), label: 'App Downloads', icon: Download, keywords: ['mobile', 'apk', 'exe', 'install'] },
  { path: adminPath('download-analytics'), label: 'Download Analytics', icon: BarChart3, keywords: ['stats', 'metrics', 'reports', 'tracking'] },
  { path: adminPath('invoice-editor'), label: 'Invoice Editor', icon: FileText, keywords: ['billing', 'receipts', 'documents'] },
  { path: adminPath('database'), label: 'Database', icon: Database, keywords: ['data', 'sql', 'tables'] },
  { path: adminPath('source-code'), label: 'Source Code', icon: Code, keywords: ['files', 'code', 'development'] },
  { path: adminPath('oauth-status'), label: 'OAuth Status', icon: Shield, keywords: ['authentication', 'login', 'security'] },
  { path: adminPath('seo'), label: 'SEO & Meta Tags', icon: Globe, keywords: ['search', 'optimization', 'meta'] },
  { path: adminPath('settings'), label: 'Settings', icon: Settings, keywords: ['config', 'preferences', 'options'] },
];

// Fuzzy search function
const fuzzySearch = (query: string, text: string, keywords: string[] = []): boolean => {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();
  
  // Check if query is in text
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // Check if query is in keywords
  if (keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery))) return true;
  
  // Simple fuzzy matching - check if all characters in query appear in order
  let queryIndex = 0;
  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === normalizedQuery.length;
};

// Highlight matching text
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  
  const normalizedQuery = query.toLowerCase();
  const index = text.toLowerCase().indexOf(normalizedQuery);
  
  if (index === -1) return <>{text}</>;
  
  return (
    <>
      {text.substring(0, index)}
      <span className="bg-primary/20 text-primary font-semibold">
        {text.substring(index, index + query.length)}
      </span>
      {text.substring(index + query.length)}
    </>
  );
};

// Recently accessed items management
const RECENT_ITEMS_KEY = 'admin_recent_menu_items';
const MAX_RECENT_ITEMS = 5;

const getRecentItems = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentItem = (path: string) => {
  try {
    const recent = getRecentItems();
    const filtered = recent.filter(p => p !== path);
    const updated = [path, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { appSettings } = useAppSettings();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset navigation state when location changes
    setIsNavigating(false);
  }, [location]);

  useEffect(() => {
    // Load recent items
    setRecentItems(getRecentItems());
  }, []);

  useEffect(() => {
    // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isMobileMenuOpen && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, searchQuery]);

  const handleNavigation = (path: string) => {
    if (isNavigating || location.pathname === path) return;
    setIsNavigating(true);
    addRecentItem(path);
    setRecentItems(getRecentItems());
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Filter menu items based on search query
  const filteredItems = searchQuery.trim()
    ? adminNavItems.filter(item => 
        fuzzySearch(searchQuery, item.label, item.keywords)
      )
    : adminNavItems;

  // Get recent menu items
  const recentMenuItems = searchQuery.trim()
    ? []
    : adminNavItems.filter(item => recentItems.includes(item.path));

  return (
    <div className="min-h-screen flex">
      <AdminKeyboardShortcuts />
      <aside className="hidden lg:block w-64 border-r bg-sidebar shrink-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">Shottopath</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  disabled={isNavigating || isActive}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground',
                    (isNavigating || isActive) && 'cursor-default'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-background p-4 lg:hidden flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center space-x-2 min-w-0 flex-1">
            <Package className="h-6 w-6 text-primary shrink-0" />
            <span className="text-xl font-bold truncate">{appSettings?.navbar_name || 'Shottopoth'} Admin</span>
          </Link>
          
          <div className="flex items-center gap-2 shrink-0">
            <AdminNotificationBell />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label="Open menu"
                  className="h-11 w-11 md:h-10 md:w-10"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-background flex flex-col p-4">
                <SheetHeader className="shrink-0 pb-3">
                  <SheetTitle className="text-base">Admin Menu</SheetTitle>
                </SheetHeader>
                
                {/* Search Input */}
                <div className="relative mb-3 shrink-0">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search menu... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-8 h-9 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <nav className="flex flex-col space-y-1 overflow-y-auto flex-1 min-h-0 pr-1">
                  {/* Recently Accessed Items */}
                  {recentMenuItems.length > 0 && (
                    <>
                      <div className="flex items-center gap-1 px-3 py-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Recent</span>
                      </div>
                      {recentMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={`recent-${item.path}`}
                            onClick={() => {
                              handleNavigation(item.path);
                              setIsMobileMenuOpen(false);
                            }}
                            disabled={isNavigating}
                            className={cn(
                              'flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-left text-sm',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-accent text-muted-foreground hover:text-foreground',
                              isNavigating && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm">
                              <HighlightText text={item.label} query={searchQuery} />
                            </span>
                          </button>
                        );
                      })}
                      <div className="h-px bg-border my-2" />
                    </>
                  )}

                  {/* All Menu Items (filtered) */}
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      const isRecent = recentItems.includes(item.path);
                      
                      // Skip if already shown in recent
                      if (!searchQuery && isRecent) return null;
                      
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            handleNavigation(item.path);
                            setIsMobileMenuOpen(false);
                          }}
                          disabled={isNavigating}
                          className={cn(
                            'flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-left text-sm',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent text-muted-foreground hover:text-foreground',
                            isNavigating && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm">
                            <HighlightText text={item.label} query={searchQuery} />
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </nav>
                
                <div className="pt-3 border-t shrink-0 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start text-sm h-9" 
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex border-b bg-background p-4 items-center justify-end">
          <AdminNotificationBell />
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 lg:pb-6 min-w-0">{children}</main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
          <div className="grid grid-cols-4 h-16">
            {adminNavItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    'flex flex-col items-center justify-center h-full rounded-none',
                    isActive && 'text-primary'
                  )}
                  onClick={() => handleNavigation(item.path)}
                  disabled={isNavigating}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
