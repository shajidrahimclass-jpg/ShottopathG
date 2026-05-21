import { useEffect, useState } from 'react';
import PageMeta from '@/components/common/PageMeta';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReviewDialog } from '@/components/ReviewDialog';
import { ProductUserManualDialog } from '@/components/ProductUserManualDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, cancelOrder } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { OrderWithItems, OrderItem, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ChevronRight, MessageCircle, XCircle, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function OrdersPage() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string>('');
  const [cancelling, setCancelling] = useState(false);
  const [selectedManualProduct, setSelectedManualProduct] = useState<Product | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await getOrders(user.id);
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const handleWriteReview = (orderId: string, orderItem: OrderItem) => {
    setSelectedOrderId(orderId);
    setSelectedOrderItem(orderItem);
    setReviewDialogOpen(true);
  };

  const handleOpenChat = (orderId: string, orderNumber: string) => {
    navigate(`/chat?orderId=${orderId}`);
  };

  const handleReviewSubmitted = () => {
    setReviewDialogOpen(false);
    setSelectedOrderId('');
    setSelectedOrderItem(null);
  };

  const handleViewManual = async (productId: string) => {
    try {
      const { data: product } = await (supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle() as any);

      if (product && product.user_manual) {
        setSelectedManualProduct(product);
        setShowManualDialog(true);
      } else {
        toast.info('No user manual available for this product');
      }
    } catch (error) {
      console.error('Error fetching product manual:', error);
      toast.error('Failed to load product manual');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setCancelling(true);
      await cancelOrder(orderToCancel, 'Cancelled by customer');
      toast.success('Order cancelled successfully');
      
      // Refresh orders list
      if (user) {
        const data = await getOrders(user.id);
        setOrders(data);
      }
      
      setCancelDialogOpen(false);
      setOrderToCancel('');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder = (status: string, paymentMethod: string) => {
    // Can only cancel pending orders
    if (status !== 'pending') {
      return false;
    }
    // Cannot cancel orders paid with bKash or Nagad (online payments)
    if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
      return false;
    }
    return true;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'confirmed':
        return 'bg-info/10 text-info';
      case 'on_the_way':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'delivered':
        return 'bg-success/10 text-success';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageMeta 
        title="My Orders - Order History"
        description="View and track your orders. Check order status, delivery information, and order history."
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status === 'on_the_way' 
                        ? 'On The Way' 
                        : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ৳{item.product_price}
                          </p>
                          {(item.selected_color || item.selected_size) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selected_color && (
                                <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                  Color: {item.selected_color}
                                </span>
                              )}
                              {item.selected_size && (
                                <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                  Size: {item.selected_size}
                                </span>
                              )}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary text-xs h-7 mt-1 px-2"
                            onClick={() => handleViewManual(item.product_id)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Manual
                          </Button>
                        </div>
                        <p className="font-semibold shrink-0">
                          ৳{(item.quantity * item.product_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Charge</span>
                      <span>৳{order.delivery_charge.toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Discount</span>
                        <span>-৳{order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total</span>
                      <span>৳{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Delivery Address</p>
                      <p className="font-medium">{order.delivery_address.name}</p>
                      <p>{order.delivery_address.phone}</p>
                      <p>{order.delivery_address.address}</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-muted-foreground mb-1">Payment Method</p>
                        <p className="font-medium capitalize">
                          {order.payment_method.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {(order.payment_method === 'bkash' || order.payment_method === 'nagad') && order.payment_amount && (
                        <div>
                          <p className="text-muted-foreground mb-1">Amount Paid</p>
                          <p className="font-semibold text-primary">
                            ৳{order.payment_amount === 'full' 
                              ? order.total.toFixed(2) 
                              : order.delivery_charge.toFixed(2)}
                          </p>
                          {order.payment_amount === 'delivery_only' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Remaining ৳{(order.total - order.delivery_charge).toFixed(2)} on delivery
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Chat with Admin Button - Hide for cancelled orders */}
                    {order.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenChat(order.id, order.id.slice(0, 8))}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with Admin
                      </Button>
                    )}

                    {/* Cancel Order Button - Only show for pending orders with COD payment */}
                    {canCancelOrder(order.status, order.payment_method) && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Order
                      </Button>
                    )}
                    
                    {/* Show message for online payment orders that cannot be cancelled */}
                    {order.status === 'pending' && (order.payment_method === 'bkash' || order.payment_method === 'nagad') && (
                      <div className="p-3 bg-muted/50 border border-border rounded-lg">
                        <p className="text-xs text-muted-foreground text-center">
                          Orders paid with {order.payment_method === 'bkash' ? 'bKash' : 'Nagad'} cannot be cancelled. Please contact admin for assistance.
                        </p>
                      </div>
                    )}
                  </div>

                  {order.status === 'delivered' && order.items.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Write Reviews:</p>
                      {order.items.map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => handleWriteReview(order.id, item)}
                        >
                          <span className="truncate">{item.product_name}</span>
                          <ChevronRight className="h-4 w-4 ml-2 shrink-0" />
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {user && selectedOrderItem && (
        <ReviewDialog
          open={reviewDialogOpen}
          onClose={handleReviewSubmitted}
          orderId={selectedOrderId}
          orderItem={selectedOrderItem}
          userId={user.id}
        />
      )}

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              Once cancelled, you will need to place a new order if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelOrder}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product User Manual Dialog */}
      {selectedManualProduct && (
        <ProductUserManualDialog
          product={selectedManualProduct}
          open={showManualDialog}
          onAccept={() => setShowManualDialog(false)}
          onCancel={() => setShowManualDialog(false)}
        />
      )}

      </MainLayout>
  );
}
