import { useEffect, useState } from 'react';
import { adminPath } from '@/config/admin';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InvoiceDialog } from '@/components/InvoiceDialog';
import { getOrderById, cancelOrder } from '@/db/api';
import type { OrderWithItems } from '@/types';
import { toast } from 'sonner';
import { ArrowLeft, Package, MapPin, CreditCard, User, Phone, Calendar, Hash, Copy, XCircle, Mail, UserCircle, FileText } from 'lucide-react';

export default function AdminOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const handleCancelOrder = async () => {
    if (!id || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      setIsCancelling(true);
      await cancelOrder(id, cancelReason);
      toast.success('Order cancelled successfully');
      setIsCancelDialogOpen(false);
      setCancelReason('');
      // Reload order to show updated status
      await loadOrder(id);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'on_the_way':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'delivered':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Order not found</h2>
          <Button onClick={() => navigate(adminPath('orders'))} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(adminPath('orders'))}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Order Details</h1>
              <p className="text-sm md:text-base text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
            <Badge className={getStatusColor(order.status)} variant="outline">
              {order.status === 'on_the_way' 
                ? 'On The Way' 
                : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Invoice
            </Button>
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="md:col-span-2 space-y-6">
            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.product_name}</p>
                            {(item.selected_color || item.selected_size) && (
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {item.selected_color && (
                                  <Badge variant="outline" className="font-normal">
                                    Color: {item.selected_color}
                                  </Badge>
                                )}
                                {item.selected_size && (
                                  <Badge variant="outline" className="font-normal">
                                    Size: {item.selected_size}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ৳{item.product_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ৳{(item.product_price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                {/* Order Summary */}
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
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-৳{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">৳{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p className="font-medium">{order.delivery_address.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(order.delivery_address.name, 'Name')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{order.delivery_address.phone}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(order.delivery_address.phone, 'Phone')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{order.delivery_address.address}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(order.delivery_address.address, 'Address')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gift Card Email - Only show if order has gift card email */}
            {order.gift_card_email && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Gift Card Delivery Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium break-all">{order.gift_card_email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(order.gift_card_email!, 'Gift Card Email')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      This order contains gift card products. The gift card will be delivered to this email address.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-medium capitalize">
                    {order.payment_method.replace(/_/g, ' ')}
                  </p>
                </div>
                {(order.payment_method === 'bkash' || order.payment_method === 'nagad') && order.payment_amount && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Type</p>
                    <p className="font-medium">
                      {order.payment_amount === 'full' ? 'Full Payment' : 'Delivery Charge Only'}
                    </p>
                  </div>
                )}
                {(order.payment_method === 'bkash' || order.payment_method === 'nagad') && order.payment_amount && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                    <p className="font-semibold text-lg text-primary">
                      ৳{order.payment_amount === 'full' 
                        ? order.total.toFixed(2) 
                        : order.delivery_charge.toFixed(2)}
                    </p>
                    {order.payment_amount === 'delivery_only' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Remaining ৳{(order.total - order.delivery_charge).toFixed(2)} to be collected on delivery
                      </p>
                    )}
                  </div>
                )}
                {order.transaction_id && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                    <p className="font-mono text-sm bg-muted px-3 py-2 rounded">
                      {order.transaction_id}
                    </p>
                  </div>
                )}
                {order.payment_details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Details</p>
                    <p className="font-mono text-sm bg-muted px-3 py-2 rounded break-all">
                      {order.payment_details}
                    </p>
                  </div>
                )}
                {order.voucher_code && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Voucher Code</p>
                    <Badge variant="secondary">{order.voucher_code}</Badge>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order Notes</p>
                    <div className="bg-muted px-3 py-2 rounded border-l-4 border-primary">
                      <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm">
                    {new Date(order.updated_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            {order.user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Username</p>
                        <p className="font-medium">{order.user.username}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(order.user!.username, 'Username')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Email</p>
                        <p className="font-medium break-all">{order.user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(order.user!.email, 'Email')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Cancel Order Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this order. The customer will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Cancellation Reason</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Enter the reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  setCancelReason('');
                }}
                disabled={isCancelling}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Dialog */}
        <InvoiceDialog
          open={isInvoiceDialogOpen}
          onOpenChange={setIsInvoiceDialogOpen}
          order={order}
        />
      </div>
    </AdminLayout>
  );
}
