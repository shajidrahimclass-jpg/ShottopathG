import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { validateAndPrepareImage } from '@/lib/imageUpload';
import { uploadImage } from '@/db/api';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string | null;
  folder?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  currentImage,
  folder = 'products',
  label = 'Upload Image',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImage prop
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input immediately to allow re-selection of same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Reset progress
    setProgress(0);

    // Validate and prepare image
    const validation = await validateAndPrepareImage(file);
    
    if (!validation.success) {
      toast.error(validation.error || 'Failed to validate image');
      return;
    }

    if (validation.message) {
      toast.info(validation.message);
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(validation.file!);

    // Upload image
    try {
      setUploading(true);
      setProgress(30);

      const url = await uploadImage(validation.file!, folder);
      
      setProgress(100);
      toast.success('Image uploaded successfully');
      
      // Call the callback with the uploaded URL
      onUploadComplete(url);
      
      // Keep the preview - it will be managed by currentImage prop
      setProgress(0);
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      setPreview(currentImage || null);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative group">
          <div className="relative w-full aspect-video rounded-lg border-2 border-border overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {uploading && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 group"
        >
          <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, GIF, WEBP, AVIF (max 10MB)
            </p>
            <p className="text-xs text-muted-foreground">
              Auto-compressed to under 1MB
            </p>
          </div>
        </button>
      )}

      {!preview && (
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {label}
        </Button>
      )}
    </div>
  );
}
