import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { CartItem } from '@/types';
import { ShoppingCart, Trash2, Plus, Minus, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/db/api';
import { useDeviceType, getDeviceImages, getDeviceThumbnail } from '@/hooks/useDeviceType';
import { motion, AnimatePresence } from 'framer-motion';
import PageMeta from '@/components/common/PageMeta';
import { SwipeableCartItem } from '@/components/SwipeableCartItem';
import { ProductUserManualDialog } from '@/components/ProductUserManualDialog';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedManualProduct, setSelectedManualProduct] = useState<CartItem['product'] | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { deviceType } = useDeviceType();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    loadCart();

    const handleStorageChange = () => {
      loadCart();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    const updatedCart = [...cartItems];
    const item = updatedCart[index];
    const minQty = item.product.min_quantity || 1;
    
    // Validate against minimum quantity
    if (newQuantity < minQty) {
      toast.error(`Minimum order quantity is ${minQty} items`);
      return;
    }

    // Validate against stock
    if (newQuantity > item.product.stock) {
      toast.error('Not enough items available in stock');
      return;
    }

    updatedCart[index].quantity = newQuantity;
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (index: number) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
  };

  const handleCheckout = async () => {
    // Check if user is logged in
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    // Check if user is banned
    if (profile?.role === 'banned') {
      toast.error('Your account has been banned. You cannot make purchases.');
      
      // Send notification to user
      await createNotification({
        user_id: user.id,
        title: 'Purchase Attempt Blocked',
        message: 'Your account has been banned and you cannot make purchases. Please contact support for assistance.',
        type: 'system',
        order_id: null,
        read: false,
      }).catch(console.error);
      
      return;
    }

    // Proceed to checkout
    navigate('/checkout');
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <MainLayout>
      <PageMeta 
        title="Shopping Cart"
        description="Review your cart items and proceed to checkout. Secure payment and fast delivery guaranteed."
      />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-6">Add some products to get started</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <SwipeableCartItem
                      index={index}
                      onDelete={() => removeItem(index)}
                    >
                      <Card className="hover-lift transition-smooth">
                        <CardContent className="p-3 md:p-4">
                    <div className="flex flex-row gap-3 md:gap-4">
                      <div className="w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 bg-white rounded flex-shrink-0 flex items-center justify-center border overflow-hidden">
                        {(() => {
                          const deviceImages = getDeviceImages(deviceType, item.product.pc_images, item.product.mobile_images);
                          const thumbnail = getDeviceThumbnail(deviceType, item.product.pc_thumbnail, item.product.mobile_thumbnail, item.product.thumbnail);
                          const displayImage = thumbnail || (deviceImages.length > 0 ? deviceImages[0] : item.product.image_url);
                          
                          return displayImage ? (
                            <img
                              src={displayImage}
                              alt={item.product.name}
                              className="w-full h-full object-cover object-center protected-image"
                              onContextMenu={(e) => e.preventDefault()}
                              draggable="false"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/50">
                              <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base mb-1 truncate">{item.product.name}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              ৳{item.product.price} each
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold text-base md:text-lg text-primary">
                              ৳{(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Display selected options */}
                        {(item.selectedColor || item.selectedSize) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.selectedColor && (
                              <Badge variant="outline" className="text-xs">
                                Color: {item.selectedColor}
                              </Badge>
                            )}
                            {item.selectedSize && (
                              <Badge variant="outline" className="text-xs">
                                Size: {item.selectedSize}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 md:h-8 md:w-8"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= (item.product.min_quantity || 1)}
                            >
                              <Minus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value) || (item.product.min_quantity || 1))}
                              className="w-14 md:w-16 h-7 md:h-8 text-center text-sm"
                              min={item.product.min_quantity || 1}
                              max={item.product.stock}
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 md:h-8 md:w-8"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>

                          {item.product.min_quantity && item.product.min_quantity > 1 && (
                            <></>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive text-xs md:text-sm h-7 md:h-8"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Remove
                          </Button>

                          {item.product.user_manual && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary text-xs md:text-sm h-7 md:h-8"
                              onClick={() => {
                                setSelectedManualProduct(item.product);
                                setShowManualDialog(true);
                              }}
                            >
                              <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                              Manual
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SwipeableCartItem>
            </motion.div>
          ))}
          </AnimatePresence>
            </div>

            <div className="lg:sticky lg:top-4 lg:self-start">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="hover-lift transition-smooth">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-semibold text-base md:text-lg mb-4">Order Summary</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm md:text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
                      <span>Delivery charge</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between font-bold text-base md:text-lg mb-4 md:mb-6">
                    <span>Total</span>
                    <span>৳{subtotal.toFixed(2)}</span>
                  </div>

                  <Button className="w-full hover-scale" size="lg" onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
              </motion.div>
            </div>
          </div>
        )}
      </div>

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
