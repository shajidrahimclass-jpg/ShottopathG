import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getVouchers, createVoucher, updateVoucher, deleteVoucher } from '@/db/api';
import type { Voucher, VoucherType } from '@/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as VoucherType,
    value: '',
    minimum_amount: '',
    usage_limit: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const data = await getVouchers();
      setVouchers(data);
    } catch (error) {
      console.error('Failed to load vouchers:', error);
      toast.error('Failed to load vouchers');
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const voucherData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number.parseFloat(formData.value),
        minimum_amount: formData.minimum_amount ? Number.parseFloat(formData.minimum_amount) : null,
        usage_limit: formData.usage_limit ? Number.parseInt(formData.usage_limit) : null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      };

      if (editingVoucher) {
        await updateVoucher(editingVoucher.id, voucherData);
        toast.success('Voucher updated successfully');
      } else {
        await createVoucher(voucherData);
        toast.success('Voucher created successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadVouchers();
    } catch (error) {
      console.error('Failed to save voucher:', error);
      toast.error('Failed to save voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value.toString(),
      minimum_amount: voucher.minimum_amount?.toString() || '',
      usage_limit: voucher.usage_limit?.toString() || '',
      expires_at: voucher.expires_at ? new Date(voucher.expires_at).toISOString().split('T')[0] : '',
      is_active: voucher.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
      await deleteVoucher(id);
      toast.success('Voucher deleted successfully');
      loadVouchers();
    } catch (error) {
      console.error('Failed to delete voucher:', error);
      toast.error('Failed to delete voucher');
    }
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minimum_amount: '',
      usage_limit: '',
      expires_at: '',
      is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Vouchers</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage discount vouchers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Add New Voucher'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="DISCOUNT10"
                  />
                </div>
                <div>
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(value: VoucherType) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value * {formData.type === 'percentage' ? '(%)' : '(৳)'}</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '10' : '100'}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Minimum Order Amount (৳) (optional)</Label>
                  <Input
                    type="number"
                    value={formData.minimum_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_amount: e.target.value })}
                    placeholder="Minimum order amount to use this voucher"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Usage Limit (optional)</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label>Expiry Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving...' : editingVoucher ? 'Update Voucher' : 'Create Voucher'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Desktop Table View */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Code</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[80px]">Value</TableHead>
                    <TableHead className="min-w-[120px]">Min. Amount</TableHead>
                    <TableHead className="min-w-[100px]">Usage</TableHead>
                    <TableHead className="min-w-[120px]">Expires</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-mono font-semibold">{voucher.code}</TableCell>
                    <TableCell className="capitalize">{voucher.type}</TableCell>
                    <TableCell>
                      {voucher.type === 'percentage' ? `${voucher.value}%` : `৳${voucher.value}`}
                    </TableCell>
                    <TableCell>
                      {voucher.minimum_amount ? `৳${voucher.minimum_amount.toFixed(2)}` : 'No minimum'}
                    </TableCell>
                    <TableCell>
                      {voucher.usage_count} / {voucher.usage_limit || '∞'}
                    </TableCell>
                    <TableCell>
                      {voucher.expires_at
                        ? new Date(voucher.expires_at).toLocaleDateString()
                        : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${voucher.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {voucher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(voucher)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(voucher.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
          {vouchers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No vouchers found
              </CardContent>
            </Card>
          ) : (
            vouchers.map((voucher) => (
              <Card key={voucher.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-lg">{voucher.code}</p>
                      <p className="text-sm text-muted-foreground capitalize">{voucher.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${voucher.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {voucher.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-semibold">
                        {voucher.type === 'percentage' ? `${voucher.value}%` : `৳${voucher.value}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min. Amount</p>
                      <p className="font-semibold">
                        {voucher.minimum_amount ? `৳${voucher.minimum_amount.toFixed(2)}` : 'No minimum'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usage</p>
                      <p className="font-semibold">{voucher.usage_count} / {voucher.usage_limit || '∞'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-semibold">
                        {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : 'No expiry'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(voucher)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => handleDelete(voucher.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
