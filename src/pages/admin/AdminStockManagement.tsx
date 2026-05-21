import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { getProducts, getStockMovements, createStockMovement } from '@/db/api';
import type { Product, StockMovement } from '@/types';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Package, History, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminStockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, movementsData] = await Promise.all([
        getProducts(),
        getStockMovements(),
      ]);
      setProducts(productsData);
      setMovements(movementsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovement = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    try {
      await createStockMovement({
        product_id: selectedProduct,
        movement_type: movementType,
        quantity,
        reason: reason || undefined,
        notes: notes || undefined,
      });

      toast.success(`Stock ${movementType === 'in' ? 'added' : movementType === 'out' ? 'removed' : 'adjusted'} successfully`);
      
      // Dispatch stock update event for real-time updates
      window.dispatchEvent(new Event('stockUpdated'));
      
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create movement:', error);
      toast.error('Failed to update stock');
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setQuantity(1);
    setReason('');
    setNotes('');
    setMovementType('in');
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <Badge className="bg-green-600">Stock In</Badge>;
      case 'out':
        return <Badge className="bg-red-600">Stock Out</Badge>;
      default:
        return <Badge className="bg-blue-600">Adjustment</Badge>;
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock < 10);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage product inventory
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Stock Movement
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                Active products in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                Products with stock below 10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movements.length}</div>
              <p className="text-xs text-muted-foreground">
                Stock movements recorded
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="movements" className="gap-2">
              <History className="h-4 w-4" />
              Movement History
            </TabsTrigger>
            <TabsTrigger value="low-stock" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Low Stock ({lowStockProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Product Inventory</CardTitle>
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category || 'Uncategorized'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.stock === 0
                                  ? 'destructive'
                                  : product.stock < 10
                                    ? 'secondary'
                                    : 'default'
                              }
                            >
                              {product.stock} units
                            </Badge>
                          </TableCell>
                          <TableCell>৳{product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock Movement History</CardTitle>
                <CardDescription>
                  Complete history of all stock movements
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : movements.length === 0 ? (
                  <div className="p-12 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No movements yet</h3>
                    <p className="text-muted-foreground">
                      Stock movements will appear here
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Previous</TableHead>
                        <TableHead>New</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map(movement => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            {new Date(movement.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {getProductName(movement.product_id)}
                          </TableCell>
                          <TableCell>{getMovementBadge(movement.movement_type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getMovementIcon(movement.movement_type)}
                              {movement.quantity}
                            </div>
                          </TableCell>
                          <TableCell>{movement.previous_stock}</TableCell>
                          <TableCell>{movement.new_stock}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {movement.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>
                  Products that need restocking (below 10 units)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {lowStockProducts.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All stock levels healthy</h3>
                    <p className="text-muted-foreground">
                      No products with low stock
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant={product.stock === 0 ? 'destructive' : 'secondary'}>
                              {product.stock} units
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-red-600 font-medium">
                              {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product.id);
                                setMovementType('in');
                                setDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Stock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stock Movement Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Stock Movement</DialogTitle>
              <DialogDescription>
                Record a stock in, stock out, or adjustment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select
                  value={movementType}
                  onValueChange={(value: any) => setMovementType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Add)</SelectItem>
                    <SelectItem value="out">Stock Out (Remove)</SelectItem>
                    <SelectItem value="adjustment">Adjustment (Set)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Current: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Quantity
                  {movementType === 'adjustment' && ' (New Total)'}
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Number.parseInt(e.target.value))}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  {movementType === 'in' && 'Number of units to add'}
                  {movementType === 'out' && 'Number of units to remove'}
                  {movementType === 'adjustment' && 'Set stock to this exact number'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g., Purchase, Sale, Damage, Return"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional notes about this movement"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMovement}>Record Movement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
