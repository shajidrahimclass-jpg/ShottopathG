import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageZoomProps {
  src: string;
  alt?: string;
  className?: string;
  images?: string[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function ImageZoom({ 
  src, 
  alt = 'Image', 
  className,
  images = [],
  currentIndex = 0,
  onIndexChange
}: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const hasMultipleImages = images.length > 1;
  const currentImage = hasMultipleImages ? images[currentIndex] : src;

  const handleOpen = () => {
    setIsOpen(true);
    resetTransform();
  };

  const handleClose = () => {
    setIsOpen(false);
    resetTransform();
  };

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePrevious = () => {
    if (hasMultipleImages && onIndexChange) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      onIndexChange(newIndex);
      resetTransform();
    }
  };

  const handleNext = () => {
    if (hasMultipleImages && onIndexChange) {
      const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      onIndexChange(newIndex);
      resetTransform();
    }
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={cn('cursor-zoom-in transition-opacity hover:opacity-90', className)}
        onClick={handleOpen}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0"
          onPointerDownOutside={handleClose}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                {hasMultipleImages && (
                  <span className="text-white text-sm md:text-base font-medium">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                >
                  <ZoomOut className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <span className="text-white text-xs md:text-sm font-medium min-w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={scale >= 5}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                >
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRotate}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                >
                  <RotateCw className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                >
                  <Download className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>

            {/* Image Container */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <img
                src={currentImage}
                alt={alt}
                className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
                }}
                draggable={false}
              />
            </div>

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 md:h-12 md:w-12 rounded-full"
                >
                  <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 md:h-12 md:w-12 rounded-full"
                >
                  <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                </Button>
              </>
            )}

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-xs md:text-sm text-center truncate">{alt}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
