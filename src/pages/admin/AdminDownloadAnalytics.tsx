import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Globe, Monitor, TrendingUp, Users, Clock, ExternalLink } from 'lucide-react';
import { 
  getDownloadStats, 
  getDownloadHistory, 
  getGeographicDistribution, 
  getDeviceStats, 
  getConversionRate, 
  getPopularTimes, 
  getReferrerStats,
  refreshDownloadStats 
} from '@/db/api';
import type { DownloadStats, AppDownloadAnalytics } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminDownloadAnalytics() {
  const [stats, setStats] = useState<DownloadStats[]>([]);
  const [history, setHistory] = useState<AppDownloadAnalytics[]>([]);
  const [geoData, setGeoData] = useState<{ country: string; count: number }[]>([]);
  const [deviceStats, setDeviceStats] = useState<{
    byDeviceType: { device_type: string; count: number }[];
    byOS: { os_name: string; count: number }[];
    byBrowser: { browser_name: string; count: number }[];
  }>({ byDeviceType: [], byOS: [], byBrowser: [] });
  const [conversion, setConversion] = useState<{ views: number; downloads: number; rate: number }>({ views: 0, downloads: 0, rate: 0 });
  const [popularTimes, setPopularTimes] = useState<{ hour: number; count: number }[]>([]);
  const [referrers, setReferrers] = useState<{ referrer: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      await refreshDownloadStats();
      
      const [
        statsData,
        historyData,
        geoDataResult,
        deviceStatsResult,
        conversionResult,
        popularTimesResult,
        referrersResult
      ] = await Promise.all([
        getDownloadStats(),
        getDownloadHistory(50),
        getGeographicDistribution(),
        getDeviceStats(),
        getConversionRate(),
        getPopularTimes(),
        getReferrerStats()
      ]);

      setStats(statsData);
      setHistory(historyData);
      setGeoData(geoDataResult);
      setDeviceStats(deviceStatsResult);
      setConversion(conversionResult);
      setPopularTimes(popularTimesResult);
      setReferrers(referrersResult);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getTotalDownloads = () => {
    return stats.reduce((sum, stat) => sum + stat.total_downloads, 0);
  };

  const getTotalUniqueUsers = () => {
    return stats.reduce((sum, stat) => sum + stat.unique_users, 0);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Download Analytics</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Comprehensive insights into app download performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalDownloads().toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all platforms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalUniqueUsers().toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Individual downloaders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversion.rate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {conversion.downloads} / {conversion.views} views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{geoData.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Geographic reach</p>
            </CardContent>
          </Card>
        </div>

        {/* Downloads by Platform */}
        <Card>
          <CardHeader>
            <CardTitle>Downloads by Platform</CardTitle>
            <CardDescription>Performance breakdown across different platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.map((stat) => (
                <div key={stat.download_id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stat.title}</span>
                      <Badge variant="secondary">{stat.platform}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {stat.unique_users} unique users • {stat.countries_count} countries
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat.total_downloads.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">downloads</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Top countries by download count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.slice(0, 10).map((item, index) => (
                <div key={item.country} className="flex items-center gap-3">
                  <div className="w-8 text-center font-semibold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.country || 'Unknown'}</div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(item.count / geoData[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right font-semibold">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device & OS Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Device Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deviceStats.byDeviceType.map((item) => (
                  <div key={item.device_type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{item.device_type}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operating System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deviceStats.byOS.slice(0, 5).map((item) => (
                  <div key={item.os_name} className="flex items-center justify-between">
                    <span className="text-sm">{item.os_name}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Browser</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deviceStats.byBrowser.slice(0, 5).map((item) => (
                  <div key={item.browser_name} className="flex items-center justify-between">
                    <span className="text-sm">{item.browser_name}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Download Times */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Download Times</CardTitle>
            <CardDescription>Downloads by hour of day (24-hour format)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-48">
              {Array.from({ length: 24 }, (_, i) => {
                const hourData = popularTimes.find(t => t.hour === i);
                const count = hourData?.count || 0;
                const maxCount = Math.max(...popularTimes.map(t => t.count), 1);
                const height = (count / maxCount) * 100;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${height}%` }}
                      title={`${i}:00 - ${count} downloads`}
                    />
                    {i % 3 === 0 && (
                      <div className="text-xs text-muted-foreground">{i}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Traffic sources driving downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No referrer data available</p>
              ) : (
                referrers.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{item.referrer}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Download History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Downloads</CardTitle>
            <CardDescription>Latest 50 download events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="[&>div]:max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Time</TableHead>
                    <TableHead className="whitespace-nowrap">Platform</TableHead>
                    <TableHead className="whitespace-nowrap">Device</TableHead>
                    <TableHead className="whitespace-nowrap">OS</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No download history yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(item.downloaded_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary">{item.download_id}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap capitalize">
                          {item.device_type || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {item.os_name || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {item.country || 'Unknown'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={item.download_method === 'store_link' ? 'default' : 'secondary'}>
                            {item.download_method || 'unknown'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
