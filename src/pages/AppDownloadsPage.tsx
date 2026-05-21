import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Smartphone, Monitor, Apple } from 'lucide-react';
import { getAppDownloads, trackPageView, trackDownload } from '@/db/api';
import type { AppDownload } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceInfo, getUTMParams, getSessionId, getReferrer } from '@/lib/analytics';

export default function AppDownloadsPage() {
  const [downloads, setDownloads] = useState<AppDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const data = await getAppDownloads();
        setDownloads(data);
      } catch (error) {
        console.error('Failed to fetch app downloads:', error);
        toast.error('Failed to load app downloads');
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  useEffect(() => {
    const trackView = async () => {
      try {
        const deviceInfo = getDeviceInfo();
        const utmParams = getUTMParams();
        const sessionId = getSessionId();
        const referrer = getReferrer();

        await trackPageView({
          user_id: user?.id || null,
          session_id: sessionId,
          ip_address: null,
          country: null,
          region: null,
          city: null,
          device_type: deviceInfo.deviceType,
          os_name: deviceInfo.osName,
          os_version: deviceInfo.osVersion,
          browser_name: deviceInfo.browserName,
          browser_version: deviceInfo.browserVersion,
          screen_width: deviceInfo.screenWidth,
          screen_height: deviceInfo.screenHeight,
          referrer_url: referrer,
          ...utmParams,
          page_variant: null,
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackView();
  }, [user]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google_play':
        return <Smartphone className="h-8 w-8" />;
      case 'microsoft_store':
        return <Monitor className="h-8 w-8" />;
      case 'app_store':
        return <Apple className="h-8 w-8" />;
      case 'apk':
        return <Smartphone className="h-8 w-8" />;
      case 'exe':
        return <Monitor className="h-8 w-8" />;
      default:
        return <Download className="h-8 w-8" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'google_play':
        return 'Google Play Store';
      case 'microsoft_store':
        return 'Microsoft Store';
      case 'app_store':
        return 'Apple App Store';
      case 'apk':
        return 'Android APK';
      case 'exe':
        return 'Windows Installer';
      default:
        return platform;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'google_play':
        return 'from-green-500 to-green-600';
      case 'microsoft_store':
        return 'from-blue-500 to-blue-600';
      case 'app_store':
        return 'from-gray-700 to-gray-800';
      case 'apk':
        return 'from-emerald-500 to-emerald-600';
      case 'exe':
        return 'from-indigo-500 to-indigo-600';
      default:
        return 'from-primary to-primary/80';
    }
  };

  const handleDownload = async (download: AppDownload) => {
    const url = download.link_url || download.file_url;
    if (url) {
      try {
        const deviceInfo = getDeviceInfo();
        const utmParams = getUTMParams();
        const sessionId = getSessionId();
        const referrer = getReferrer();

        await trackDownload({
          download_id: download.id,
          user_id: user?.id || null,
          session_id: sessionId,
          ip_address: null,
          country: null,
          region: null,
          city: null,
          device_type: deviceInfo.deviceType,
          os_name: deviceInfo.osName,
          os_version: deviceInfo.osVersion,
          browser_name: deviceInfo.browserName,
          browser_version: deviceInfo.browserVersion,
          screen_width: deviceInfo.screenWidth,
          screen_height: deviceInfo.screenHeight,
          referrer_url: referrer,
          ...utmParams,
          page_variant: null,
          download_method: download.link_url ? 'store_link' : 'direct_file',
        });
      } catch (error) {
        console.error('Failed to track download:', error);
      }

      // For direct file downloads (exe, apk, dmg, etc.)
      if (download.file_url) {
        // Extract filename from URL or use default based on platform
        const urlParts = download.file_url.split('/');
        let filename = urlParts[urlParts.length - 1];
        
        // If no filename in URL, generate one based on platform
        if (!filename || !filename.includes('.')) {
          const extension = download.platform === 'exe' ? 'exe' : 
                          download.platform === 'apk' ? 'apk' : 
                          download.platform === 'app_store' ? 'dmg' : 'file';
          filename = `${download.title.replace(/\s+/g, '-')}.${extension}`;
        }
        
        // Create a temporary anchor element with download attribute
        const a = document.createElement('a');
        a.href = download.file_url;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast.success('Download started');
      } else if (download.link_url) {
        // For store links (App Store, Google Play, etc.)
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      toast.error('Download link not available');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-4 mx-auto" />
          <Skeleton className="h-6 w-96 mb-8 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">Download Our App</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Get the best shopping experience on your device. Download our app for Android, iOS, or Windows.
          </p>
        </div>
        {/* Downloads Grid */}
        {downloads.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No downloads available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {downloads.map((download) => (
              <Card key={download.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getPlatformColor(download.platform)} flex items-center justify-center text-white mb-4`}>
                    {getPlatformIcon(download.platform)}
                  </div>
                  <CardTitle className="text-xl text-balance">{download.title}</CardTitle>
                  <CardDescription className="text-pretty">
                    {download.description || getPlatformName(download.platform)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end space-y-3">
                  {download.version && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="font-medium">{download.version}</span>
                    </div>
                  )}
                  {download.file_size && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">{download.file_size}</span>
                    </div>
                  )}
                  <Button
                    onClick={() => handleDownload(download)}
                    className="w-full mt-auto"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Info Section */}

      </div>
    </MainLayout>
  );
}
