import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getBanners, createBanner, updateBanner, deleteBanner } from '@/db/api';
import type { Banner } from '@/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    link: '',
    display_order: 0,
    is_active: true,
    page: 'home' as 'home' | 'products',
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to load banners:', error);
      toast.error('Failed to load banners');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url.trim()) {
      toast.error('Please provide an image URL or upload an image');
      return;
    }

    try {
      setLoading(true);
      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
        toast.success('Banner updated successfully');
      } else {
        await createBanner(formData);
        toast.success('Banner created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadBanners();
    } catch (error) {
      console.error('Failed to save banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url,
      title: banner.title || '',
      link: banner.link || '',
      display_order: banner.display_order,
      is_active: banner.is_active,
      page: banner.page,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await deleteBanner(id);
      toast.success('Banner deleted successfully');
      loadBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const resetForm = () => {
    setFormData({
      image_url: '',
      title: '',
      link: '',
      display_order: 0,
      is_active: true,
      page: 'home',
    });
    setEditingBanner(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Banner Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage homepage carousel banners</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>

        {/* Desktop Table View */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>All Banners</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Preview</TableHead>
                    <TableHead className="min-w-[150px]">Title</TableHead>
                    <TableHead className="min-w-[100px]">Page</TableHead>
                    <TableHead className="min-w-[80px]">Order</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {banners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No banners found. Add your first banner to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="w-24 h-16 bg-background rounded border flex items-center justify-center p-1">
                          <img
                            src={banner.image_url}
                            alt={banner.title || 'Banner'}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {banner.title || <span className="text-muted-foreground">No title</span>}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{banner.page === 'home' ? 'Home' : 'Products'}</span>
                      </TableCell>
                      <TableCell>{banner.display_order}</TableCell>
                      <TableCell>
                        <span className={banner.is_active ? 'text-success' : 'text-muted-foreground'}>
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(banner.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {banners.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No banners found. Add your first banner to get started.
              </CardContent>
            </Card>
          ) : (
            banners.map((banner) => (
              <Card key={banner.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="w-full h-32 bg-background rounded border flex items-center justify-center p-2">
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">
                      {banner.title || <span className="text-muted-foreground">No title</span>}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Page</p>
                        <p className="font-medium capitalize">{banner.page === 'home' ? 'Home' : 'Products'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Order</p>
                        <p className="font-medium">{banner.display_order}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className={`font-medium ${banner.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add/Edit Banner Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
              <DialogDescription>
                {editingBanner ? 'Update banner details' : 'Add a new banner to the homepage carousel'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Banner Image *</Label>
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setFormData({ ...formData, image_url: url });
                    }}
                    currentImage={formData.image_url}
                    folder="banners"
                    label="Upload Banner Image"
                  />
                  <p className="text-sm text-muted-foreground">
                    Banner image for homepage or products page (recommended size: 1920x600px)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="Banner title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Link (Optional)</Label>
                  <Input
                    id="link"
                    placeholder="https://example.com/product"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page">Page</Label>
                  <Select
                    value={formData.page}
                    onValueChange={(value: 'home' | 'products') => setFormData({ ...formData, page: value })}
                  >
                    <SelectTrigger id="page">
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home Page</SelectItem>
                      <SelectItem value="products">Products Page</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose which page this banner will appear on
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Lower numbers appear first in the carousel
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Add Banner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
