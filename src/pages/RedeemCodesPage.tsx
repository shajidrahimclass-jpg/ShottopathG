import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getAvailableRedeemCodes, getUserRedeemCodes, purchaseRedeemCode } from '@/db/api';
import type { RedeemCode } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function RedeemCodesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableCodes, setAvailableCodes] = useState<RedeemCode[]>([]);
  const [myCodes, setMyCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadCodes();
  }, [user, navigate]);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const [available, my] = await Promise.all([
        getAvailableRedeemCodes(),
        user ? getUserRedeemCodes(user.id) : Promise.resolve([]),
      ]);
      setAvailableCodes(available);
      setMyCodes(my);
    } catch (error) {
      console.error('Failed to load redeem codes:', error);
      toast.error('Failed to load redeem codes');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (codeId: string) => {
    if (!user) return;

    try {
      setPurchasing(codeId);
      await purchaseRedeemCode(codeId, user.id);
      toast.success('Redeem code purchased successfully!');
      loadCodes();
    } catch (error: any) {
      console.error('Failed to purchase redeem code:', error);
      if (error?.message?.includes('duplicate') || error?.message?.includes('available')) {
        toast.error('This code is no longer available');
      } else {
        toast.error('Failed to purchase redeem code');
      }
      loadCodes();
    } finally {
      setPurchasing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sold':
        return <Badge variant="secondary">Available to Use</Badge>;
      case 'redeemed':
        return <Badge variant="outline">Used</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Ticket className="h-6 w-6 md:h-8 md:w-8" />
              Redeem Codes
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Purchase redeem codes and use them to get discounts on your orders
            </p>
          </div>

          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Available Codes</TabsTrigger>
              <TabsTrigger value="my-codes">My Codes</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : availableCodes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No redeem codes available at the moment
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableCodes.map((code) => (
                    <Card key={code.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>৳{code.value.toFixed(2)} Value</span>
                          <Badge variant="default">Available</Badge>
                        </CardTitle>
                        <CardDescription>
                          Get ৳{code.value.toFixed(2)} discount on your next order
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-semibold">৳{code.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Savings:</span>
                            <span className="font-semibold text-primary">
                              ৳{(code.value - code.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => handlePurchase(code.id)}
                          disabled={purchasing === code.id}
                        >
                          {purchasing === code.id ? (
                            'Purchasing...'
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Purchase for ৳{code.price.toFixed(2)}
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-codes" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : myCodes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      You haven't purchased any redeem codes yet
                    </p>
                    <Button onClick={() => document.querySelector<HTMLButtonElement>('[value="available"]')?.click()}>
                      Browse Available Codes
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myCodes.map((code) => (
                    <Card key={code.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>৳{code.value.toFixed(2)} Value</span>
                          {getStatusBadge(code.status)}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          Code: {code.code}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Purchased:</span>
                            <span className="text-xs">
                              {format(new Date(code.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          {code.status === 'sold' && (
                            <div className="mt-4 p-3 bg-primary/10 rounded-md">
                              <p className="text-xs text-center">
                                Use this code at checkout to get ৳{code.value.toFixed(2)} discount
                              </p>
                            </div>
                          )}
                          {code.status === 'redeemed' && (
                            <div className="mt-4 p-3 bg-muted rounded-md flex items-center justify-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <p className="text-xs">Already used</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
