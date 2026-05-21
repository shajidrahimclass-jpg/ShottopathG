import { useEffect, useState } from 'react';
import { adminPath } from '@/config/admin';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ImageUpload';
import { getProduct, createProduct, updateProduct, getCategories } from '@/db/api';
import type { Product, Category } from '@/types';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminProductEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    min_quantity: '1',
    image_url: '',
    thumbnail: '',
    pc_thumbnail: '',
    mobile_thumbnail: '',
    videos: [] as string[],
    pc_images: [] as string[],
    mobile_images: [] as string[],
    category: '',
    is_active: true,
    is_gift_card: false,
    sizes: [] as string[],
    colors: [] as string[],
    pieces: '',
    user_manual: '',
    meta_description: '',
    meta_image: '',
  });
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newPcImageUrl, setNewPcImageUrl] = useState('');
  const [newMobileImageUrl, setNewMobileImageUrl] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    loadCategories();
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const product = await getProduct(productId);
      if (!product) {
        toast.error('Product not found');
        navigate(adminPath('products'));
        return;
      }
      setFormData({
        name: product.name,
        slug: product.slug || '',
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        min_quantity: product.min_quantity?.toString() || '1',
        image_url: product.image_url || '',
        thumbnail: product.thumbnail || '',
        pc_thumbnail: product.pc_thumbnail || '',
        mobile_thumbnail: product.mobile_thumbnail || '',
        videos: product.videos || [],
        pc_images: product.pc_images || [],
        mobile_images: product.mobile_images || [],
        category: product.category || '',
        is_active: product.is_active,
        is_gift_card: product.is_gift_card || false,
        sizes: product.sizes || [],
        colors: product.colors || [],
        pieces: product.pieces?.toString() || '',
        user_manual: product.user_manual || '',
        meta_description: product.meta_description || '',
        meta_image: product.meta_image || '',
      });
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product');
      navigate(adminPath('products'));
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    const newSlug = generateSlug(name);
    console.log('Name changed to:', name, '→ Generated slug:', newSlug);
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || newSlug,
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.stock || !formData.min_quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const minQty = parseInt(formData.min_quantity);
    if (minQty < 1) {
      toast.error('Minimum quantity must be at least 1');
      return;
    }

    try {
      setLoading(true);
      const productData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        min_quantity: minQty,
        image_url: formData.image_url || null,
        thumbnail: formData.thumbnail || null,
        pc_thumbnail: formData.pc_thumbnail || null,
        mobile_thumbnail: formData.mobile_thumbnail || null,
        videos: formData.videos,
        pc_images: formData.pc_images,
        mobile_images: formData.mobile_images,
        category: formData.category || null,
        is_active: formData.is_active,
        is_gift_card: formData.is_gift_card,
        sizes: formData.sizes,
        colors: formData.colors,
        pieces: formData.pieces ? parseInt(formData.pieces) : null,
        user_manual: formData.user_manual || null,
        meta_description: formData.meta_description || null,
        meta_image: formData.meta_image || null,
      };

      console.log('Saving product with data:', productData);

      if (id) {
        await updateProduct(id, productData);
        toast.success('Product updated successfully');
      } else {
        const result = await createProduct(productData);
        console.log('Product created:', result);
        toast.success('Product created successfully');
      }

      // Dispatch stock update event for real-time updates
      window.dispatchEvent(new Event('stockUpdated'));

      navigate(adminPath('products'));
    } catch (error: any) {
      console.error('Failed to save product:', error);
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        toast.error('A product with this slug already exists. Please use a different slug.');
      } else {
        toast.error('Failed to save product: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const addVideo = () => {
    if (newVideoUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, newVideoUrl.trim()],
      }));
      setNewVideoUrl('');
    }
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const addPcImage = () => {
    if (newPcImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        pc_images: [...prev.pc_images, newPcImageUrl.trim()],
      }));
      setNewPcImageUrl('');
    }
  };

  const removePcImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pc_images: prev.pc_images.filter((_, i) => i !== index),
    }));
  };

  const addMobileImage = () => {
    if (newMobileImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        mobile_images: [...prev.mobile_images, newMobileImageUrl.trim()],
      }));
      setNewMobileImageUrl('');
    }
  };

  const removeMobileImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mobile_images: prev.mobile_images.filter((_, i) => i !== index),
    }));
  };

  const addSize = () => {
    if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize.trim()],
      }));
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== size),
    }));
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()],
      }));
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color),
    }));
  };

  if (loading && id) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(adminPath('products'))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{id ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {id ? 'Update product details' : 'Create a new product'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 md:gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL-friendly name) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="product-slug"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Used in product URLs. Auto-generated from name if left empty.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_manual">Product User Manual (Optional)</Label>
                  <Textarea
                    id="user_manual"
                    value={formData.user_manual}
                    onChange={(e) => setFormData({ ...formData, user_manual: e.target.value })}
                    placeholder="Enter product user manual or usage instructions"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    If provided, users must read and accept this manual before viewing product details
                  </p>
                </div>

                {/* SEO & Social Media Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-lg">SEO & Social Media</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description (Optional)</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      placeholder="Enter SEO meta description (150-160 characters recommended)"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for search engines and social media previews. {formData.meta_description.length}/160 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_image">Social Sharing Image URL (Optional)</Label>
                    <Input
                      id="meta_image"
                      value={formData.meta_image}
                      onChange={(e) => setFormData({ ...formData, meta_image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Image shown when product is shared on Facebook, Twitter, etc. (1200x630px recommended)
                    </p>
                    {formData.meta_image && (
                      <div className="mt-2">
                        <img 
                          src={formData.meta_image} 
                          alt="Meta preview" 
                          className="w-full max-w-md h-auto rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (৳) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-quantity">Minimum Order Quantity *</Label>
                    <Input
                      id="min-quantity"
                      type="number"
                      min="1"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                      placeholder="1"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum number of items customers must purchase
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pieces">Pieces per Pack</Label>
                    <Input
                      id="pieces"
                      type="number"
                      min="1"
                      value={formData.pieces}
                      onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active (visible to customers)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_gift_card"
                    checked={formData.is_gift_card}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_gift_card: checked })}
                  />
                  <Label htmlFor="is_gift_card">Gift Card Product</Label>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Main Product Image *</Label>
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        image_url: url,
                      }));
                    }}
                    currentImage={formData.image_url}
                    folder="products"
                    label="Upload Main Image"
                  />
                  <p className="text-sm text-muted-foreground">
                    Main product image displayed on product cards and detail page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Product Thumbnail (Optional - Fallback)</Label>
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        thumbnail: url,
                      }));
                    }}
                    currentImage={formData.thumbnail}
                    folder="products"
                    label="Upload Thumbnail"
                  />
                  <p className="text-sm text-muted-foreground">
                    General thumbnail image (fallback if device-specific thumbnails not set)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>PC Thumbnail (Recommended)</Label>
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        pc_thumbnail: url,
                      }));
                    }}
                    currentImage={formData.pc_thumbnail}
                    folder="products/pc"
                    label="Upload PC Thumbnail"
                  />
                  <p className="text-sm text-muted-foreground">
                    Thumbnail optimized for desktop display (recommended size: 800x800px)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Mobile Thumbnail (Recommended)</Label>
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        mobile_thumbnail: url,
                      }));
                    }}
                    currentImage={formData.mobile_thumbnail}
                    folder="products/mobile"
                    label="Upload Mobile Thumbnail"
                  />
                  <p className="text-sm text-muted-foreground">
                    Thumbnail optimized for mobile display (recommended size: 400x400px)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Videos */}
            <Card>
              <CardHeader>
                <CardTitle>Product Videos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Video URLs</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVideo())}
                    />
                    <Button type="button" onClick={addVideo}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.videos.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.videos.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <span className="flex-1 text-sm truncate">{url}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeVideo(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Device-Specific Images */}
            <Card>
              <CardHeader>
                <CardTitle>Device-Specific Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>PC/Desktop Images</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload images optimized for desktop display (recommended: 1920x1080px or larger)
                  </p>
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        pc_images: [...prev.pc_images, url],
                      }));
                    }}
                    folder="products/pc"
                    label="Upload PC Image"
                  />
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newPcImageUrl}
                      onChange={(e) => setNewPcImageUrl(e.target.value)}
                      placeholder="Or paste image URL"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPcImage())}
                    />
                    <Button type="button" onClick={addPcImage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.pc_images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {formData.pc_images.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="h-24 w-24 bg-background rounded border flex items-center justify-center p-2">
                            <img
                              src={url}
                              alt={`PC Image ${index + 1}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePcImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Mobile Images</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload images optimized for mobile display (recommended: 750x1334px or similar mobile aspect ratio)
                  </p>
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        mobile_images: [...prev.mobile_images, url],
                      }));
                    }}
                    folder="products/mobile"
                    label="Upload Mobile Image"
                  />
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newMobileImageUrl}
                      onChange={(e) => setNewMobileImageUrl(e.target.value)}
                      placeholder="Or paste image URL"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMobileImage())}
                    />
                    <Button type="button" onClick={addMobileImage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.mobile_images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {formData.mobile_images.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="h-24 w-24 bg-background rounded border flex items-center justify-center p-2">
                            <img
                              src={url}
                              alt={`Mobile Image ${index + 1}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeMobileImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sizes</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="e.g., S, M, L, XL"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    />
                    <Button type="button" onClick={addSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.sizes.map((size) => (
                        <div
                          key={size}
                          className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full"
                        >
                          <span className="text-sm">{size}</span>
                          <button
                            type="button"
                            onClick={() => removeSize(size)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Colors</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="e.g., Red, Blue, Green"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    />
                    <Button type="button" onClick={addColor}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.colors.map((color) => (
                        <div
                          key={color}
                          className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full"
                        >
                          <span className="text-sm">{color}</span>
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(adminPath('products'))}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
