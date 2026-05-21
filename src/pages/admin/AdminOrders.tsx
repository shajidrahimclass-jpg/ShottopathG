import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOrders, updateOrderStatus } from '@/db/api';
import type { OrderWithItems, OrderStatus } from '@/types';
import { toast } from 'sonner';
import { Eye, Search, MessageCircle } from 'lucide-react';
import { adminPath } from '@/config/admin';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;
    
    // Exclude cancelled orders by default
    filtered = filtered.filter(order => order.status !== 'cancelled');
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        // Search by order ID
        if (order.id.toLowerCase().includes(query)) return true;
        
        // Search by user name (from user object or delivery address)
        if (order.user?.username?.toLowerCase().includes(query)) return true;
        if (order.delivery_address?.name?.toLowerCase().includes(query)) return true;
        
        // Search by user email
        if (order.user?.email?.toLowerCase().includes(query)) return true;
        
        // Search by phone
        if (order.delivery_address?.phone?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }
    
    setFilteredOrders(filtered);
  }, [statusFilter, searchQuery, orders]);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setLoading(true);

    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (orderId: string, orderNumber: string) => {
    navigate(`${adminPath('chat')}?orderId=${orderId}`);
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

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Orders</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage customer orders</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Order ID, Name, Email, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
          <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
            <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs md:text-sm">Confirmed</TabsTrigger>
            <TabsTrigger value="on_the_way" className="text-xs md:text-sm">On Way</TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs md:text-sm">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs md:text-sm">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Order ID</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[120px]">Customer</TableHead>
                        <TableHead className="min-w-[80px]">Items</TableHead>
                        <TableHead className="min-w-[100px]">Total</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                  <TableRow 
                    key={order.id}
                    className={order.status === 'cancelled' ? 'bg-destructive/5' : ''}
                  >
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.delivery_address.name}</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_address.phone}</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_address.address}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ৳{order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status === 'on_the_way' 
                          ? 'On The Way' 
                          : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(adminPath(`orders/${order.id}`))}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenChat(order.id, order.id.slice(0, 8))}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                          disabled={loading || order.status === 'cancelled'}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="on_the_way">On The Way</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No orders found.
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card 
                    key={order.id}
                    className={order.status === 'cancelled' ? 'border-destructive/50' : ''}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{order.delivery_address.name}</p>
                        <p className="text-xs text-muted-foreground">{order.delivery_address.phone}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{order.delivery_address.address}</p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Items</p>
                          <p className="font-semibold">{order.items.length}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold text-primary">৳{order.total.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(adminPath(`orders/${order.id}`))}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenChat(order.id, order.id.slice(0, 8))}
                          className="flex-1"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="on_the_way">On The Way</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
