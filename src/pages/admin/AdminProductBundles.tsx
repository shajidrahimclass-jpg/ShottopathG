import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { 
  getProducts, 
  getAllProductBundles, 
  createProductBundle, 
  updateProductBundle, 
  deleteProductBundle,
  getSuggestedBundles,
  approveSuggestedBundle,
  rejectSuggestedBundle,
  analyzeFrequentlyBoughtTogether,
} from '@/db/api';
import type { Product, ProductBundleWithProduct, SuggestedBundleWithProducts } from '@/types';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Gift, 
  TrendingUp, 
  Sparkles,
  Check,
  X,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminProductBundles() {
  const [bundles, setBundles] = useState<ProductBundleWithProduct[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedBundleWithProducts[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ProductBundleWithProduct | null>(null);
  const [previewBundle, setPreviewBundle] = useState<ProductBundleWithProduct | null>(null);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedRelatedProduct, setSelectedRelatedProduct] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bundlesData, productsData, suggestionsData] = await Promise.all([
        getAllProductBundles(),
        getProducts(),
        getSuggestedBundles('pending'),
      ]);
      setBundles(bundlesData);
      setProducts(productsData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      toast.info('Analyzing purchase history...');
      await analyzeFrequentlyBoughtTogether();
      await loadData();
      toast.success('Analysis complete! Check the suggestions tab.');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze purchase history');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!selectedProduct || !selectedRelatedProduct) {
      toast.error('Please select both products');
      return;
    }

    if (selectedProduct === selectedRelatedProduct) {
      toast.error('Cannot bundle a product with itself');
      return;
    }

    try {
      if (editingBundle) {
        await updateProductBundle(editingBundle.id, {
          bundle_discount_percent: discountPercent,
          display_order: displayOrder,
          is_active: isActive,
        });
        toast.success('Bundle updated successfully');
      } else {
        await createProductBundle({
          product_id: selectedProduct,
          related_product_id: selectedRelatedProduct,
          bundle_discount_percent: discountPercent,
          display_order: displayOrder,
          is_active: isActive,
        });
        toast.success('Bundle created successfully');
      }
      
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Failed to save bundle:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('This bundle already exists');
      } else {
        toast.error('Failed to save bundle');
      }
    }
  };

  const handleEdit = (bundle: ProductBundleWithProduct) => {
    setEditingBundle(bundle);
    setSelectedProduct(bundle.product_id);
    setSelectedRelatedProduct(bundle.related_product_id);
    setDiscountPercent(bundle.bundle_discount_percent);
    setDisplayOrder(bundle.display_order);
    setIsActive(bundle.is_active);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    try {
      await deleteProductBundle(id);
      toast.success('Bundle deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete bundle:', error);
      toast.error('Failed to delete bundle');
    }
  };

  const handleApprove = async (suggestionId: string) => {
    try {
      await approveSuggestedBundle(suggestionId);
      toast.success('Bundle suggestion approved and created');
      loadData();
    } catch (error) {
      console.error('Failed to approve suggestion:', error);
      toast.error('Failed to approve suggestion');
    }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      await rejectSuggestedBundle(suggestionId);
      toast.success('Bundle suggestion rejected');
      loadData();
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      toast.error('Failed to reject suggestion');
    }
  };

  const handlePreview = (bundle: ProductBundleWithProduct) => {
    setPreviewBundle(bundle);
    setPreviewOpen(true);
  };

  const resetForm = () => {
    setEditingBundle(null);
    setSelectedProduct('');
    setSelectedRelatedProduct('');
    setDiscountPercent(15);
    setDisplayOrder(0);
    setIsActive(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Bundles</h1>
            <p className="text-muted-foreground mt-1">
              Manage product bundles and AI-powered suggestions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              variant="outline"
              className="gap-2"
            >
              {analyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analyze Purchases
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Bundle
            </Button>
          </div>
        </div>

        <Tabs defaultValue="bundles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bundles" className="gap-2">
              <Gift className="h-4 w-4" />
              Active Bundles ({bundles.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Suggestions ({suggestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bundles" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : bundles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bundles yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first bundle or analyze purchase history for AI suggestions
                  </p>
                  <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Bundle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Main Product</TableHead>
                        <TableHead>Bundle With</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundles.map(bundle => (
                        <TableRow key={bundle.id}>
                          <TableCell className="font-medium">
                            {getProductName(bundle.product_id)}
                          </TableCell>
                          <TableCell>{bundle.related_product.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {bundle.bundle_discount_percent}% off
                            </Badge>
                          </TableCell>
                          <TableCell>{bundle.display_order}</TableCell>
                          <TableCell>
                            <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                              {bundle.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePreview(bundle)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(bundle)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(bundle.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No suggestions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Analyze Purchases" to generate AI-powered bundle suggestions
                  </p>
                  <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2">
                    {analyzing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Analyze Purchases
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {suggestions.map(suggestion => {
                  const mainProduct = suggestion.product;
                  const relatedProduct = suggestion.related_product;
                  const discountAmount = (relatedProduct.price * suggestion.suggested_discount_percent) / 100;
                  const discountedPrice = relatedProduct.price - discountAmount;

                  return (
                    <Card key={suggestion.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {mainProduct.name} + {relatedProduct.name}
                            </CardTitle>
                            <CardDescription>
                              Bought together {suggestion.co_purchase_count} times
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {suggestion.confidence_score}% confidence
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          {relatedProduct.thumbnail && (
                            <img
                              src={relatedProduct.thumbnail}
                              alt={relatedProduct.name}
                              className="w-16 h-16 object-cover rounded-md border"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{relatedProduct.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm line-through text-muted-foreground">
                                ৳{relatedProduct.price.toFixed(2)}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                ৳{discountedPrice.toFixed(2)}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                -{suggestion.suggested_discount_percent}%
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(suggestion.id)}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(suggestion.id)}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Approve & Create
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
              </DialogTitle>
              <DialogDescription>
                Configure product bundle settings and discount percentage
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Main Product</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                  disabled={!!editingBundle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select main product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bundle With</Label>
                <Select
                  value={selectedRelatedProduct}
                  onValueChange={setSelectedRelatedProduct}
                  disabled={!!editingBundle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select related product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter(p => p.id !== selectedProduct)
                      .map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Discount Percentage</Label>
                  <Badge variant="secondary">{discountPercent}% off</Badge>
                </div>
                <Slider
                  value={[discountPercent]}
                  onValueChange={([value]) => setDiscountPercent(value)}
                  min={0}
                  max={50}
                  step={5}
                  className="py-4"
                />
                <p className="text-xs text-muted-foreground">
                  Customers will get {discountPercent}% off when buying these products together
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(Number.parseInt(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={isActive ? 'active' : 'inactive'}
                    onValueChange={value => setIsActive(value === 'active')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate}>
                {editingBundle ? 'Update Bundle' : 'Create Bundle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bundle Preview</DialogTitle>
              <DialogDescription>
                How this bundle will appear to customers
              </DialogDescription>
            </DialogHeader>

            {previewBundle && (
              <div className="space-y-4 py-4">
                <Alert>
                  <Gift className="h-4 w-4" />
                  <AlertDescription>
                    Bundle & Save - Save up to {previewBundle.bundle_discount_percent}%
                  </AlertDescription>
                </Alert>

                <Card className="border-2 border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {previewBundle.related_product.thumbnail && (
                        <img
                          src={previewBundle.related_product.thumbnail}
                          alt={previewBundle.related_product.name}
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">
                          {previewBundle.related_product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs line-through text-muted-foreground">
                            ৳{previewBundle.related_product.price.toFixed(2)}
                          </span>
                          <span className="text-sm font-bold text-primary">
                            ৳{(previewBundle.related_product.price * (1 - previewBundle.bundle_discount_percent / 100)).toFixed(2)}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            -{previewBundle.bundle_discount_percent}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Save ৳{(previewBundle.related_product.price * previewBundle.bundle_discount_percent / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
