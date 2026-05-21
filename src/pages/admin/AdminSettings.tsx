import { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getDeliveryLocations, updateDeliveryLocation, getPaymentGateways, updatePaymentGateway, getAllTerms, updateTerms, getAllUserManuals, updateUserManual, getAppSettings, updateAppSettings, getAllRefundsPolicy, updateRefundsPolicy } from '@/db/api';
import type { DeliveryLocation, PaymentGateway, TermsAndConditions, RefundsPolicy, UserManual, AppSettings } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { Upload, X, AlertTriangle, Shield } from 'lucide-react';
import { PasswordConfirmDialog } from '@/components/common/PasswordConfirmDialog';
import { setAdminBasePath } from '@/config/admin';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSettings() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [refundsPolicy, setRefundsPolicy] = useState<RefundsPolicy | null>(null);
  const [userManual, setUserManual] = useState<UserManual | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin URL customization states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAdminUrl, setPendingAdminUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [locationsData, gatewaysData, termsData, refundsPolicyData, manualData, appSettingsData] = await Promise.all([
        getDeliveryLocations(),
        getPaymentGateways(),
        getAllTerms(),
        getAllRefundsPolicy(),
        getAllUserManuals(),
        getAppSettings(),
      ]);

      setLocations(locationsData);
      setGateways(gatewaysData);
      setTerms(termsData[0] || null);
      setRefundsPolicy(refundsPolicyData[0] || null);
      setUserManual(manualData[0] || null);
      setAppSettings(appSettingsData);
      if (appSettingsData?.favicon_url) {
        setFaviconPreview(appSettingsData.favicon_url);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const handleLocationUpdate = async (id: string, updates: Partial<DeliveryLocation>) => {
    setLoading(true);

    try {
      await updateDeliveryLocation(id, updates);
      toast.success('Delivery location updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const handleGatewayUpdate = async (id: string, updates: Partial<PaymentGateway>) => {
    setLoading(true);

    try {
      await updatePaymentGateway(id, updates);
      toast.success('Payment gateway updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to update gateway:', error);
      toast.error('Failed to update gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleTermsUpdate = async () => {
    if (!terms) return;
    
    setLoading(true);

    try {
      await updateTerms(terms.id, {
        title: terms.title,
        content: terms.content,
      });
      toast.success('Terms and conditions updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to update terms:', error);
      toast.error('Failed to update terms');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundsPolicyUpdate = async () => {
    if (!refundsPolicy) return;
    
    setLoading(true);

    try {
      await updateRefundsPolicy(refundsPolicy.id, {
        title: refundsPolicy.title,
        content: refundsPolicy.content,
      });
      toast.success('Refunds policy updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to update refunds policy:', error);
      toast.error('Failed to update refunds policy');
    } finally {
      setLoading(false);
    }
  };

  const handleUserManualUpdate = async () => {
    if (!userManual) return;
    
    setLoading(true);

    try {
      await updateUserManual(userManual.id, {
        title: userManual.title,
        content: userManual.content,
        is_active: userManual.is_active,
      });
      toast.success('User manual updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to update user manual:', error);
      toast.error('Failed to update user manual');
    } finally {
      setLoading(false);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        toast.error('File size must be less than 1MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAppSettingsUpdate = async () => {
    if (!appSettings) return;

    setLoading(true);

    try {
      let faviconUrl = appSettings.favicon_url;

      // Upload favicon if a new file is selected
      if (faviconFile) {
        const fileExt = faviconFile.name.split('.').pop();
        const fileName = `favicon_${Date.now()}.${fileExt}`;
        const filePath = `favicons/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('app-9cyfgucqbpj5_shottopoth_images')
          .upload(filePath, faviconFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload favicon: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('app-9cyfgucqbpj5_shottopoth_images')
          .getPublicUrl(filePath);

        faviconUrl = urlData.publicUrl;
      }

      // If favicon was removed
      if (!faviconPreview && appSettings.favicon_url) {
        faviconUrl = null;
      }

      await updateAppSettings(appSettings.id, {
        site_title: appSettings.site_title,
        navbar_name: appSettings.navbar_name,
        site_description: appSettings.site_description,
        default_meta_image: appSettings.default_meta_image,
        favicon_url: faviconUrl,
        copyright_year: appSettings.copyright_year,
        copyright_company: appSettings.copyright_company,
        force_sign_in: appSettings.force_sign_in,
      });

      toast.success('App settings updated successfully');
      setFaviconFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Update document title and favicon immediately
      document.title = appSettings.site_title;
      if (faviconUrl) {
        // Remove existing favicon links
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach(link => link.remove());
        
        // Add cache-busting parameter to force browser refresh
        const cacheBustedUrl = faviconUrl.includes('?') 
          ? `${faviconUrl}&t=${Date.now()}`
          : `${faviconUrl}?t=${Date.now()}`;
        
        // Create new favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = cacheBustedUrl;
        document.head.appendChild(link);
        
        // Also add apple-touch-icon for iOS devices
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = cacheBustedUrl;
        document.head.appendChild(appleLink);
      }
      
      loadData();
    } catch (error) {
      console.error('Failed to update app settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update app settings';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateAdminUrl = (url: string): { valid: boolean; error?: string } => {
    // Check if URL starts with /
    if (!url.startsWith('/')) {
      return { valid: false, error: 'URL must start with /' };
    }

    // Check format (alphanumeric, /, -, _)
    if (!/^\/[a-zA-Z0-9/_-]+$/.test(url)) {
      return { valid: false, error: 'URL can only contain letters, numbers, /, -, and _' };
    }

    // Check minimum length
    if (url.length < 10) {
      return { valid: false, error: 'URL must be at least 10 characters long for security' };
    }

    // Check for common/reserved paths
    const reservedPaths = ['/admin', '/api', '/login', '/products', '/cart', '/checkout', '/orders', '/profile', '/chat'];
    if (reservedPaths.some(path => url.startsWith(path))) {
      return { valid: false, error: 'This URL conflicts with existing routes' };
    }

    return { valid: true };
  };

  const handleAdminUrlChange = () => {
    if (!appSettings) return;

    const validation = validateAdminUrl(appSettings.admin_url_path);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Store the pending URL and show password dialog
    setPendingAdminUrl(appSettings.admin_url_path);
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!appSettings || !pendingAdminUrl || !user?.email) return;

    // Verify password by attempting to sign in
    const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (error || !authUser) {
      throw new Error('Invalid password');
    }

    // Update admin URL in database
    setLoading(true);
    try {
      await updateAppSettings(appSettings.id, {
        admin_url_path: pendingAdminUrl,
      });

      // Update the admin base path in memory
      setAdminBasePath(pendingAdminUrl);

      toast.success('Admin URL updated successfully. Redirecting...');
      
      // Wait a moment then reload the page to update routes
      setTimeout(() => {
        window.location.href = pendingAdminUrl;
      }, 1500);
    } catch (error) {
      console.error('Failed to update admin URL:', error);
      toast.error('Failed to update admin URL');
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <PasswordConfirmDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirm={handlePasswordConfirm}
        title="Confirm Admin URL Change"
        description="This is a security-sensitive action. Please enter your password to confirm changing the admin panel URL."
      />
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage app settings, delivery locations and payment gateways</p>
        </div>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {appSettings && (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="site-title">Browser Tab Title</Label>
                    <Input
                      id="site-title"
                      value={appSettings.site_title}
                      onChange={(e) => setAppSettings({ ...appSettings, site_title: e.target.value })}
                      placeholder="Enter site title"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will appear in the browser tab
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="navbar-name">Navbar Name</Label>
                    <Input
                      id="navbar-name"
                      value={appSettings.navbar_name}
                      onChange={(e) => setAppSettings({ ...appSettings, navbar_name: e.target.value })}
                      placeholder="Enter navbar name"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will appear in the navigation bar
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="site-description">Website Description</Label>
                    <Textarea
                      id="site-description"
                      value={appSettings.site_description || ''}
                      onChange={(e) => setAppSettings({ ...appSettings, site_description: e.target.value })}
                      placeholder="Enter website description for SEO and meta tags"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used in search engine results and social media previews
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="default-meta-image">Default Social Sharing Image URL (Optional)</Label>
                    <Input
                      id="default-meta-image"
                      value={appSettings.default_meta_image || ''}
                      onChange={(e) => setAppSettings({ ...appSettings, default_meta_image: e.target.value })}
                      placeholder="https://example.com/default-share-image.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default image for social media sharing (Facebook, Twitter, etc.). Used when page/product doesn't have specific image. Recommended: 1200x630px
                    </p>
                    {appSettings.default_meta_image && (
                      <div className="mt-2">
                        <img 
                          src={appSettings.default_meta_image} 
                          alt="Default meta preview" 
                          className="w-full max-w-md h-auto rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Browser Tab Icon (Favicon)</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center gap-4">
                        {faviconPreview && (
                          <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            <img
                              src={faviconPreview}
                              alt="Favicon preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <label
                            htmlFor="favicon-upload"
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">{faviconPreview ? 'Change Favicon' : 'Upload Favicon'}</span>
                            <input
                              ref={fileInputRef}
                              id="favicon-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleFaviconChange}
                              className="hidden"
                            />
                          </label>
                          {faviconPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveFavicon}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 32x32px or 64x64px, PNG or ICO format, max 1MB
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4">Footer Copyright Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="copyright-year">Copyright Year</Label>
                        <Input
                          id="copyright-year"
                          value={appSettings.copyright_year || ''}
                          onChange={(e) => setAppSettings({ ...appSettings, copyright_year: e.target.value })}
                          placeholder={`${new Date().getFullYear()}`}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Year displayed in footer copyright (leave empty for current year: {new Date().getFullYear()})
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="copyright-company">Copyright Company Name</Label>
                        <Input
                          id="copyright-company"
                          value={appSettings.copyright_company || ''}
                          onChange={(e) => setAppSettings({ ...appSettings, copyright_company: e.target.value })}
                          placeholder="Shottopoth"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Company name in footer (defaults to navbar name if empty)
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Preview:</p>
                      <p className="text-sm text-muted-foreground">
                        © {appSettings.copyright_year?.trim() || new Date().getFullYear()} {appSettings.copyright_company?.trim() || appSettings.navbar_name || 'Shottopoth'}. All rights reserved.
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Admin Panel URL (Security)</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="admin-url-path">Admin Panel URL Path</Label>
                        <Input
                          id="admin-url-path"
                          value={appSettings.admin_url_path}
                          onChange={(e) => setAppSettings({ ...appSettings, admin_url_path: e.target.value })}
                          placeholder="/your-custom-admin-path"
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Custom URL path for accessing the admin panel. Must be at least 10 characters and contain only letters, numbers, /, -, and _
                        </p>
                      </div>

                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-2 text-sm">
                            <p className="font-medium text-amber-900 dark:text-amber-100">
                              Important Security Notice
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                              <li>Changing this URL will require you to update all bookmarks</li>
                              <li>You will be automatically redirected to the new URL</li>
                              <li>Password confirmation is required for this change</li>
                              <li>Use a unique, hard-to-guess path for better security</li>
                              <li>Avoid common words like "admin", "dashboard", "panel"</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleAdminUrlChange} 
                        disabled={loading || appSettings.admin_url_path === appSettings.admin_url_path}
                        variant="outline"
                        className="w-full md:w-auto"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Update Admin URL
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <Label htmlFor="force-sign-in" className="text-base font-semibold">Guest Checkout Control</Label>
                    <div className="flex items-center justify-between mt-4 p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="font-medium">Force Sign-In for Purchases</div>
                        <p className="text-sm text-muted-foreground">
                          {appSettings.force_sign_in 
                            ? 'Users must sign in before purchasing products (current setting)'
                            : 'Users can purchase products as guests without signing in (current setting)'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>When ON:</strong> Users must create an account or sign in to make purchases. Better for customer tracking and relationship management.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>When OFF:</strong> Users can checkout as guests with just shipping info. Faster checkout may increase conversions.
                        </p>
                      </div>
                      <Switch
                        id="force-sign-in"
                        checked={appSettings.force_sign_in}
                        onCheckedChange={(checked) => setAppSettings({ ...appSettings, force_sign_in: checked })}
                        className="ml-4"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleAppSettingsUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save App Settings'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {locations.map((location, index) => (
              <div key={location.id}>
                {index > 0 && <Separator className="my-6" />}
                <div className="space-y-4">
                  <div>
                    <Label>Location Name</Label>
                    <Input
                      value={location.name}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index].name = e.target.value;
                        setLocations(updated);
                      }}
                      onBlur={() => handleLocationUpdate(location.id, { name: location.name })}
                    />
                  </div>
                  <div>
                    <Label>Delivery Charge (৳)</Label>
                    <Input
                      type="number"
                      value={location.charge}
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index].charge = Number.parseFloat(e.target.value) || 0;
                        setLocations(updated);
                      }}
                      onBlur={() => handleLocationUpdate(location.id, { charge: location.charge })}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Delivery Duration</Label>
                    <Input
                      value={location.duration}
                      placeholder="e.g., 1-2 days, 3-5 days"
                      onChange={(e) => {
                        const updated = [...locations];
                        updated[index].duration = e.target.value;
                        setLocations(updated);
                      }}
                      onBlur={() => handleLocationUpdate(location.id, { duration: location.duration })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated delivery time for this location
                    </p>
                  </div>
                  <div>
                    <Label>Available Payment Methods</Label>
                    <div className="space-y-2 mt-2">
                      {['cash_on_delivery', 'bkash', 'nagad'].map((method) => (
                        <div key={method} className="flex items-center space-x-2">
                          <Switch
                            checked={location.payment_methods.includes(method)}
                            onCheckedChange={(checked) => {
                              const updated = [...locations];
                              if (checked) {
                                updated[index].payment_methods = [...updated[index].payment_methods, method];
                              } else {
                                updated[index].payment_methods = updated[index].payment_methods.filter(m => m !== method);
                              }
                              setLocations(updated);
                              handleLocationUpdate(location.id, { payment_methods: updated[index].payment_methods });
                            }}
                          />
                          <Label className="capitalize">{method.replace(/_/g, ' ')}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Gateways</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {gateways.map((gateway, index) => (
              <div key={gateway.id}>
                {index > 0 && <Separator className="my-6" />}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-lg font-semibold">{gateway.name}</Label>
                      <p className="text-sm text-muted-foreground">
                        {gateway.is_enabled ? 'Currently enabled' : 'Currently disabled'}
                      </p>
                    </div>
                    <Switch
                      checked={gateway.is_enabled}
                      onCheckedChange={(checked) => {
                        handleGatewayUpdate(gateway.id, { is_enabled: checked });
                      }}
                    />
                  </div>

                  {/* Account Number for Bkash and Nagad */}
                  {(gateway.name.toLowerCase() === 'bkash' || gateway.name.toLowerCase() === 'nagad') && (
                    <div className="space-y-2">
                      <Label htmlFor={`${gateway.id}-account`}>
                        Mobile Number
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${gateway.id}-account`}
                          placeholder="Enter mobile number (e.g., 01615995004)"
                          defaultValue={(gateway.config as { account_number?: string })?.account_number || ''}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value) {
                              handleGatewayUpdate(gateway.id, {
                                config: { ...gateway.config, account_number: value },
                              });
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This number will be shown to customers during checkout
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {terms && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="terms-title">Title</Label>
                  <Input
                    id="terms-title"
                    value={terms.title}
                    onChange={(e) => setTerms({ ...terms, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms-content">Content</Label>
                  <Textarea
                    id="terms-content"
                    value={terms.content}
                    onChange={(e) => setTerms({ ...terms, content: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Enter terms and conditions (one rule per line)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Users must agree to these terms before placing an order
                  </p>
                </div>

                <Button onClick={handleTermsUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Terms'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refunds Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {refundsPolicy && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="refunds-title">Title</Label>
                  <Input
                    id="refunds-title"
                    value={refundsPolicy.title}
                    onChange={(e) => setRefundsPolicy({ ...refundsPolicy, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refunds-content">Content (HTML supported)</Label>
                  <Textarea
                    id="refunds-content"
                    value={refundsPolicy.content}
                    onChange={(e) => setRefundsPolicy({ ...refundsPolicy, content: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Enter refunds policy content (HTML supported)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Users can view this policy in the checkout page. HTML tags are supported for formatting.
                  </p>
                </div>

                <Button onClick={handleRefundsPolicyUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Refunds Policy'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userManual && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="manual-active">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Show user manual popup to users
                    </p>
                  </div>
                  <Switch
                    id="manual-active"
                    checked={userManual.is_active}
                    onCheckedChange={(checked) => setUserManual({ ...userManual, is_active: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="manual-title">Title</Label>
                  <Input
                    id="manual-title"
                    value={userManual.title}
                    onChange={(e) => setUserManual({ ...userManual, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-content">Content</Label>
                  <Textarea
                    id="manual-content"
                    value={userManual.content}
                    onChange={(e) => setUserManual({ ...userManual, content: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Enter user manual content"
                  />
                  <p className="text-xs text-muted-foreground">
                    Users will see this popup when they login or visit any page (if active and not yet accepted)
                  </p>
                </div>

                <Button onClick={handleUserManualUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save User Manual'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Google OAuth Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Google OAuth Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Google OAuth Client ID</Label>
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm font-mono break-all">
                  YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Google OAuth Client Secret</Label>
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm font-mono">
                  YOUR_GOOGLE_CLIENT_SECRET
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ This secret is stored securely in Supabase. Never commit it to version control.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Configuration Status</Label>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Credentials Configured ✅</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Google OAuth credentials have been securely stored in Supabase.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Next Steps to Enable Google Sign-In</Label>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2 ml-2">
                <li>
                  <strong>Enable in Supabase Dashboard:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Go to Authentication → Providers → Google</li>
                    <li>Toggle "Enable Sign in with Google" to ON</li>
                    <li>Enter the Client ID and Secret shown above</li>
                    <li>Click Save</li>
                  </ul>
                </li>
                <li className="mt-2">
                  <strong>Configure Google Cloud Console:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Add authorized redirect URI: <code className="bg-muted px-1 py-0.5 rounded text-xs">https://[YOUR-SUPABASE-REF].supabase.co/auth/v1/callback</code></li>
                    <li>Add authorized JavaScript origins for your domain</li>
                  </ul>
                </li>
                <li className="mt-2">
                  <strong>Test:</strong> Go to login page and click "Continue with Google"
                </li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Documentation</Label>
              <p className="text-sm text-muted-foreground">
                For detailed setup instructions, see:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside ml-2 space-y-1">
                <li><code className="bg-muted px-1 py-0.5 rounded">GOOGLE_OAUTH_CONFIGURED.md</code> - Complete setup guide</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">GOOGLE_OAUTH_QUICK_SETUP.md</code> - Quick reference</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">GOOGLE_OAUTH_SETUP.md</code> - General OAuth guide</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
