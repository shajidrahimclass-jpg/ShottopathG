import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Upload, X, Image as ImageIcon } from 'lucide-react';
import { createReview } from '@/db/api';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { OrderItem } from '@/types';

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderItem: OrderItem;
  userId: string;
}

export function ReviewDialog({
  open,
  onClose,
  orderId,
  orderItem,
  userId,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize to max 1080p while maintaining aspect ratio
          const maxDimension = 1080;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error('You can upload maximum 5 images');
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        let fileToUpload = file;

        // Compress if larger than 1MB
        if (file.size > 1024 * 1024) {
          toast.info(`Compressing ${file.name}...`);
          fileToUpload = await compressImage(file);
          toast.success(`Compressed to ${(fileToUpload.size / 1024).toFixed(0)}KB`);
        }

        // Generate unique filename
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `review_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('app-9cyfgucqbpj5_shottopoth_images')
          .upload(filePath, fileToUpload);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('app-9cyfgucqbpj5_shottopoth_images')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      setImages([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      await createReview({
        product_id: orderItem.product_id,
        user_id: userId,
        order_id: orderId,
        rating,
        comment: comment.trim() || null,
        images,
        hidden: false,
        is_anonymous: isAnonymous,
        helpful_count: 0,
        not_helpful_count: 0,
      });

      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      setImages([]);
      setIsAnonymous(false);
      onClose();
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      
      // Provide more specific error messages
      if (error?.message?.includes('policy')) {
        toast.error('You can only review orders that have been confirmed or delivered.');
      } else if (error?.message?.includes('duplicate')) {
        toast.error('You have already reviewed this product.');
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setImages([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Write a Review</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            Share your experience with {orderItem.product_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6 py-3 md:py-4">
          {/* Rating Selection */}
          <div className="space-y-2 md:space-y-3">
            <Label className="text-sm md:text-base font-semibold">
              Rating <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-1 md:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`h-7 w-7 md:h-8 md:w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs md:text-sm text-muted-foreground">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2 md:space-y-3">
            <Label className="text-sm md:text-base font-semibold">
              Your Review (Optional)
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this product..."
              rows={4}
              maxLength={500}
              className="text-sm md:text-base"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2 md:space-y-3">
            <Label className="text-sm md:text-base font-semibold">
              Photos (Optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload up to 5 images (max 1MB each, auto-compressed if larger)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Review ${index + 1}`}
                      className="w-full h-20 md:h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full text-sm md:text-base"
              >
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Photos ({images.length}/5)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Anonymous Review Option */}
        <div className="flex items-start space-x-3 p-3 md:p-4 bg-muted/50 rounded-lg border border-border">
          <Checkbox
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            className="mt-0.5"
          />
          <div className="space-y-1 flex-1">
            <Label
              htmlFor="anonymous"
              className="text-sm md:text-base font-medium cursor-pointer"
            >
              Post as Incognito
            </Label>
            <p className="text-xs text-muted-foreground">
              Your name will be hidden and displayed as "A*****x" format to protect your privacy
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting || uploading}
            className="w-full sm:w-auto text-sm md:text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting || uploading}
            className="w-full sm:w-auto text-sm md:text-base"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
