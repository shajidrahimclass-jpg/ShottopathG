import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/db/api';
import type { Notification } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, Package, Bell, CheckCheck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InboxPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/inbox' } });
      return;
    }

    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const data = await getUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'chat' && notification.order_id) {
      navigate(`/chat?orderId=${notification.order_id}`);
    } else if (notification.type === 'order' && notification.order_id) {
      // Navigate to orders page - user can find their order there
      navigate('/orders');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string, title: string) => {
    // Check for chat notifications
    if (type === 'chat') {
      return <MessageCircle className="h-5 w-5 text-purple-500" />;
    }
    
    // Check for order status notifications
    if (type === 'order') {
      if (title.includes('Confirmed')) {
        return <Package className="h-5 w-5 text-blue-500" />;
      } else if (title.includes('On The Way')) {
        return <Package className="h-5 w-5 text-cyan-500" />;
      } else if (title.includes('Delivered')) {
        return <Package className="h-5 w-5 text-green-500" />;
      }
      return <Package className="h-5 w-5 text-primary" />;
    }
    
    switch (type) {
      case 'welcome':
        return <Bell className="h-5 w-5 text-success" />;
      case 'announcement':
        return <Bell className="h-5 w-5 text-info" />;
      default:
        return <Inbox className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string, title: string) => {
    // Check for chat notifications
    if (type === 'chat') {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    
    // Check for order status notifications
    if (type === 'order') {
      if (title.includes('Confirmed')) {
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      } else if (title.includes('On The Way')) {
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      } else if (title.includes('Delivered')) {
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      }
      return 'bg-primary/10 text-primary';
    }
    
    switch (type) {
      case 'welcome':
        return 'bg-success/10 text-success';
      case 'announcement':
        return 'bg-info/10 text-info';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCardBorderColor = (type: string, title: string, read: boolean) => {
    if (read) return '';
    
    // Check for chat notifications
    if (type === 'chat') {
      return 'border-purple-500/50 bg-purple-500/5';
    }
    
    // Check for order status notifications
    if (type === 'order') {
      if (title.includes('Confirmed')) {
        return 'border-blue-500/50 bg-blue-500/5';
      } else if (title.includes('On The Way')) {
        return 'border-cyan-500/50 bg-cyan-500/5';
      } else if (title.includes('Delivered')) {
        return 'border-green-500/50 bg-green-500/5';
      }
    }
    
    return 'border-primary/50 bg-primary/5';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 md:py-8 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 animate-in slide-in-from-top duration-500 flex items-center gap-2 flex-wrap">
                Inbox
                {unreadCount > 0 && (
                  <Badge className="text-sm bg-destructive text-destructive-foreground animate-pulse">
                    {unreadCount} new
                  </Badge>
                )}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Stay updated with your orders and announcements
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3 bg-muted" />
                        <Skeleton className="h-4 w-full bg-muted" />
                        <Skeleton className="h-3 w-1/4 bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold mb-2">No notifications yet</h2>
                <p className="text-sm md:text-base text-muted-foreground text-center max-w-md">
                  You'll see updates about your orders and announcements here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {notifications.map((notification, index) => (
                <Card
                  key={notification.id}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom cursor-pointer border-2 ${
                    !notification.read ? getCardBorderColor(notification.type, notification.title, notification.read) : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex gap-3 md:gap-4">
                      <div className="shrink-0">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type, notification.title)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base md:text-lg">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-1.5 md:gap-2 shrink-0 flex-wrap justify-end">
                            {!notification.read && (
                              <Badge variant="default" className="text-xs bg-destructive text-destructive-foreground">
                                New
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${getNotificationColor(notification.type, notification.title)}`}
                            >
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground mb-2 md:mb-3 break-words">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          {(notification.type === 'chat' || notification.type === 'order') && notification.order_id && (
                            <Badge variant="secondary" className="text-xs">
                              Click to view
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
