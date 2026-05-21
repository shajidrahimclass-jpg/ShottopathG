import { useEffect, useState, useRef } from 'react';
import { QRCodeWrapper } from '@/components/QRCodeWrapper';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getInvoiceSettings, updateInvoiceSettings } from '@/db/api';
import type { InvoiceSettings } from '@/types';
import { toast } from 'sonner';
import { Save, FileText, Building2, Phone, Mail, CreditCard, FileCheck, QrCode, Upload, X } from 'lucide-react';
import { supabase } from '@/db/supabase';

export default function AdminInvoiceEditor() {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getInvoiceSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load invoice settings:', error);
      toast.error('Failed to load invoice settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('invoice-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('invoice-logos')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setSettings((prev) => prev ? { ...prev, company_logo: urlData.publicUrl } : null);
        toast.success('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => prev ? { ...prev, company_logo: null } : null);
    toast.success('Logo removed');
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await updateInvoiceSettings(settings.id, {
        company_name: settings.company_name,
        company_logo: settings.company_logo,
        company_address: settings.company_address,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        tax_id: settings.tax_id,
        terms_and_conditions: settings.terms_and_conditions,
        custom_notes: settings.custom_notes,
        footer_text: settings.footer_text,
        bank_name: settings.bank_name,
        bank_account_name: settings.bank_account_name,
        bank_account_number: settings.bank_account_number,
        bank_routing_number: settings.bank_routing_number,
        show_logo: settings.show_logo,
        show_tax_id: settings.show_tax_id,
        show_bank_details: settings.show_bank_details,
        qr_code_content: settings.qr_code_content,
        show_qr_code: settings.show_qr_code,
      });
      toast.success('Invoice settings saved successfully');
    } catch (error) {
      console.error('Failed to save invoice settings:', error);
      toast.error('Failed to save invoice settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof InvoiceSettings, value: string | boolean | null) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <div className="h-12 w-full md:w-64 bg-muted animate-pulse rounded-md" />
          <div className="h-96 w-full bg-muted animate-pulse rounded-md" />
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="text-center py-12 px-4">
          <FileText className="h-12 md:h-16 w-12 md:w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2">No invoice settings found</h2>
          <p className="text-sm md:text-base text-muted-foreground">Please contact support</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Invoice Editor</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Customize invoice appearance and information</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid gap-4 md:gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle className="text-lg md:text-xl">Company Information</CardTitle>
              </div>
              <CardDescription className="text-sm">Basic company details displayed on invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sm">Company Name *</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="Enter company name"
                  className="text-sm"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Company Logo</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                </div>

                {settings.company_logo && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs md:text-sm font-medium">Logo Preview:</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <img 
                      src={settings.company_logo} 
                      alt="Company Logo" 
                      className="h-16 md:h-20 object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_logo"
                    checked={settings.show_logo}
                    onCheckedChange={(checked) => updateField('show_logo', checked)}
                  />
                  <Label htmlFor="show_logo" className="cursor-pointer text-sm">
                    Show logo on invoice (left side)
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="company_address" className="text-sm">Company Address</Label>
                <Textarea
                  id="company_address"
                  value={settings.company_address || ''}
                  onChange={(e) => updateField('company_address', e.target.value)}
                  placeholder="Enter full company address"
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_phone" className="text-sm">
                    <Phone className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="company_phone"
                    value={settings.company_phone || ''}
                    onChange={(e) => updateField('company_phone', e.target.value)}
                    placeholder="+880 1234567890"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_email" className="text-sm">
                    <Mail className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                    Email Address
                  </Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={settings.company_email || ''}
                    onChange={(e) => updateField('company_email', e.target.value)}
                    placeholder="support@example.com"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <CardTitle className="text-lg md:text-xl">QR Code</CardTitle>
              </div>
              <CardDescription className="text-sm">Add QR code to invoice (displayed on right side)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr_code_content" className="text-sm">QR Code Content</Label>
                <Textarea
                  id="qr_code_content"
                  value={settings.qr_code_content || ''}
                  onChange={(e) => updateField('qr_code_content', e.target.value)}
                  placeholder="Enter URL, text, or any content for QR code"
                  rows={3}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter any text, URL, or information you want to encode in the QR code
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_qr_code"
                  checked={settings.show_qr_code}
                  onCheckedChange={(checked) => updateField('show_qr_code', checked)}
                />
                <Label htmlFor="show_qr_code" className="cursor-pointer text-sm">
                  Show QR code on invoice (right side)
                </Label>
              </div>

              {settings.show_qr_code && settings.qr_code_content && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs md:text-sm font-medium mb-2">QR Code Preview:</p>
                  <div className="bg-white p-2 rounded inline-block">
                    <QRCodeWrapper 
                      value={settings.qr_code_content} 
                      size={100}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                <CardTitle className="text-lg md:text-xl">Tax Information</CardTitle>
              </div>
              <CardDescription className="text-sm">Tax identification and registration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax_id" className="text-sm">Tax ID / VAT Number</Label>
                <Input
                  id="tax_id"
                  value={settings.tax_id || ''}
                  onChange={(e) => updateField('tax_id', e.target.value)}
                  placeholder="Enter tax identification number"
                  className="text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_tax_id"
                  checked={settings.show_tax_id}
                  onCheckedChange={(checked) => updateField('show_tax_id', checked)}
                />
                <Label htmlFor="show_tax_id" className="cursor-pointer text-sm">
                  Show tax ID on invoice
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle className="text-lg md:text-xl">Bank Details</CardTitle>
              </div>
              <CardDescription className="text-sm">Banking information for payment reference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name" className="text-sm">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={settings.bank_name || ''}
                    onChange={(e) => updateField('bank_name', e.target.value)}
                    placeholder="Enter bank name"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_name" className="text-sm">Account Name</Label>
                  <Input
                    id="bank_account_name"
                    value={settings.bank_account_name || ''}
                    onChange={(e) => updateField('bank_account_name', e.target.value)}
                    placeholder="Enter account holder name"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_account_number" className="text-sm">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={settings.bank_account_number || ''}
                    onChange={(e) => updateField('bank_account_number', e.target.value)}
                    placeholder="Enter account number"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_routing_number" className="text-sm">Routing Number</Label>
                  <Input
                    id="bank_routing_number"
                    value={settings.bank_routing_number || ''}
                    onChange={(e) => updateField('bank_routing_number', e.target.value)}
                    placeholder="Enter routing number"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_bank_details"
                  checked={settings.show_bank_details}
                  onCheckedChange={(checked) => updateField('show_bank_details', checked)}
                />
                <Label htmlFor="show_bank_details" className="cursor-pointer text-sm">
                  Show bank details on invoice
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Additional Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-lg md:text-xl">Additional Content</CardTitle>
              </div>
              <CardDescription className="text-sm">Custom notes, terms, and footer text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom_notes" className="text-sm">Custom Notes</Label>
                <Textarea
                  id="custom_notes"
                  value={settings.custom_notes || ''}
                  onChange={(e) => updateField('custom_notes', e.target.value)}
                  placeholder="Add any custom notes or special instructions"
                  rows={3}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  These notes will appear below the order items
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions" className="text-sm">Terms and Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  value={settings.terms_and_conditions || ''}
                  onChange={(e) => updateField('terms_and_conditions', e.target.value)}
                  placeholder="Enter terms and conditions for invoices"
                  rows={4}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Legal terms and conditions displayed on invoices
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text" className="text-sm">Footer Text</Label>
                <Input
                  id="footer_text"
                  value={settings.footer_text || ''}
                  onChange={(e) => updateField('footer_text', e.target.value)}
                  placeholder="Thank you for shopping with us!"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Closing message at the bottom of the invoice
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button at Bottom */}
        <div className="flex justify-end pb-4">
          <Button onClick={handleSave} disabled={saving} size="lg" className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
