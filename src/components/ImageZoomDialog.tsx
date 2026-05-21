import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Columns2 } from 'lucide-react';
import { ImageComparisonDialog } from '@/components/ImageComparisonDialog';

interface ImageZoomDialogProps {
  images: string[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageZoomDialog({ images, currentIndex, open, onClose, onNavigate }: ImageZoomDialogProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [comparisonMode, setComparisonMode] = useState(false);

  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
    resetTransform();
  }, [currentIndex, images.length, onNavigate, resetTransform]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
    resetTransform();
  }, [currentIndex, images.length, onNavigate, resetTransform]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleFitToScreen = useCallback(() => {
    resetTransform();
  }, [resetTransform]);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetTransform();
    }
  }, [scale, resetTransform]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

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

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case '0':
          handleFitToScreen();
          break;
        case 'Escape':
          onClose();
          resetTransform();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrevious, handleNext, handleZoomIn, handleZoomOut, handleFitToScreen, onClose, resetTransform]);

  const handleClose = () => {
    onClose();
    resetTransform();
  };

  return (
    <>
      <Dialog open={open && !comparisonMode} onOpenChange={handleClose}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0"
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                {images.length > 1 && (
                  <span className="text-white text-sm md:text-base font-medium">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                {images.length >= 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setComparisonMode(true)}
                    className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                    title="Compare Images (C)"
                  >
                    <Columns2 className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                  title="Zoom Out (-)"
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
                  title="Zoom In (+)"
                >
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFitToScreen}
                  disabled={scale === 1 && rotation === 0}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                  title="Fit to Screen (0)"
                >
                  <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRotate}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                  title="Download"
                >
                  <Download className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                  title="Close (Esc)"
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
              onDoubleClick={handleDoubleClick}
              onWheel={handleWheel}
              style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            >
              <img
                src={images[currentIndex]}
                alt={`Product image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
                }}
                draggable={false}
              />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30"
                >
                  <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30"
                >
                  <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison Mode Dialog */}
      {images.length >= 2 && (
        <ImageComparisonDialog
          images={images}
          open={comparisonMode}
          onClose={() => setComparisonMode(false)}
          initialLeftIndex={currentIndex}
          initialRightIndex={currentIndex < images.length - 1 ? currentIndex + 1 : 0}
        />
      )}
    </>
  );
}
