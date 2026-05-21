/**
 * Image Upload Utility with Automatic Compression
 * Handles image validation, compression, and upload to Supabase Storage
 */

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_RESOLUTION = 1080; // 1080p
const COMPRESSION_QUALITY = 0.8;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

interface CompressionResult {
  file: File;
  wasCompressed: boolean;
  originalSize: number;
  finalSize: number;
}

/**
 * Validate file type
 */
export const validateFileType = (file: File): boolean => {
  return SUPPORTED_FORMATS.includes(file.type);
};

/**
 * Validate filename (only English letters and numbers)
 */
export const sanitizeFilename = (filename: string): string => {
  const ext = filename.split('.').pop();
  const nameWithoutExt = filename.replace(`.${ext}`, '');
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitized}.${ext}`;
};

/**
 * Compress image to meet size requirements
 */
const compressImage = async (file: File, quality: number = COMPRESSION_QUALITY): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_RESOLUTION || height > MAX_RESOLUTION) {
          if (width > height) {
            height = (height / width) * MAX_RESOLUTION;
            width = MAX_RESOLUTION;
          } else {
            width = (width / height) * MAX_RESOLUTION;
            height = MAX_RESOLUTION;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP with specified quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.webp'),
              { type: 'image/webp' }
            );
            
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Process image with automatic compression if needed
 */
export const processImage = async (file: File): Promise<CompressionResult> => {
  const originalSize = file.size;
  
  // If file is already under the limit, return as is
  if (originalSize <= MAX_FILE_SIZE) {
    return {
      file,
      wasCompressed: false,
      originalSize,
      finalSize: originalSize,
    };
  }
  
  // Compress image
  let compressedFile = await compressImage(file, COMPRESSION_QUALITY);
  let quality = COMPRESSION_QUALITY;
  
  // If still too large, reduce quality iteratively
  while (compressedFile.size > MAX_FILE_SIZE && quality > 0.3) {
    quality -= 0.1;
    compressedFile = await compressImage(file, quality);
  }
  
  return {
    file: compressedFile,
    wasCompressed: true,
    originalSize,
    finalSize: compressedFile.size,
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Validate and prepare image for upload
 */
export const validateAndPrepareImage = async (file: File): Promise<{
  success: boolean;
  file?: File;
  error?: string;
  message?: string;
}> => {
  // Validate file type
  if (!validateFileType(file)) {
    return {
      success: false,
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, WEBP, or AVIF images.',
    };
  }
  
  // Validate file size (max 10MB before compression)
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      error: 'File is too large. Maximum size before compression is 10MB.',
    };
  }
  
  try {
    // Process image (compress if needed)
    const result = await processImage(file);
    
    // Sanitize filename
    const sanitizedFile = new File(
      [result.file],
      sanitizeFilename(result.file.name),
      { type: result.file.type }
    );
    
    let message = 'Image ready for upload';
    if (result.wasCompressed) {
      message = `Image compressed from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.finalSize)}`;
    }
    
    return {
      success: true,
      file: sanitizedFile,
      message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image',
    };
  }
};
