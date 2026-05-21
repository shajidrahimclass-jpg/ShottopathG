import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { getAppSettings, updateAppSettings } from '@/db/api';
import type { AppSettings } from '@/types';
import { toast } from 'sonner';
import { Globe, Facebook, Twitter, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminSEO() {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getAppSettings();
      setAppSettings(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load SEO settings');
    }
  };

  const handleSave = async () => {
    if (!appSettings) return;

    setLoading(true);
    try {
      await updateAppSettings(appSettings.id, {
        site_description: appSettings.site_description,
        default_meta_image: appSettings.default_meta_image,
      });

      toast.success('SEO settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update SEO settings');
    } finally {
      setLoading(false);
    }
  };

  if (!appSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading SEO settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const siteUrl = window.location.origin;
  const previewTitle = appSettings.site_title || 'Shottopoth';
  const previewDescription = appSettings.site_description || 'Your trusted e-commerce platform';
  const previewImage = appSettings.default_meta_image || '';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 md:h-8 md:w-8" />
            SEO & Social Media Settings
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Manage how your website appears in search engines and social media
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Settings Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Engine Optimization
                </CardTitle>
                <CardDescription>
                  Optimize your website for search engines like Google
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-description">Website Description *</Label>
                  <Textarea
                    id="site-description"
                    value={appSettings.site_description || ''}
                    onChange={(e) => setAppSettings({ ...appSettings, site_description: e.target.value })}
                    placeholder="Enter a compelling description of your website (150-160 characters recommended)"
                    rows={4}
                    maxLength={160}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-muted-foreground">
                      This appears in Google search results
                    </p>
                    <p className={`font-medium ${(appSettings.site_description?.length || 0) > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {appSettings.site_description?.length || 0}/160
                    </p>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>SEO Tip:</strong> Include your main keywords naturally. Keep it between 150-160 characters for best results.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5" />
                  Social Media Sharing
                </CardTitle>
                <CardDescription>
                  Control how your website looks when shared on social platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-meta-image">Default Sharing Image URL</Label>
                  <Input
                    id="default-meta-image"
                    value={appSettings.default_meta_image || ''}
                    onChange={(e) => setAppSettings({ ...appSettings, default_meta_image: e.target.value })}
                    placeholder="https://example.com/share-image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1200x630 pixels (Facebook, Twitter, LinkedIn)
                  </p>
                </div>

                {appSettings.default_meta_image && (
                  <div className="space-y-2">
                    <Label>Image Preview</Label>
                    <div className="border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={appSettings.default_meta_image}
                        alt="Meta preview"
                        className="w-full h-auto"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.alt = 'Failed to load image';
                          e.currentTarget.className = 'w-full h-32 flex items-center justify-center text-muted-foreground';
                        }}
                      />
                    </div>
                  </div>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> This image is used as fallback when pages/products don't have specific images set.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={loading} className="w-full" size="lg">
              {loading ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  Facebook Preview
                </CardTitle>
                <CardDescription>
                  How your website will appear when shared on Facebook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-card">
                  {previewImage && (
                    <div className="aspect-[1.91/1] bg-muted relative">
                      <img
                        src={previewImage}
                        alt="Facebook preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-3 bg-muted/30 border-t">
                    <p className="text-xs text-muted-foreground uppercase mb-1">{siteUrl}</p>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{previewTitle}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{previewDescription}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="h-5 w-5 text-blue-400" />
                  Twitter Preview
                </CardTitle>
                <CardDescription>
                  How your website will appear when shared on Twitter/X
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-xl overflow-hidden bg-card">
                  {previewImage && (
                    <div className="aspect-[2/1] bg-muted relative">
                      <img
                        src={previewImage}
                        alt="Twitter preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-3 border-t">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{previewTitle}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{previewDescription}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {siteUrl.replace('https://', '').replace('http://', '')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Google Search Preview
                </CardTitle>
                <CardDescription>
                  How your website appears in Google search results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-blue-600 hover:underline cursor-pointer">{previewTitle}</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-500">{siteUrl}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{previewDescription}</p>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Testing Tools:</strong> Use{' '}
                <a
                  href="https://developers.facebook.com/tools/debug/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Facebook Debugger
                </a>
                {' '}and{' '}
                <a
                  href="https://cards-dev.twitter.com/validator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twitter Card Validator
                </a>
                {' '}to test your meta tags.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
