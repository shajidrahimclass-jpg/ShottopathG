import { useEffect, useState } from 'react';
import PageMeta from '@/components/common/PageMeta';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getDeliveryAddresses, createDeliveryAddress, updateDeliveryAddress, deleteDeliveryAddress, getOrders } from '@/db/api';
import type { DeliveryAddress, OrderWithItems } from '@/types';
import { toast } from 'sonner';
import { Plus, Trash2, User, MapPin, Edit, Package, ShoppingBag, Home, Briefcase, MoreHorizontal, Star, RefreshCw } from 'lucide-react';
import { AddressDialog } from '@/components/AddressDialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, profile, profileLoading, refreshProfile } = useAuth();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }
    loadAddresses();
    loadOrders();
  }, [user, navigate]);

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const data = await getDeliveryAddresses(user.id);
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const loadOrders = async () => {
    if (!user) return;

    try {
      const data = await getOrders(user.id);
      setOrders(data.slice(0, 5)); // Show only recent 5 orders
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleEditAddress = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSaveAddress = async (addressData: Partial<DeliveryAddress>) => {
    if (!user) return;

    setLoading(true);
    try {
      if (dialogMode === 'edit' && editingAddress) {
        await updateDeliveryAddress(editingAddress.id, addressData);
        toast.success('Address updated successfully');
      } else {
        await createDeliveryAddress({
          user_id: user.id,
          ...addressData,
          is_default: addressData.is_default || addresses.length === 0,
        } as Omit<DeliveryAddress, 'id' | 'created_at'>);
        toast.success('Address added successfully');
      }

      setDialogOpen(false);
      setEditingAddress(null);
      loadAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteDeliveryAddress(id);
      toast.success('Address deleted successfully');
      loadAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (address: DeliveryAddress) => {
    try {
      await updateDeliveryAddress(address.id, { is_default: true });
      toast.success('Default address updated');
      loadAddresses();
    } catch (error) {
      console.error('Failed to update default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const getAddressTypeIcon = (type?: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'office':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const formatAddress = (addr: DeliveryAddress) => {
    const parts: string[] = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.zip_code) parts.push(addr.zip_code);
    if (addr.country) parts.push(addr.country);
    
    return parts.length > 0 ? parts.join(', ') : addr.address;
  };

  return (
    <MainLayout>
      <PageMeta 
        title="My Profile - Account Settings"
        description="Manage your account settings, delivery addresses, and personal information."
      />
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Show spinner while profile is loading — prevents the "not found" flash */}
        {profileLoading && !profile && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        )}

        {/* Only show "Profile Not Found" when loading is fully done and still no profile */}
        {!profileLoading && !profile && user && (
          <div className="mb-6 p-4 bg-warning/10 border-2 border-warning/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning/20 rounded-lg shrink-0">
                <Package className="h-5 w-5 text-warning-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warning-foreground mb-1">Profile Not Found</h3>
                <p className="text-sm text-warning-foreground/90 mb-2">
                  Your profile could not be loaded. Click Retry to attempt loading it again.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshProfile}
                  className="border-warning/40 text-warning-foreground hover:bg-warning/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-lg md:text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-secondary/10 rounded-lg">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Addresses</p>
                  <p className="text-lg md:text-2xl font-bold">{addresses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-accent/10 rounded-lg">
                  <Package className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-success/10 rounded-lg">
                  <Star className="h-4 w-4 md:h-5 md:w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Member</p>
                  <p className="text-xs md:text-sm font-semibold capitalize">{profile?.role || 'user'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Account Information */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center ring-4 ring-primary/10">
                    <User className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs md:text-sm text-muted-foreground">Username</Label>
                  <p className="text-sm md:text-base font-semibold">{profile?.username || 'Not available'}</p>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs md:text-sm text-muted-foreground">Email</Label>
                  <p className="text-sm md:text-base font-semibold break-all">{profile?.email || user?.email || 'Not provided'}</p>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs md:text-sm text-muted-foreground">Role</Label>
                  <Badge variant="secondary" className="mt-1">
                    {profile?.role || 'user'}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs md:text-sm text-muted-foreground">Member Since</Label>
                  <p className="text-sm md:text-base font-semibold">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
                <CardDescription>Your latest purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-6">
                    <Package className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate('/products')}
                      className="mt-2"
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate('/orders')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs md:text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                          <Badge
                            variant={
                              order.status === 'delivered'
                                ? 'default'
                                : order.status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs md:text-sm font-semibold mt-1">৳{order.total}</p>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/orders')}
                    >
                      View All Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Delivery Addresses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Addresses
                    </CardTitle>
                    <CardDescription>Manage your saved delivery locations</CardDescription>
                  </div>
                  <Button onClick={handleAddAddress} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base md:text-lg font-medium mb-2">No addresses saved yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your delivery address for faster checkout
                    </p>
                    <Button onClick={handleAddAddress}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <Card key={addr.id} className="relative overflow-hidden">
                        <CardContent className="p-4">
                          {/* Address Type Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {getAddressTypeIcon(addr.address_type)}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{addr.label || 'Address'}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {addr.address_type || 'home'}
                                </p>
                              </div>
                            </div>
                            {addr.is_default && (
                              <Badge variant="default" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>

                          <Separator className="mb-3" />

                          {/* Contact Info */}
                          <div className="space-y-2 mb-3">
                            <div>
                              <p className="text-sm font-medium">{addr.name}</p>
                              <p className="text-xs text-muted-foreground">{addr.phone}</p>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {formatAddress(addr)}
                            </p>
                            {addr.landmark && (
                              <p className="text-xs text-muted-foreground italic">
                                Near: {addr.landmark}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            {!addr.is_default && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => handleSetDefault(addr)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => handleEditAddress(addr)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
                              onClick={() => handleDeleteAddress(addr.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      <AddressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveAddress}
        address={editingAddress}
        mode={dialogMode}
      />
    </MainLayout>
  );
}
