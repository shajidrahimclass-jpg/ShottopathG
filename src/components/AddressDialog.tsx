import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DeliveryAddress } from '@/types';
import { MapPin, Home, Briefcase, MoreHorizontal } from 'lucide-react';

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (address: Partial<DeliveryAddress>) => Promise<void>;
  address?: DeliveryAddress | null;
  mode: 'add' | 'edit';
}

export function AddressDialog({ open, onOpenChange, onSave, address, mode }: AddressDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (address && mode === 'edit') {
      setFormData({
        label: address.label || 'Home',
        name: address.name,
        phone: address.phone,
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zip_code: address.zip_code || '',
        country: address.country || 'Bangladesh',
        landmark: address.landmark || '',
        address: address.address,
        address_type: address.address_type || 'home',
        is_default: address.is_default,
      });
    } else if (mode === 'add') {
      setFormData({
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
    }
  }, [address, mode, open]);

  const handleSave = async () => {
    if (!formData.name || !formData.phone || (!formData.address && !formData.street)) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save address:', error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {mode === 'add' ? 'Add New Address' : 'Edit Address'}
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
                  variant={formData.address_type === type ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setFormData({ ...formData, address_type: type })}
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
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Recipient's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="House/Flat number, Street name"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Division</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State or Division"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP/Postal Code</Label>
              <Input
                id="zip"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="ZIP Code"
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">

            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
            >

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
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              placeholder="e.g., Near City Hospital, Opposite Park"
            />
            <p className="text-xs text-muted-foreground">Help delivery person find you easily</p>
          </div>

          {/* Full Address (Fallback) */}
          <div className="space-y-2">

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
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={loading || !formData.name || !formData.phone || (!formData.address && !formData.street)}
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Add Address' : 'Update Address'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
