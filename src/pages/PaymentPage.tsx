import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveTerms, createOrder, createNotification } from '@/db/api';
import type { TermsAndConditions } from '@/types';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Copy, Check, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentData {
  orderData: any;
  orderItems: any[];
  paymentMethod: string;
  paymentGatewayNumber?: string;
  isBuyNow: boolean;
}

export default function PaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<'full' | 'delivery_only'>('full');
  const [transactionId, setTransactionId] = useState('');
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('');
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Get payment data from location state
    const data = location.state as PaymentData;
    if (!data || !data.orderData) {
      toast.error('Invalid payment session');
      navigate('/checkout');
      return;
    }

    setPaymentData(data);
    loadTerms();
  }, [user, navigate, location]);

  const loadTerms = async () => {
    try {
      const termsData = await getActiveTerms();
      setTerms(termsData);
    } catch (error) {
      console.error('Failed to load terms:', error);
    }
  };

  const handleCopyNumber = async () => {
    if (paymentData?.paymentGatewayNumber) {
      try {
        await navigator.clipboard.writeText(paymentData.paymentGatewayNumber);
        setCopied(true);
        toast.success('Number copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy number');
      }
    }
  };

  const handleCompletePayment = async () => {
    if (!paymentData || !user) return;

    // Validate payment phone number for digital payments
    if ((paymentData.paymentMethod === 'bkash' || paymentData.paymentMethod === 'nagad')) {
      if (!paymentPhoneNumber.trim()) {
        toast.error(`Please enter your ${paymentMethodName} number`);
        return;
      }
      if (!/^01\d{9}$/.test(paymentPhoneNumber)) {
        toast.error('Please enter a valid 11-digit phone number starting with 01');
        return;
      }
    }

    // Validate transaction ID for digital payments
    if ((paymentData.paymentMethod === 'bkash' || paymentData.paymentMethod === 'nagad') && !transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    // Note: Stock validation is done in CheckoutPage before reaching here
    // Backend will also validate stock when creating the order

    setLoading(true);

    try {
      // Create order with transaction ID, phone last 4 digits, and payment phone number
      const orderDataWithTransaction = {
        ...paymentData.orderData,
        transaction_id: (paymentData.paymentMethod === 'bkash' || paymentData.paymentMethod === 'nagad') 
          ? transactionId 
          : null,
        payment_amount: paymentAmount,
        payment_details: (paymentData.paymentMethod === 'bkash' || paymentData.paymentMethod === 'nagad')
          ? `${paymentPhoneNumber}-${(paymentAmount === 'delivery_only' 
              ? paymentData.orderData.delivery_charge 
              : paymentData.orderData.total).toFixed(2)}`
          : null,
      };

      const order = await createOrder(orderDataWithTransaction, paymentData.orderItems);

      // Create notification
      await createNotification({
        user_id: user.id,
        type: 'order',
        title: 'Order Confirmed',
        message: `Your order #${order.id.slice(0, 8)} has been placed successfully!`,
        read: false,
        order_id: order.id,
      });

      // Clear cart or buy now data
      if (paymentData.isBuyNow) {
        localStorage.removeItem('buyNowProduct');
      } else {
        localStorage.removeItem('cart');
      }

      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error: any) {
      console.error('Failed to place order:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('Insufficient stock')) {
          errorMessage = error.message; // Show the specific stock error
        } else if (error.message.includes('delivery_address')) {
          errorMessage = 'Invalid delivery address. Please check your address details.';
        } else if (error.message.includes('payment_method')) {
          errorMessage = 'Invalid payment method selected.';
        } else if (error.message.includes('user_id')) {
          errorMessage = 'User authentication error. Please log in again.';
        } else if (error.message.includes('delivery_location_id')) {
          errorMessage = 'Invalid delivery location. Please select a valid location.';
        } else if (error.message.includes('product_id')) {
          errorMessage = 'One or more products are no longer available.';
        } else if (error.message.includes('transaction_id')) {
          errorMessage = 'Invalid transaction ID. Please check your payment details.';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Invalid order data. Please check all fields.';
        } else if (error.message.includes('null value')) {
          errorMessage = 'Missing required information. Please fill all required fields.';
        } else {
          errorMessage = `Order failed: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative h-16 w-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Loading payment details...</p>
        </div>
      </MainLayout>
    );
  }

  const isCashOnDelivery = paymentData.paymentMethod === 'cash_on_delivery';
  const paymentMethodName = paymentData.paymentMethod.replace(/_/g, ' ').toUpperCase();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl animate-in fade-in duration-500">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Complete Payment
        </h1>

        <div className="space-y-4 md:space-y-6">
          {/* Enhanced Payment Method Info */}
          <Card className="border-2 shadow-lg transition-all hover:shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 shadow-md">
                  <span className="font-semibold text-sm md:text-base">{paymentMethodName}</span>
                  <span className="text-xl md:text-2xl font-bold text-primary">
                    ৳{(paymentAmount === 'delivery_only' 
                      ? paymentData.orderData.delivery_charge 
                      : paymentData.orderData.total).toFixed(2)}
                  </span>
                </div>
                {paymentAmount === 'delivery_only' && (
                  <Alert className="border-2 border-primary/20 bg-primary/5">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      You are paying delivery charge only. Remaining amount (৳{(paymentData.orderData.total - paymentData.orderData.delivery_charge).toFixed(2)}) will be collected on delivery.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount Selection for Bkash/Nagad */}
          {!isCashOnDelivery && (
            <Card className="border-2 shadow-lg transition-all hover:shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Select Payment Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup value={paymentAmount} onValueChange={(value) => setPaymentAmount(value as 'full' | 'delivery_only')}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl bg-background hover:border-primary/50 transition-all cursor-pointer">
                      <RadioGroupItem value="full" id="full-payment" />
                      <Label htmlFor="full-payment" className="cursor-pointer flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm md:text-base">Full Payment</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Pay the complete order amount now</p>
                          </div>
                          <span className="font-bold text-primary text-lg md:text-xl ml-4">
                            ৳{paymentData.orderData.total.toFixed(2)}
                          </span>
                        </div>
                      </Label>
                    </div>
                    {/* Only show delivery charge option if delivery charge is greater than 0 */}
                    {paymentData.orderData.delivery_charge > 0 && (
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl bg-background hover:border-primary/50 transition-all cursor-pointer">
                      <RadioGroupItem value="delivery_only" id="delivery-only" />
                      <Label htmlFor="delivery-only" className="cursor-pointer flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm md:text-base">Delivery Charge Only</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Pay delivery charge now, rest on delivery</p>
                          </div>
                          <span className="font-bold text-primary text-lg md:text-xl ml-4">
                            ৳{paymentData.orderData.delivery_charge.toFixed(2)}
                          </span>
                        </div>
                      </Label>
                    </div>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Payment Instructions for Bkash/Nagad - Accordion */}
          {!isCashOnDelivery && (
            <Accordion type="single" collapsible defaultValue="payment-instructions" className="animate-in slide-in-from-bottom-4 duration-500">
              <AccordionItem value="payment-instructions">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-0 bg-gradient-to-r from-primary/5 to-primary/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Payment Instructions
                      </CardTitle>
                    </AccordionTrigger>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                      <Alert className="border-2 border-primary/30 bg-primary/5">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-xs md:text-sm font-medium">
                          Please complete the payment before submitting your order
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3 md:space-y-4 p-3 md:p-4 border-2 rounded-xl bg-gradient-to-br from-muted/50 to-muted shadow-inner">
                        <div className="space-y-2">
                          <p className="text-xs md:text-sm font-bold text-primary flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                            Send Money
                          </p>
                          <p className="text-xs md:text-sm pl-7 md:pl-8">
                            Send <span className="font-bold text-primary text-sm md:text-base">
                              ৳{(paymentAmount === 'delivery_only' 
                                ? paymentData.orderData.delivery_charge 
                                : paymentData.orderData.total).toFixed(2)}
                            </span> to:
                          </p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 pl-7 md:pl-8">
                            <p className="text-sm md:text-base lg:text-lg font-bold text-primary break-all flex-1 bg-background/50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border-2 border-primary/30">
                              {paymentData.paymentGatewayNumber || 'Contact admin for payment number'}
                            </p>
                            {paymentData.paymentGatewayNumber && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCopyNumber}
                                className="shrink-0 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105 text-xs md:text-sm"
                              >
                                {copied ? (
                                  <>
                                    <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-2 md:space-y-3">
                          <p className="text-xs md:text-sm font-bold text-primary flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                            Enter Your {paymentMethodName} Number
                          </p>
                          <div className="space-y-2 pl-7 md:pl-8">
                            <Label htmlFor="payment-phone" className="text-xs md:text-sm font-semibold">
                              {paymentMethodName} Number Used for Payment *
                            </Label>
                            <Input
                              id="payment-phone"
                              placeholder="Enter 11-digit number (e.g., 01712345678)"
                              value={paymentPhoneNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                setPaymentPhoneNumber(value);
                              }}
                              maxLength={11}
                              className="font-mono text-xs md:text-sm border-2 focus:border-primary/50 transition-all"
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter the complete {paymentMethodName} number you used to send money
                            </p>
                          </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-2 md:space-y-3">
                          <p className="text-xs md:text-sm font-bold text-primary flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                            Enter Transaction ID
                          </p>
                          <div className="space-y-2 pl-7 md:pl-8">
                            <Label htmlFor="transaction-id" className="text-xs md:text-sm font-semibold">
                              Transaction ID *
                            </Label>
                            <Input
                              id="transaction-id"
                              placeholder={`Enter ${paymentMethodName} transaction ID`}
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              className="font-mono text-xs md:text-sm border-2 focus:border-primary/50 transition-all"
                            />
                            <p className="text-xs text-muted-foreground">
                              You will receive this ID after completing the payment
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          )}

          {/* Enhanced Cash on Delivery Info - Accordion */}
          {isCashOnDelivery && (
            <Accordion type="single" collapsible defaultValue="cod-info" className="animate-in slide-in-from-bottom-4 duration-500">
              <AccordionItem value="cod-info">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-0 bg-gradient-to-r from-green-500/10 to-green-500/5">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Cash on Delivery
                      </CardTitle>
                    </AccordionTrigger>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="pt-4">
                      <Alert className="border-2 border-green-500/30 bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-sm font-medium">
                          You will pay ৳{paymentData.orderData.total.toFixed(2)} when you receive your order
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          )}

          {/* Enhanced Terms and Conditions - Accordion */}
          {terms && (
            <Accordion type="single" collapsible defaultValue="terms" className="animate-in slide-in-from-bottom-4 duration-500">
              <AccordionItem value="terms">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-0 bg-gradient-to-r from-primary/5 to-primary/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <CardTitle className="text-lg md:text-xl">{terms.title}</CardTitle>
                    </AccordionTrigger>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="space-y-4 pt-4">
                      <div className="max-h-64 overflow-y-auto p-3 md:p-4 border-2 rounded-xl bg-muted/50 shadow-inner">
                        <pre className="text-xs md:text-sm whitespace-pre-wrap font-sans leading-relaxed">
                          {terms.content}
                        </pre>
                      </div>

                      <div className="flex items-start space-x-2 md:space-x-3 p-3 md:p-4 border-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                        <Checkbox
                          id="terms"
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                          className="mt-0.5 shrink-0"
                        />
                        <Label
                          htmlFor="terms"
                          className="text-xs md:text-sm cursor-pointer leading-relaxed font-medium"
                        >
                          I have read and agree to the terms and conditions. I understand that orders cannot be cancelled after confirmation.
                        </Label>
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 animate-in slide-in-from-bottom-4 duration-500">
            <Button
              variant="outline"
              onClick={() => {
                if (paymentData?.isBuyNow) {
                  navigate('/checkout?buyNow=true');
                } else {
                  navigate('/checkout');
                }
              }}
              disabled={loading}
              className="flex-1 w-full h-12 border-2 hover:bg-muted hover:border-primary/50 transition-all hover:scale-105 shadow-md"
            >
              Back to Checkout
            </Button>
            <Button
              onClick={handleCompletePayment}
              disabled={
                loading || 
                !agreedToTerms || 
                (!isCashOnDelivery && (!paymentPhoneNumber || !transactionId.trim()))
              }
              className="flex-1 w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Confirm Order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
