import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import type { Product, ProductBundleWithProduct } from '@/types';
import { Minus, Plus, Package, ShoppingCart, Zap, Check, AlertCircle, Gift, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { getProductBundles } from '@/db/api';
import { useDeviceType, getDeviceThumbnail } from '@/hooks/useDeviceType';

interface ProductOptionsDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onConfirm: (options: { 
    color?: string; 
    size?: string; 
    quantity: number;
    bundleItems?: Array<{ product: Product; quantity: number }>;
  }) => void;
  actionType: 'cart' | 'buyNow';
}

export function ProductOptionsDialog({
  product,
  open,
  onClose,
  onConfirm,
  actionType,
}: ProductOptionsDialogProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const minQty = product.min_quantity || 1;
  const [quantity, setQuantity] = useState(minQty);
  const [bundles, setBundles] = useState<ProductBundleWithProduct[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());
  const [loadingBundles, setLoadingBundles] = useState(false);
  const { deviceType } = useDeviceType();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedColor('');
      setSelectedSize('');
      setQuantity(minQty);
      setSelectedBundles(new Set());
      loadBundles();
    }
  }, [open, minQty]);

  const loadBundles = async () => {
    try {
      setLoadingBundles(true);
      const bundleData = await getProductBundles(product.id);
      setBundles(bundleData);
    } catch (error) {
      console.error('Failed to load bundles:', error);
    } finally {
      setLoadingBundles(false);
    }
  };

  const hasColors = product.colors && product.colors.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;
  
  // Calculate bundle pricing
  const calculateBundlePrice = () => {
    let basePrice = product.price * quantity;
    let bundlePrice = 0;
    let totalDiscount = 0;

    selectedBundles.forEach(bundleId => {
      const bundle = bundles.find(b => b.id === bundleId);
      if (bundle && bundle.related_product) {
        const relatedPrice = bundle.related_product.price;
        const discount = (relatedPrice * bundle.bundle_discount_percent) / 100;
        bundlePrice += relatedPrice - discount;
        totalDiscount += discount;
      }
    });

    return {
      basePrice,
      bundlePrice,
      totalDiscount,
      totalPrice: basePrice + bundlePrice,
      originalTotal: basePrice + (bundlePrice + totalDiscount),
    };
  };

  const pricing = calculateBundlePrice();

  const toggleBundle = (bundleId: string) => {
    const newSelected = new Set(selectedBundles);
    if (newSelected.has(bundleId)) {
      newSelected.delete(bundleId);
    } else {
      newSelected.add(bundleId);
    }
    setSelectedBundles(newSelected);
  };

  const handleConfirm = () => {
    // Validate selections
    if (hasColors && !selectedColor) {
      return;
    }
    if (hasSizes && !selectedSize) {
      return;
    }

    // Prepare bundle items
    const bundleItems = Array.from(selectedBundles).map(bundleId => {
      const bundle = bundles.find(b => b.id === bundleId);
      return bundle ? { product: bundle.related_product, quantity: 1 } : null;
    }).filter(Boolean) as Array<{ product: Product; quantity: number }>;

    onConfirm({
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      quantity,
      bundleItems: bundleItems.length > 0 ? bundleItems : undefined,
    });

    // Close dialog - state will be reset when dialog opens again
    onClose();
  };

  const handleClose = () => {
    // Just close - state will be reset when dialog opens again
    onClose();
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > minQty) {
      setQuantity(quantity - 1);
    }
  };

  const isValid = (!hasColors || selectedColor) && (!hasSizes || selectedSize);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Select Product Options
          </DialogTitle>
          <DialogDescription className="text-base">
            Customize your order for <span className="font-semibold text-foreground">{product.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Summary Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {getDeviceThumbnail(deviceType, product.pc_thumbnail, product.mobile_thumbnail, product.thumbnail) && (
                  <div className="relative shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-2 border-primary/30 shadow-md">
                    <img
                      src={getDeviceThumbnail(deviceType, product.pc_thumbnail, product.mobile_thumbnail, product.thumbnail)}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-semibold text-base px-3 py-1">
                      ৳{product.price.toFixed(2)}
                    </Badge>
                    <Badge 
                      variant={product.stock > 0 && product.stock >= (product.min_quantity || 1) && product.stock > 10 ? "default" : product.stock > 0 && product.stock >= (product.min_quantity || 1) ? "secondary" : "destructive"}
                      className="gap-1"
                    >
                      <Package className="h-3 w-3" />
                      {product.stock > 0 && product.stock >= (product.min_quantity || 1) ? 'In stock' : 'Out of stock'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bundle Options Section */}
          {bundles.length > 0 && (
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-300">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Bundle & Save</h3>
                  <Badge variant="secondary" className="ml-auto gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Save up to {Math.max(...bundles.map(b => b.bundle_discount_percent))}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add these products together and get special bundle discounts!
                </p>
                
                <div className="space-y-3">
                  {bundles.map((bundle) => {
                    const isSelected = selectedBundles.has(bundle.id);
                    const relatedProduct = bundle.related_product;
                    const discountAmount = (relatedProduct.price * bundle.bundle_discount_percent) / 100;
                    const discountedPrice = relatedProduct.price - discountAmount;
                    
                    return (
                      <div
                        key={bundle.id}
                        className={`relative rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleBundle(bundle.id)}
                      >
                        <div className="flex items-start gap-3 p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleBundle(bundle.id)}
                            className="mt-1"
                          />
                          {getDeviceThumbnail(deviceType, relatedProduct.pc_thumbnail, relatedProduct.mobile_thumbnail, relatedProduct.thumbnail) && (
                            <div className="relative shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border">
                              <img
                                src={getDeviceThumbnail(deviceType, relatedProduct.pc_thumbnail, relatedProduct.mobile_thumbnail, relatedProduct.thumbnail)}
                                alt={relatedProduct.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2">{relatedProduct.name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs line-through text-muted-foreground">
                                ৳{relatedProduct.price.toFixed(2)}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                ৳{discountedPrice.toFixed(2)}
                              </span>
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                -{bundle.bundle_discount_percent}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Save ৳{discountAmount.toFixed(2)}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary shrink-0 animate-in zoom-in duration-200" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedBundles.size > 0 && (
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Bundle Savings:</span>
                      <span className="font-bold text-primary">
                        -৳{pricing.totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator className="my-6" />

          {/* Color Selection */}
          {hasColors && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Label className="text-lg font-bold flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold">
                  1
                </span>
                Choose Color <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={selectedColor} onValueChange={setSelectedColor}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.colors?.map((color) => (
                    <div 
                      key={color} 
                      className={`relative rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                        selectedColor === color 
                          ? 'border-primary bg-primary/10 shadow-md scale-105' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 p-4">
                        <RadioGroupItem value={color} id={`color-${color}`} className="shrink-0" />
                        <Label
                          htmlFor={`color-${color}`}
                          className="flex-1 cursor-pointer font-medium text-base"
                        >
                          {color}
                        </Label>
                        {selectedColor === color && (
                          <Check className="h-5 w-5 text-primary shrink-0 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Size Selection */}
          {hasSizes && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 delay-100">
              <Label className="text-lg font-bold flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {hasColors ? '2' : '1'}
                </span>
                Choose Size <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.sizes?.map((size) => (
                    <div 
                      key={size}
                      className={`relative rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                        selectedSize === size 
                          ? 'border-primary bg-primary/10 shadow-md scale-105' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 p-4">
                        <RadioGroupItem value={size} id={`size-${size}`} className="shrink-0" />
                        <Label
                          htmlFor={`size-${size}`}
                          className="flex-1 cursor-pointer font-medium text-base"
                        >
                          {size}
                        </Label>
                        {selectedSize === size && (
                          <Check className="h-5 w-5 text-primary shrink-0 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200">
            <Label className="text-lg font-bold flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold">
                {(hasColors ? 1 : 0) + (hasSizes ? 1 : 0) + 1}
              </span>
              Select Quantity
            </Label>
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-muted/50 to-muted">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={quantity <= minQty}
                className="h-10 w-10 rounded-full border-2 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="flex-1 flex flex-col items-center">
                <Input
                  type="text"
                  value={quantity}
                  readOnly
                  className="w-24 text-center text-xl font-bold border-2 focus:border-primary cursor-default"
                />
                {minQty > 1 && (
                  <></>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
                className="h-10 w-10 rounded-full border-2 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Total Price Display */}
          <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg">
            <CardContent className="p-6 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {product.name} × {quantity}
                  </span>
                  <span className="font-semibold">
                    ৳{pricing.basePrice.toFixed(2)}
                  </span>
                </div>
                
                {selectedBundles.size > 0 && (
                  <>
                    {Array.from(selectedBundles).map(bundleId => {
                      const bundle = bundles.find(b => b.id === bundleId);
                      if (!bundle) return null;
                      const discountedPrice = bundle.related_product.price - 
                        (bundle.related_product.price * bundle.bundle_discount_percent) / 100;
                      return (
                        <div key={bundleId} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {bundle.related_product.name}
                          </span>
                          <span className="font-semibold">
                            ৳{discountedPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground line-through">
                        Original Total
                      </span>
                      <span className="text-muted-foreground line-through">
                        ৳{pricing.originalTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm font-semibold text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        Bundle Savings
                      </span>
                      <span>
                        -৳{pricing.totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">Total Price</p>
                  {selectedBundles.size > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      You save ৳{pricing.totalDiscount.toFixed(2)}!
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    ৳{pricing.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Message */}
          {!isValid && (
            <Alert className="border-2 border-destructive/50 bg-destructive/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm font-medium text-destructive">
                Please select all required options before proceeding
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="w-full sm:w-auto border-2 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all hover:scale-105 gap-2"
          >
            {actionType === 'cart' ? (
              <>
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Buy Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
