import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogDescription } from '@/components/ui/dialog';
import { TermsDialog } from '@/components/TermsDialog';
import { RefundsDialog } from '@/components/RefundsDialog';
import { ProductUserManualDialog } from '@/components/ProductUserManualDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { getDeliveryAddresses, getDeliveryLocations, getVoucherByCode, createOrder, createNotification, getPaymentGateways, createDeliveryAddress } from '@/db/api';
import type { CartItem, DeliveryAddress, DeliveryLocation, Voucher, PaymentGateway } from '@/types';
import { toast } from 'sonner';
import { Plus, MapPin, User, Phone, Home, CheckCircle2, Loader2, Save, MessageSquare, CreditCard, Briefcase, MoreHorizontal, FileText } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const { appSettings } = useAppSettings();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Bangladesh',
    landmark: '',
    address: '',
    address_type: 'home' as 'home' | 'office' | 'other',
    is_default: false,
  });
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<{ bkash_number?: string; nagad_number?: string }>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [selectedManualProduct, setSelectedManualProduct] = useState<CartItem['product'] | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [refundsDialogOpen, setRefundsDialogOpen] = useState(false);
  const [useProfileAddress, setUseProfileAddress] = useState(false);
  const [giftCardEmail, setGiftCardEmail] = useState('');
  const [agreedToEmailWarning, setAgreedToEmailWarning] = useState(false);
  
  // Guest checkout information
  const [guestInfo, setGuestInfo] = useState({
    email: '',
    name: '',
    phone: '',
  });
  
  // Auto-select address for guest users
  useEffect(() => {
    if (!user && !selectedAddress) {
      setSelectedAddress('guest-address');
    }
  }, [user, selectedAddress]);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Check force_sign_in setting
    const forceSignIn = appSettings?.force_sign_in ?? true; // Default to true if not loaded
    
    if (forceSignIn && !user) {
      toast.error('Please sign in to complete your purchase');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Check if user is banned (only if user is logged in)
    if (user && profile?.role === 'banned') {
      toast.error('Your account has been banned. You cannot make purchases.');
      
      // Send notification to user
      createNotification({
        user_id: user.id,
        title: 'Purchase Attempt Blocked',
        message: 'Your account has been banned and you cannot make purchases. Please contact support for assistance.',
        type: 'system',
        order_id: null,
        read: false,
      }).catch(console.error);
      
      navigate('/');
      return;
    }

    // Check if this is a Buy Now checkout
    const urlParams = new URLSearchParams(window.location.search);
    const buyNowParam = urlParams.get('buyNow');
    
    if (buyNowParam === 'true') {
      const buyNowProduct = localStorage.getItem('buyNowProduct');
      if (buyNowProduct) {
        setCartItems([JSON.parse(buyNowProduct)]);
        setIsBuyNow(true);
      } else {
        navigate('/products');
        return;
      }
    } else {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cart.length === 0) {
        navigate('/cart');
        return;
      }
      setCartItems(cart);
    }

    loadData();
  }, [user, profile, navigate]);

  // Reset payment method if it's not available for the selected location
  useEffect(() => {
    if (selectedLocation && selectedPayment) {
      const location = locations.find(loc => loc.id === selectedLocation);
      const availableMethods = location?.payment_methods || [];
      
      // Check if the currently selected payment method is available for this location
      if (!availableMethods.includes(selectedPayment)) {
        setSelectedPayment('');
        toast.info('Payment method changed due to location selection');
      }
    }
  }, [selectedLocation, locations, selectedPayment]);

  const loadData = async () => {
    try {
      // For guest users, only load locations and gateways
      if (!user) {
        const [locationsData, gatewaysData] = await Promise.all([
          getDeliveryLocations(),
          getPaymentGateways(),
        ]);

        setLocations(locationsData);

        // Extract Bkash and Nagad numbers from gateways
        const bkashGateway = gatewaysData.find(g => g.name.toLowerCase() === 'bkash');
        const nagadGateway = gatewaysData.find(g => g.name.toLowerCase() === 'nagad');
        
        setPaymentGateways({
          bkash_number: bkashGateway?.config?.account_number as string,
          nagad_number: nagadGateway?.config?.account_number as string,
        });

        if (locationsData.length > 0) {
          setSelectedLocation(locationsData[0].id);
        }
        
        return;
      }

      // For authenticated users, load addresses, locations, and gateways
      const [addressesData, locationsData, gatewaysData] = await Promise.all([
        getDeliveryAddresses(user.id),
        getDeliveryLocations(),
        getPaymentGateways(),
      ]);

      setAddresses(addressesData);
      setLocations(locationsData);

      // Extract Bkash and Nagad numbers from gateways
      const bkashGateway = gatewaysData.find(g => g.name.toLowerCase() === 'bkash');
      const nagadGateway = gatewaysData.find(g => g.name.toLowerCase() === 'nagad');
      
      setPaymentGateways({
        bkash_number: bkashGateway?.config?.account_number as string,
        nagad_number: nagadGateway?.config?.account_number as string,
      });

      if (addressesData.length > 0) {
        const defaultAddr = addressesData.find(a => a.is_default) || addressesData[0];
        setSelectedAddress(defaultAddr.id);
      }

      if (locationsData.length > 0) {
        setSelectedLocation(locationsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load checkout data');
    }
  };

  const applyVoucher = async () => {
    if (!voucherCode) return;

    try {
      const voucher = await getVoucherByCode(voucherCode);

      if (!voucher) {
        toast.error('Invalid voucher code');
        return;
      }

      if (!voucher.is_active) {
        toast.error('This voucher is not active');
        return;
      }

      if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
        toast.error('Voucher usage limit reached');
        return;
      }

      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        toast.error('Voucher has expired');
        return;
      }

      // Check minimum order amount
      const currentSubtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      if (voucher.minimum_amount && currentSubtotal < voucher.minimum_amount) {
        toast.error(`Minimum order amount of ৳${voucher.minimum_amount.toFixed(2)} required to use this voucher`);
        return;
      }

      setAppliedVoucher(voucher);
      toast.success('Voucher applied successfully');
    } catch (error) {
      console.error('Failed to apply voucher:', error);
      toast.error('Failed to apply voucher');
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    
    if (!newAddress.name || !newAddress.phone || (!newAddress.address && !newAddress.street)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const savedAddress = await createDeliveryAddress({
        user_id: user.id,
        label: newAddress.label,
        name: newAddress.name,
        phone: newAddress.phone,
        street: newAddress.street,
        city: newAddress.city,
        state: newAddress.state,
        zip_code: newAddress.zip_code,
        country: newAddress.country,
        landmark: newAddress.landmark,
        address: newAddress.address,
        address_type: newAddress.address_type,
        is_default: newAddress.is_default || addresses.length === 0,
      });
      
      setAddresses([...addresses, savedAddress]);
      setSelectedAddress(savedAddress.id);
      setNewAddress({
        label: 'Home',
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Bangladesh',
        landmark: '',
        address: '',
        address_type: 'home',
        is_default: false,
      });
      setIsAddressDialogOpen(false);
      toast.success('Address saved successfully');
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'office':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const handleUseProfileAddress = () => {
    if (!profile || !profile.full_name || !profile.phone || !profile.address) {
      toast.error('Please complete your profile address first');
      return;
    }

    setNewAddress({
      label: 'Home',
      name: profile.full_name,
      phone: profile.phone,
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Bangladesh',
      landmark: '',
      address: profile.address,
      address_type: 'home',
      is_default: false,
    });
    setUseProfileAddress(true);
    toast.success('Profile address loaded');
  };

  const handlePlaceOrder = async () => {
    // Check if cart contains only gift card products
    const hasOnlyGiftCards = cartItems.every(item => item.product.is_gift_card);
    const hasGiftCard = cartItems.some(item => item.product.is_gift_card);
    
    // Validate guest information if user is not logged in
    if (!user) {
      if (!guestInfo.email.trim() || !guestInfo.name.trim() || !guestInfo.phone.trim()) {
        toast.error('Please provide your contact information');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestInfo.email)) {
        toast.error('Please provide a valid email address');
        return;
      }
      
      // Validate phone format (basic validation)
      if (guestInfo.phone.length < 10) {
        toast.error('Please provide a valid phone number');
        return;
      }
    }
    
    // For gift card only orders, skip address/location validation
    if (hasOnlyGiftCards) {
      if (!selectedPayment) {
        toast.error('Please select a payment method');
        return;
      }
    } else {
      if (!selectedAddress || !selectedLocation || !selectedPayment) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Validate guest address if user is not logged in
      if (!user) {
        if (!newAddress.name.trim() || !newAddress.phone.trim() || !newAddress.address.trim()) {
          toast.error('Please provide complete delivery address information');
          return;
        }
      }
    }

    // Validate gift card email if cart contains gift card products
    if (hasGiftCard) {
      if (!giftCardEmail.trim()) {
        toast.error('Please provide an email address for gift card delivery');
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(giftCardEmail)) {
        toast.error('Please provide a valid email address');
        return;
      }
      
      if (!agreedToEmailWarning) {
        toast.error('Please confirm that you have read the email warning');
        return;
      }
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and refunds policy');
      return;
    }

    // Validate stock availability for all items
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        toast.error(`${item.product.name}: Only ${item.product.stock} items available in stock`);
        return;
      }
      
      // Validate minimum quantity requirement
      const minQty = item.product.min_quantity || 1;
      if (item.quantity < minQty) {
        toast.error(`${item.product.name}: Minimum order quantity is ${minQty} items. Please update your cart.`);
        return;
      }
    }

    // For gift card only orders, skip address/location validation
    let address, location;
    if (!hasOnlyGiftCards) {
      // For guest users, use newAddress directly
      if (!user) {
        address = {
          id: 'guest-address',
          name: newAddress.name,
          phone: newAddress.phone,
          address: newAddress.address,
        };
      } else {
        address = addresses.find(a => a.id === selectedAddress);
      }
      
      location = locations.find(l => l.id === selectedLocation);

      if (!address || !location) {
        toast.error('Invalid address or location');
        return;
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    let discount = 0;

    if (appliedVoucher) {
      if (appliedVoucher.type === 'percentage') {
        discount = (subtotal * appliedVoucher.value) / 100;
      } else {
        discount = appliedVoucher.value;
      }
    }

    const deliveryCharge = hasOnlyGiftCards ? 0 : (location?.charge || 0);
    const total = subtotal + deliveryCharge - discount;

    // For digital payments (bKash/Nagad), redirect to payment page
    if (selectedPayment === 'bkash' || selectedPayment === 'nagad') {
      const hasGiftCard = cartItems.some(item => item.product.is_gift_card);
      const orderData = {
        user_id: user?.id || null,
        status: 'pending' as const,
        subtotal,
        delivery_charge: deliveryCharge,
        discount,
        total,
        delivery_location_id: hasOnlyGiftCards ? null : location!.id,
        delivery_address: hasOnlyGiftCards ? {
          name: 'Gift Card - Digital Delivery',
          phone: 'N/A',
          address: 'Digital delivery to email'
        } : {
          name: address!.name,
          phone: address!.phone,
          address: address!.address,
        },
        payment_method: selectedPayment,
        voucher_code: appliedVoucher?.code || null,
        notes: orderNotes.trim() || null,
        gift_card_email: hasGiftCard ? giftCardEmail.trim() : null,
        // Add guest information if user is not logged in
        guest_email: user ? null : guestInfo.email.trim(),
        guest_name: user ? null : guestInfo.name.trim(),
        guest_phone: user ? null : guestInfo.phone.trim(),
      };

      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        selected_color: item.selectedColor || null,
        selected_size: item.selectedSize || null,
      }));

      // Get payment gateway number
      const paymentGatewayNumber = selectedPayment === 'bkash' 
        ? paymentGateways.bkash_number 
        : paymentGateways.nagad_number;

      // Navigate to payment page with order data
      navigate('/payment', {
        state: {
          orderData,
          orderItems,
          paymentMethod: selectedPayment,
          paymentGatewayNumber,
          isBuyNow,
        }
      });
      return;
    }

    // For COD, create order directly (Note: COD is not available for gift cards)
    setLoading(true);

    try {
      const hasGiftCard = cartItems.some(item => item.product.is_gift_card);
      const orderData = {
        user_id: user?.id || null,
        status: 'pending' as const,
        subtotal,
        delivery_charge: deliveryCharge,
        discount,
        total,
        delivery_location_id: hasOnlyGiftCards ? null : location!.id,
        delivery_address: hasOnlyGiftCards ? {
          name: 'Gift Card - Digital Delivery',
          phone: 'N/A',
          address: 'Digital delivery to email'
        } : {
          name: address!.name,
          phone: address!.phone,
          address: address!.address,
        },
        payment_method: selectedPayment,
        payment_amount: null,
        payment_details: null,
        transaction_id: null,
        voucher_code: appliedVoucher?.code || null,
        notes: orderNotes.trim() || null,
        gift_card_email: hasGiftCard ? giftCardEmail.trim() : null,
        // Add guest information if user is not logged in
        guest_email: user ? null : guestInfo.email.trim(),
        guest_name: user ? null : guestInfo.name.trim(),
        guest_phone: user ? null : guestInfo.phone.trim(),
      };

      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        selected_color: item.selectedColor || null,
        selected_size: item.selectedSize || null,
      }));

      // Create order directly for COD
      const order = await createOrder(orderData, orderItems);

      // Create notification only for logged-in users
      if (user) {
        await createNotification({
          user_id: user.id,
          type: 'order',
          title: 'Order Confirmed',
          message: `Your order #${order.id.slice(0, 8)} has been placed successfully!`,
          read: false,
          order_id: order.id,
        });
      }

      // Clear cart or buy now data
      if (isBuyNow) {
        localStorage.removeItem('buyNowProduct');
      } else {
        localStorage.removeItem('cart');
      }

      toast.success('Order placed successfully! You will receive a confirmation email shortly.');
      
      // For guest users, redirect to home page with success message
      if (!user) {
        navigate('/', { state: { orderSuccess: true, orderId: order.id } });
      } else {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const location = locations.find(l => l.id === selectedLocation);
  
  // Check if cart contains only gift card products
  const hasOnlyGiftCards = cartItems.length > 0 && cartItems.every(item => item.product.is_gift_card);
  const hasGiftCards = cartItems.some(item => item.product.is_gift_card);
  
  // Gift card orders have no delivery charge
  const deliveryCharge = hasOnlyGiftCards ? 0 : (location?.charge || 0);
  
  let discount = 0;

  if (appliedVoucher) {
    if (appliedVoucher.type === 'percentage') {
      discount = (subtotal * appliedVoucher.value) / 100;
    } else {
      discount = appliedVoucher.value;
    }
  }

  const total = subtotal + deliveryCharge - discount;
  
  // Filter payment methods based on user role and cart contents
  let availablePaymentMethods = location?.payment_methods || [];
  
  // If user is suspended, remove Cash on Delivery option
  if (profile?.role === 'suspended') {
    availablePaymentMethods = availablePaymentMethods.filter(method => method !== 'cash_on_delivery');
  }
  
  // If cart contains gift cards, remove Cash on Delivery option
  if (hasGiftCards) {
    availablePaymentMethods = availablePaymentMethods.filter(method => method !== 'cash_on_delivery');
  }

  return (
    <MainLayout>
      <PageMeta 
        title="Checkout - Complete Your Order"
        description="Complete your purchase securely. Multiple payment options available with fast delivery."
      />
      <div className="container mx-auto px-4 py-6 md:py-8 animate-in fade-in duration-500">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Guest Information Form - Show only for guest users */}
            {!user && (
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                    <span className="truncate">Your Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest-name">Full Name *</Label>
                    <Input
                      id="guest-name"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guest-email">Email Address *</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder="your.email@example.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send order confirmation and updates to this email
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guest-phone">Phone Number *</Label>
                    <Input
                      id="guest-phone"
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      For delivery coordination and order updates
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Hide delivery address for gift card only orders */}
            {!hasOnlyGiftCards && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                    <span className="truncate">Delivery Address</span>
                  </CardTitle>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-1 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 text-xs md:text-sm shrink-0"
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Add New</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Add New Address
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        {/* Address Type Selection */}
                        <div className="space-y-2">
                          <Label>Address Type</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['home', 'office', 'other'] as const).map((type) => (
                              <Button
                                key={type}
                                type="button"
                                variant={newAddress.address_type === type ? 'default' : 'outline'}
                                className="justify-start"
                                onClick={() => setNewAddress({ ...newAddress, address_type: type })}
                              >
                                {getAddressTypeIcon(type)}
                                <span className="ml-2 capitalize">{type}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Label */}
                        <div className="space-y-2">
                          <Label htmlFor="label">Address Label</Label>
                          <Input
                            id="label"
                            value={newAddress.label}
                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                            placeholder="e.g., Home, Office, Parents House"
                          />
                          <p className="text-xs text-muted-foreground">Give this address a memorable name</p>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={newAddress.name}
                              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                              placeholder="Recipient's full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              placeholder="+880 1XXX-XXXXXX"
                              required
                            />
                          </div>
                        </div>

                        {/* Street Address */}
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            placeholder="House/Flat number, Street name"
                          />
                        </div>

                        {/* City, State, ZIP */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State/Division</Label>
                            <Input
                              id="state"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              placeholder="State or Division"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zip">ZIP/Postal Code</Label>
                            <Input
                              id="zip"
                              value={newAddress.zip_code}
                              onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                              placeholder="ZIP Code"
                            />
                          </div>
                        </div>

                        {/* Country */}
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Select
                            value={newAddress.country}
                            onValueChange={(value) => setNewAddress({ ...newAddress, country: value })}
                          >
                            <SelectTrigger id="country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                              <SelectItem value="India">India</SelectItem>
                              <SelectItem value="Pakistan">Pakistan</SelectItem>
                              <SelectItem value="Nepal">Nepal</SelectItem>
                              <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Landmark */}
                        <div className="space-y-2">
                          <Label htmlFor="landmark">Nearby Landmark (Optional)</Label>
                          <Input
                            id="landmark"
                            value={newAddress.landmark}
                            onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                            placeholder="e.g., Near City Hospital, Opposite Park"
                          />
                          <p className="text-xs text-muted-foreground">Help delivery person find you easily</p>
                        </div>

                        {/* Full Address (Fallback) */}
                        <div className="space-y-2">
                          <Label htmlFor="address">Complete Address</Label>
                          <Textarea
                            id="address"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                            placeholder="Full address including all details"
                            rows={3}
                          />
                        </div>

                        {/* Set as Default */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-0.5">
                            <Label htmlFor="default">Set as Default Address</Label>
                            <p className="text-sm text-muted-foreground">
                              Use this address as default for checkout
                            </p>
                          </div>
                          <Switch
                            id="default"
                            checked={newAddress.is_default}
                            onCheckedChange={(checked) => setNewAddress({ ...newAddress, is_default: checked })}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsAddressDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="flex-1"
                            onClick={handleSaveAddress}
                            disabled={loading || !newAddress.name || !newAddress.phone || (!newAddress.address && !newAddress.street)}
                          >
                            {loading ? 'Saving...' : 'Add Address'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {!user ? (
                  // Guest address input
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="guest-address-name">Recipient Name *</Label>
                      <Input
                        id="guest-address-name"
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        placeholder="Enter recipient name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guest-address-phone">Phone Number *</Label>
                      <Input
                        id="guest-address-phone"
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guest-address-full">Full Delivery Address *</Label>
                      <Textarea
                        id="guest-address-full"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                        placeholder="House/Flat No, Street, Area, City"
                        rows={3}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Please provide complete address including house number, street, area, and city
                      </p>
                    </div>
                    
                    {/* Auto-select first address for guest */}
                    {!selectedAddress && (
                      <input type="hidden" value="guest-address" onChange={() => setSelectedAddress('guest-address')} />
                    )}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-6 md:py-8 space-y-3">
                    <div className="mx-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center">
                      <MapPin className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">No saved addresses yet</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Add a new address to continue</p>
                  </div>
                ) : (
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                    <div className="space-y-2 md:space-y-3">
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id} 
                          className={`relative rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                            selectedAddress === addr.id 
                              ? 'border-primary bg-primary/10 shadow-md' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4">
                            <RadioGroupItem 
                              value={addr.id} 
                              id={addr.id} 
                              className="mt-1 shrink-0" 
                            />
                            <Label htmlFor={addr.id} className="flex-1 cursor-pointer space-y-1.5 md:space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                                <p className="font-bold text-sm md:text-base">{addr.name}</p>
                                {addr.is_default && (
                                  <Badge variant="secondary" className="text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                                <p>{addr.phone}</p>
                              </div>
                              <div className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                                <Home className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0 mt-0.5" />
                                <p className="flex-1 break-words">{addr.address}</p>
                              </div>
                            </Label>
                            {selectedAddress === addr.id && (
                              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0 animate-in zoom-in duration-200" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
            )}

            {/* Hide delivery location for gift card only orders */}
            {!hasOnlyGiftCards && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Delivery Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <RadioGroup value={selectedLocation} onValueChange={setSelectedLocation}>
                  <div className="space-y-2 md:space-y-3">
                    {locations.map((loc) => (
                      <div 
                        key={loc.id} 
                        className={`relative rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                          selectedLocation === loc.id 
                            ? 'border-primary bg-primary/10 shadow-md' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between p-3 md:p-4 gap-2">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <RadioGroupItem value={loc.id} id={loc.id} className="shrink-0" />
                            <Label htmlFor={loc.id} className="cursor-pointer flex-1 min-w-0">
                              <div className="space-y-0.5 md:space-y-1">
                                <p className="font-bold text-sm md:text-base truncate">{loc.name}</p>
                                <p className="text-xs md:text-sm text-muted-foreground">Delivery: {loc.duration}</p>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                            <span className="font-bold text-base md:text-lg text-primary">৳{loc.charge}</span>
                            {selectedLocation === loc.id && (
                              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0 animate-in zoom-in duration-200" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            )}

            {/* Payment Method Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                {profile?.role === 'suspended' && (
                  <div className="p-2.5 md:p-3 bg-warning/10 border-2 border-warning/20 rounded-lg">
                    <p className="text-xs md:text-sm text-warning-foreground">
                      <strong>Note:</strong> Cash on Delivery is not available for suspended accounts. Please use online payment methods.
                    </p>
                  </div>
                )}
                {hasGiftCards && (
                  <div className="p-2.5 md:p-3 bg-primary/10 border-2 border-primary/20 rounded-lg">
                    <p className="text-xs md:text-sm text-primary-foreground">
                      <strong>Important:</strong> Gift card delivery takes approximately 24 hours after payment confirmation.
                    </p>
                  </div>
                )}
                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                  <div className="space-y-2 md:space-y-3">
                    {availablePaymentMethods.map((method) => (
                      <div 
                        key={method} 
                        className={`relative rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                          selectedPayment === method 
                            ? 'border-primary bg-primary/10 shadow-md' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4">
                          <RadioGroupItem value={method} id={method} className="shrink-0" />
                          <Label htmlFor={method} className="cursor-pointer flex-1 font-medium text-sm md:text-base capitalize">
                            {method.replace(/_/g, ' ')}
                          </Label>
                          {selectedPayment === method && (
                            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0 animate-in zoom-in duration-200" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Gift Card Email Card - Only show if cart contains gift card products */}
            {cartItems.some(item => item.product.is_gift_card) && (
              <Card className="border-2 shadow-lg border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Gift Card Delivery Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gift-card-email" className="text-sm md:text-base">
                      Email Address for Gift Card Delivery <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="gift-card-email"
                      type="email"
                      value={giftCardEmail}
                      onChange={(e) => setGiftCardEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="border-2 focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-destructive font-medium mb-3">
                      ⚠️ Important: You must provide your email address correctly. "Shottopath" will not be responsible if you provide an incorrect email address.
                    </p>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="email-warning"
                        checked={agreedToEmailWarning}
                        onCheckedChange={(checked) => setAgreedToEmailWarning(checked as boolean)}
                        className="mt-0.5 shrink-0"
                      />
                      <Label htmlFor="email-warning" className="cursor-pointer text-xs md:text-sm leading-relaxed">
                        I confirm that I have read and understood the warning above
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Notes Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Order Notes (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2">
                  <Label htmlFor="order-notes" className="text-sm md:text-base">
                    Add any special instructions or notes for your order
                  </Label>
                  <Textarea
                    id="order-notes"
                    value={orderNotes}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 500) {
                        setOrderNotes(value);
                      }
                    }}
                    placeholder="E.g., Please call before delivery, Leave at door, etc."
                    className="border-2 focus:border-primary min-h-[100px]"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {orderNotes.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions Card */}
            <Card className="border-2 shadow-lg border-primary/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-2 md:gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    className="mt-0.5 md:mt-1 shrink-0"
                  />
                  <Label htmlFor="terms" className="cursor-pointer text-xs md:text-sm leading-relaxed">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsDialogOpen(true);
                      }}
                      className="font-semibold text-primary hover:underline focus:outline-none focus:underline"
                    >
                      Terms and Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setRefundsDialogOpen(true);
                      }}
                      className="font-semibold text-primary hover:underline focus:outline-none focus:underline"
                    >
                      Refunds Policy
                    </button>
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-4">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">৳{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Delivery Charge</span>
                    <span className="font-medium">৳{deliveryCharge.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm md:text-base text-success">
                      <span>Discount</span>
                      <span className="font-medium">-৳{discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-base md:text-lg">
                  <span>Total</span>
                  <span className="text-primary">৳{total.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label>Voucher Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Enter code"
                    />
                    <Button onClick={applyVoucher} variant="outline">
                      Apply
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedAddress || !selectedLocation || !selectedPayment || !agreedToTerms}
                >
                  {loading ? 'Processing...' : (selectedPayment === 'bkash' || selectedPayment === 'nagad') ? 'Proceed to Payment' : 'Place Order'}
                </Button>
                {!agreedToTerms && (
                  <p className="text-xs text-destructive text-center">
                    Please agree to the terms and refunds policy to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Dialog */}
      <TermsDialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen} />
      <RefundsDialog open={refundsDialogOpen} onOpenChange={setRefundsDialogOpen} />
    </MainLayout>
  );
}
