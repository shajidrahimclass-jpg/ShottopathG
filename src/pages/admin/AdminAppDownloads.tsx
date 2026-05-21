import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Upload, Download, Smartphone, Monitor, Apple } from 'lucide-react';
import { getAllAppDownloads, createAppDownload, updateAppDownload, deleteAppDownload, uploadAppFile } from '@/db/api';
import type { AppDownload, AppPlatform } from '@/types';
import { toast } from 'sonner';

export default function AdminAppDownloads() {
  const [downloads, setDownloads] = useState<AppDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<AppDownload | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    platform: 'google_play' as AppPlatform,
    title: '',
    description: '',
    link_url: '',
    file_url: '',
    version: '',
    file_size: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const data = await getAllAppDownloads();
      setDownloads(data);
    } catch (error) {
      console.error('Failed to fetch app downloads:', error);
      toast.error('Failed to load app downloads');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (download?: AppDownload) => {
    if (download) {
      setEditingDownload(download);
      setFormData({
        platform: download.platform,
        title: download.title,
        description: download.description || '',
        link_url: download.link_url || '',
        file_url: download.file_url || '',
        version: download.version || '',
        file_size: download.file_size || '',
        is_active: download.is_active,
        display_order: download.display_order,
      });
    } else {
      setEditingDownload(null);
      setFormData({
        platform: 'google_play',
        title: '',
        description: '',
        link_url: '',
        file_url: '',
        version: '',
        file_size: '',
        is_active: true,
        display_order: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      toast.error('File size must be less than 2GB');
      return;
    }

    // Auto-detect platform from file extension
    const fileName = file.name.toLowerCase();
    let detectedPlatform: AppPlatform = formData.platform;
    
    if (fileName.endsWith('.exe')) {
      detectedPlatform = 'exe';
    } else if (fileName.endsWith('.apk')) {
      detectedPlatform = 'apk';
    } else if (fileName.endsWith('.dmg') || fileName.endsWith('.pkg')) {
      detectedPlatform = 'app_store';
    }
    
    // Update platform if detected
    if (detectedPlatform !== formData.platform) {
      setFormData(prev => ({ ...prev, platform: detectedPlatform }));
      toast.info(`Platform auto-detected: ${detectedPlatform}`);
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const fileUrl = await uploadAppFile(file, detectedPlatform, (progress) => {
        setUploadProgress(progress);
      });
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFormData(prev => ({
        ...prev,
        file_url: fileUrl,
        file_size: `${fileSizeMB} MB`,
        platform: detectedPlatform,
      }));
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Failed to upload file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.link_url && !formData.file_url) {
      toast.error('Please provide either a link URL or upload a file');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDownload) {
        await updateAppDownload(editingDownload.id, formData);
        toast.success('App download updated successfully');
      } else {
        await createAppDownload(formData);
        toast.success('App download created successfully');
      }
      setDialogOpen(false);
      fetchDownloads();
    } catch (error) {
      console.error('Failed to save app download:', error);
      toast.error('Failed to save app download');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteAppDownload(deleteId);
      toast.success('App download deleted successfully');
      setDeleteDialogOpen(false);
      setDeleteId(null);
      fetchDownloads();
    } catch (error) {
      console.error('Failed to delete app download:', error);
      toast.error('Failed to delete app download');
    }
  };

  const handleToggleActive = async (download: AppDownload) => {
    try {
      await updateAppDownload(download.id, { is_active: !download.is_active });
      toast.success(`App download ${!download.is_active ? 'activated' : 'deactivated'}`);
      fetchDownloads();
    } catch (error) {
      console.error('Failed to update app download:', error);
      toast.error('Failed to update app download');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google_play':
        return <Smartphone className="h-4 w-4" />;
      case 'microsoft_store':
        return <Monitor className="h-4 w-4" />;
      case 'app_store':
        return <Apple className="h-4 w-4" />;
      case 'apk':
        return <Smartphone className="h-4 w-4" />;
      case 'exe':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'google_play':
        return 'Google Play';
      case 'microsoft_store':
        return 'Microsoft Store';
      case 'app_store':
        return 'App Store';
      case 'apk':
        return 'Android APK';
      case 'exe':
        return 'Windows EXE';
      default:
        return platform;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">App Downloads</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage app download links and files
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Download
          </Button>
        </div>

        {/* Downloads Table */}
        <Card>
          <CardHeader>
            <CardTitle>App Downloads</CardTitle>
            <CardDescription>Manage download links for different platforms</CardDescription>
          </CardHeader>
          <CardContent>
            {downloads.length === 0 ? (
              <div className="text-center py-12">
                <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No app downloads yet</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Download
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-x-auto">
                <Table className="[&>div]:max-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Platform</TableHead>
                      <TableHead className="whitespace-nowrap">Title</TableHead>
                      <TableHead className="whitespace-nowrap">Version</TableHead>
                      <TableHead className="whitespace-nowrap">Size</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Order</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {downloads.map((download) => (
                      <TableRow key={download.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(download.platform)}
                            <span>{getPlatformName(download.platform)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{download.title}</TableCell>
                        <TableCell className="whitespace-nowrap">{download.version || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{download.file_size || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={download.is_active}
                              onCheckedChange={() => handleToggleActive(download)}
                            />
                            <Badge variant={download.is_active ? 'default' : 'secondary'}>
                              {download.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{download.display_order}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(download)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteId(download.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDownload ? 'Edit' : 'Add'} App Download</DialogTitle>
              <DialogDescription>
                {editingDownload ? 'Update' : 'Create'} app download information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value as AppPlatform }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_play">Google Play Store</SelectItem>
                    <SelectItem value="microsoft_store">Microsoft Store</SelectItem>
                    <SelectItem value="app_store">Apple App Store</SelectItem>
                    <SelectItem value="apk">Android APK</SelectItem>
                    <SelectItem value="exe">Windows EXE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Download for Android"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the app"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_url">Store Link URL</Label>
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="https://play.google.com/store/apps/..."
                />
                <p className="text-xs text-muted-foreground">For app store links (Google Play, Microsoft Store, App Store)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload File (APK/EXE)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".apk,.exe"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <span className="text-sm text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </span>
                  )}
                </div>
                {uploading && (
                  <Progress value={uploadProgress} className="h-2" />
                )}
                {formData.file_url && (
                  <p className="text-xs text-green-600">File uploaded successfully</p>
                )}
                <p className="text-xs text-muted-foreground">For direct file downloads (max 2GB)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., 1.0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file_size">File Size</Label>
                  <Input
                    id="file_size"
                    value={formData.file_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_size: e.target.value }))}
                    placeholder="e.g., 25 MB"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number.parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || uploading}>
                  {submitting ? 'Saving...' : editingDownload ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete App Download</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this app download? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
