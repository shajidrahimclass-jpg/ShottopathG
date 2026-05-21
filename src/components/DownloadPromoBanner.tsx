import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor, Apple } from 'lucide-react';
import { getAppDownloads } from '@/db/api';
import type { AppDownload } from '@/types';
import { getRecommendedPlatform, isMobileDevice } from '@/lib/analytics';
import { Link } from 'react-router-dom';

export function DownloadPromoBanner() {
  const [downloads, setDownloads] = useState<AppDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedDownload, setRecommendedDownload] = useState<AppDownload | null>(null);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const data = await getAppDownloads();
        setDownloads(data);
        
        // Get recommended platform
        const platform = getRecommendedPlatform();
        const isMobile = isMobileDevice();
        
        // Find matching download
        let recommended: AppDownload | null = null;
        
        if (isMobile) {
          if (platform === 'android') {
            recommended = data.find(d => d.platform === 'google_play' || d.platform === 'apk') || null;
          } else if (platform === 'ios') {
            recommended = data.find(d => d.platform === 'app_store') || null;
          }
        } else {
          if (platform === 'windows') {
            recommended = data.find(d => d.platform === 'microsoft_store' || d.platform === 'exe') || null;
          }
        }
        
        setRecommendedDownload(recommended);
      } catch (error) {
        console.error('Failed to fetch downloads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  if (loading || !recommendedDownload) {
    return null;
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google_play':
      case 'apk':
        return <Smartphone className="h-8 w-8" />;
      case 'microsoft_store':
      case 'exe':
        return <Monitor className="h-8 w-8" />;
      case 'app_store':
        return <Apple className="h-8 w-8" />;
      default:
        return <Download className="h-8 w-8" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'google_play':
      case 'apk':
        return 'from-green-500 to-green-600';
      case 'microsoft_store':
      case 'exe':
        return 'from-blue-500 to-blue-600';
      case 'app_store':
        return 'from-gray-700 to-gray-800';
      default:
        return 'from-primary to-primary/80';
    }
  };

  const getDeviceType = () => {
    return isMobileDevice() ? 'mobile' : 'desktop';
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon */}
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${getPlatformColor(recommendedDownload.platform)} flex items-center justify-center text-white shrink-0 shadow-lg`}>
            {getPlatformIcon(recommendedDownload.platform)}
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-balance">
              Download Our {getDeviceType() === 'mobile' ? 'Mobile' : 'Desktop'} App
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4 text-pretty">
              Get the best shopping experience on your {getDeviceType() === 'mobile' ? 'phone' : 'computer'}. 
              {recommendedDownload.description || 'Download now and enjoy exclusive features!'}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <Link to="/app">
                <Button size="lg" className="w-full sm:w-auto">
                  <Download className="h-5 w-5 mr-2" />
                  Download Now
                </Button>
              </Link>
              {recommendedDownload.version && (
                <span className="text-sm text-muted-foreground">
                  Version {recommendedDownload.version}
                  {recommendedDownload.file_size && ` • ${recommendedDownload.file_size}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
