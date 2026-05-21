import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getRedeemCodes, createRedeemCode, deleteRedeemCode } from '@/db/api';
import type { RedeemCode } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function AdminRedeemCodes() {
  const { user } = useAuth();
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    value: '',
    price: '',
  });

  useEffect(() => {
    loadRedeemCodes();
  }, []);

  const loadRedeemCodes = async () => {
    try {
      setLoading(true);
      const data = await getRedeemCodes();
      setRedeemCodes(data);
    } catch (error) {
      console.error('Failed to load redeem codes:', error);
      toast.error('Failed to load redeem codes');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const code = `RC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.value || !formData.price) {
      toast.error('Please fill in all fields');
      return;
    }

    const value = parseFloat(formData.value);
    const price = parseFloat(formData.price);

    if (value <= 0 || price < 0) {
      toast.error('Invalid value or price');
      return;
    }

    try {
      setSubmitting(true);
      await createRedeemCode({
        code: formData.code.toUpperCase(),
        value,
        price,
        status: 'available',
        created_by: user?.id || null,
        purchased_by: null,
        used_in_order: null,
        expiry_date: null,
      });

      toast.success('Redeem code created successfully');
      setFormData({ code: '', value: '', price: '' });
      setDialogOpen(false);
      loadRedeemCodes();
    } catch (error: any) {
      console.error('Failed to create redeem code:', error);
      if (error?.message?.includes('duplicate')) {
        toast.error('This code already exists');
      } else {
        toast.error('Failed to create redeem code');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redeem code?')) return;

    try {
      await deleteRedeemCode(id);
      toast.success('Redeem code deleted');
      loadRedeemCodes();
    } catch (error) {
      console.error('Failed to delete redeem code:', error);
      toast.error('Failed to delete redeem code');
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Available</Badge>;
      case 'sold':
        return <Badge variant="secondary">Sold</Badge>;
      case 'redeemed':
        return <Badge variant="outline">Redeemed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Redeem Codes</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Create and manage redeem codes for users to purchase
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Redeem Code
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Redeem Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : redeemCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No redeem codes found. Create your first redeem code to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redeemCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            {code.code}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCode(code.code, code.id)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedId === code.id ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>৳{code.value.toFixed(2)}</TableCell>
                        <TableCell>৳{code.price.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(code.status)}</TableCell>
                        <TableCell>
                          {format(new Date(code.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(code.id)}
                            disabled={code.status !== 'available'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Redeem Code</DialogTitle>
              <DialogDescription>
                Create a new redeem code that users can purchase
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="RC-XXXXXXXX"
                    className="uppercase"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value (৳)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="100.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The discount amount users will receive when redeeming this code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (৳)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="80.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The price users pay to purchase this redeem code
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Code'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
