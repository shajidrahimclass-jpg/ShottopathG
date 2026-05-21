import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useGesture } from '@use-gesture/react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ArrowLeftRight, 
  Lock, 
  Unlock,
  Layers,
  RotateCw,
  Hand,
  Move,
  Maximize
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageComparisonDialogProps {
  images: string[];
  open: boolean;
  onClose: () => void;
  initialLeftIndex?: number;
  initialRightIndex?: number;
}

interface ComparisonPreferences {
  splitPosition: number;
  syncZoom: boolean;
  showGestureHints: boolean;
  showDifference: boolean;
  differenceSensitivity: number;
}

const DEFAULT_PREFERENCES: ComparisonPreferences = {
  splitPosition: 50,
  syncZoom: true,
  showGestureHints: true,
  showDifference: false,
  differenceSensitivity: 50,
};

export function ImageComparisonDialog({
  images,
  open,
  onClose,
  initialLeftIndex = 0,
  initialRightIndex = 1,
}: ImageComparisonDialogProps) {
  const [leftImageIndex, setLeftImageIndex] = useState(initialLeftIndex);
  const [rightImageIndex, setRightImageIndex] = useState(initialRightIndex);
  const [leftScale, setLeftScale] = useState(1);
  const [rightScale, setRightScale] = useState(1);
  const [leftPosition, setLeftPosition] = useState({ x: 0, y: 0 });
  const [rightPosition, setRightPosition] = useState({ x: 0, y: 0 });
  const [leftRotation, setLeftRotation] = useState(0);
  const [rightRotation, setRightRotation] = useState(0);
  const [splitPosition, setSplitPosition] = useState(50);
  const [syncZoom, setSyncZoom] = useState(true);
  const [showDifference, setShowDifference] = useState(false);
  const [differenceSensitivity, setDifferenceSensitivity] = useState(50);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [dragStartLeft, setDragStartLeft] = useState({ x: 0, y: 0 });
  const [dragStartRight, setDragStartRight] = useState({ x: 0, y: 0 });
  const [showGestureHints, setShowGestureHints] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftImageRef = useRef<HTMLDivElement>(null);
  const rightImageRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('imageComparisonPreferences');
    if (saved) {
      try {
        const prefs: ComparisonPreferences = JSON.parse(saved);
        setSplitPosition(prefs.splitPosition);
        setSyncZoom(prefs.syncZoom);
        setShowDifference(prefs.showDifference);
        setDifferenceSensitivity(prefs.differenceSensitivity);
        setShowGestureHints(prefs.showGestureHints ?? true);
      } catch (error) {
        console.error('Failed to load comparison preferences:', error);
      }
    } else {
      // First time user - show gesture hints
      setShowGestureHints(true);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback(() => {
    const prefs: ComparisonPreferences = {
      splitPosition,
      syncZoom,
      showGestureHints,
      showDifference,
      differenceSensitivity,
    };
    localStorage.setItem('imageComparisonPreferences', JSON.stringify(prefs));
  }, [splitPosition, syncZoom, showGestureHints, showDifference, differenceSensitivity]);

  useEffect(() => {
    if (open) {
      savePreferences();
    }
  }, [open, savePreferences]);

  const resetTransform = useCallback((side: 'left' | 'right' | 'both') => {
    if (side === 'left' || side === 'both') {
      setLeftScale(1);
      setLeftPosition({ x: 0, y: 0 });
      setLeftRotation(0);
    }
    if (side === 'right' || side === 'both') {
      setRightScale(1);
      setRightPosition({ x: 0, y: 0 });
      setRightRotation(0);
    }
  }, []);

  const handleZoomIn = useCallback((side: 'left' | 'right') => {
    if (syncZoom) {
      setLeftScale(prev => Math.min(prev + 0.25, 5));
      setRightScale(prev => Math.min(prev + 0.25, 5));
    } else if (side === 'left') {
      setLeftScale(prev => Math.min(prev + 0.25, 5));
    } else {
      setRightScale(prev => Math.min(prev + 0.25, 5));
    }
  }, [syncZoom]);

  const handleZoomOut = useCallback((side: 'left' | 'right') => {
    if (syncZoom) {
      setLeftScale(prev => Math.max(prev - 0.25, 0.5));
      setRightScale(prev => Math.max(prev - 0.25, 0.5));
    } else if (side === 'left') {
      setLeftScale(prev => Math.max(prev - 0.25, 0.5));
    } else {
      setRightScale(prev => Math.max(prev - 0.25, 0.5));
    }
  }, [syncZoom]);

  const handleRotate = useCallback((side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftRotation(prev => (prev + 90) % 360);
    } else {
      setRightRotation(prev => (prev + 90) % 360);
    }
  }, []);

  const swapImages = useCallback(() => {
    const tempIndex = leftImageIndex;
    setLeftImageIndex(rightImageIndex);
    setRightImageIndex(tempIndex);
    
    const tempScale = leftScale;
    setLeftScale(rightScale);
    setRightScale(tempScale);
    
    const tempPosition = leftPosition;
    setLeftPosition(rightPosition);
    setRightPosition(tempPosition);
    
    const tempRotation = leftRotation;
    setLeftRotation(rightRotation);
    setRightRotation(tempRotation);
  }, [leftImageIndex, rightImageIndex, leftScale, rightScale, leftPosition, rightPosition, leftRotation, rightRotation]);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Touch gesture handlers for left image
  const leftGestureBind = useGesture(
    {
      onPinch: ({ offset: [d], memo = leftScale }) => {
        const newScale = Math.max(0.5, Math.min(memo + d / 150, 5));
        if (syncZoom) {
          setLeftScale(newScale);
          setRightScale(newScale);
        } else {
          setLeftScale(newScale);
        }
        if (newScale === 1) {
          setLeftPosition({ x: 0, y: 0 });
          if (syncZoom) setRightPosition({ x: 0, y: 0 });
        }
        return memo;
      },
      onDrag: ({ offset: [x, y], pinching, touches }) => {
        if (pinching || leftScale === 1 || touches !== 2) return;
        
        const maxX = 200 * (leftScale - 1);
        const maxY = 200 * (leftScale - 1);
        const newPosition = {
          x: Math.max(-maxX, Math.min(maxX, x)),
          y: Math.max(-maxY, Math.min(maxY, y)),
        };
        setLeftPosition(newPosition);
        if (syncZoom) {
          setRightPosition(newPosition);
        }
      },
      onDoubleClick: () => {
        if (leftScale === 1) {
          setLeftScale(2);
          if (syncZoom) setRightScale(2);
        } else {
          setLeftScale(1);
          setLeftPosition({ x: 0, y: 0 });
          if (syncZoom) {
            setRightScale(1);
            setRightPosition({ x: 0, y: 0 });
          }
        }
        triggerHaptic();
      },
    },
    {
      drag: {
        from: () => [leftPosition.x, leftPosition.y],
        filterTaps: true,
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 5 },
        rubberband: true,
      },
    }
  );

  // Touch gesture handlers for right image
  const rightGestureBind = useGesture(
    {
      onPinch: ({ offset: [d], memo = rightScale }) => {
        const newScale = Math.max(0.5, Math.min(memo + d / 150, 5));
        if (syncZoom) {
          setLeftScale(newScale);
          setRightScale(newScale);
        } else {
          setRightScale(newScale);
        }
        if (newScale === 1) {
          setRightPosition({ x: 0, y: 0 });
          if (syncZoom) setLeftPosition({ x: 0, y: 0 });
        }
        return memo;
      },
      onDrag: ({ offset: [x, y], pinching, touches }) => {
        if (pinching || rightScale === 1 || touches !== 2) return;
        
        const maxX = 200 * (rightScale - 1);
        const maxY = 200 * (rightScale - 1);
        const newPosition = {
          x: Math.max(-maxX, Math.min(maxX, x)),
          y: Math.max(-maxY, Math.min(maxY, y)),
        };
        setRightPosition(newPosition);
        if (syncZoom) {
          setLeftPosition(newPosition);
        }
      },
      onDoubleClick: () => {
        if (rightScale === 1) {
          setRightScale(2);
          if (syncZoom) setLeftScale(2);
        } else {
          setRightScale(1);
          setRightPosition({ x: 0, y: 0 });
          if (syncZoom) {
            setLeftScale(1);
            setLeftPosition({ x: 0, y: 0 });
          }
        }
        triggerHaptic();
      },
    },
    {
      drag: {
        from: () => [rightPosition.x, rightPosition.y],
        filterTaps: true,
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 5 },
        rubberband: true,
      },
    }
  );

  // Gesture handler for container (three-finger swipe)
  const containerGestureBind = useGesture(
    {
      onDrag: ({ touches, direction: [dx], velocity: [vx] }) => {
        if (touches === 3 && Math.abs(vx) > 0.5) {
          if (dx > 0) {
            // Swipe right - swap images
            swapImages();
            triggerHaptic();
          } else if (dx < 0) {
            // Swipe left - swap images
            swapImages();
            triggerHaptic();
          }
        }
      },
    },
    {
      drag: {
        filterTaps: true,
      },
    }
  );

  // Long press handler for divider
  const handleDividerTouchStart = useCallback(() => {
    setIsLongPressing(true);
    const timer = setTimeout(() => {
      setSplitPosition(50);
      triggerHaptic();
      setIsLongPressing(false);
    }, 500);
    setLongPressTimer(timer);
  }, [triggerHaptic]);

  const handleDividerTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
  }, [longPressTimer]);

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Handle divider drag
  const handleDividerMouseDown = useCallback(() => {
    setIsDraggingDivider(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingDivider && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.max(20, Math.min(80, newPosition)));
    }
  }, [isDraggingDivider]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingDivider(false);
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  useEffect(() => {
    if (isDraggingDivider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingDivider, handleMouseMove, handleMouseUp]);

  // Handle image drag for panning
  const handleImageMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    const scale = side === 'left' ? leftScale : rightScale;
    const position = side === 'left' ? leftPosition : rightPosition;
    
    if (scale > 1) {
      if (side === 'left') {
        setIsDraggingLeft(true);
        setDragStartLeft({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      } else {
        setIsDraggingRight(true);
        setDragStartRight({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    }
  }, [leftScale, rightScale, leftPosition, rightPosition]);

  const handleImageMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingLeft && leftScale > 1) {
      const newPosition = {
        x: e.clientX - dragStartLeft.x,
        y: e.clientY - dragStartLeft.y,
      };
      setLeftPosition(newPosition);
      if (syncZoom) {
        setRightPosition(newPosition);
      }
    }
    if (isDraggingRight && rightScale > 1) {
      const newPosition = {
        x: e.clientX - dragStartRight.x,
        y: e.clientY - dragStartRight.y,
      };
      setRightPosition(newPosition);
      if (syncZoom) {
        setLeftPosition(newPosition);
      }
    }
  }, [isDraggingLeft, isDraggingRight, leftScale, rightScale, dragStartLeft, dragStartRight, syncZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          handleZoomIn('left');
          break;
        case '-':
        case '_':
          handleZoomOut('left');
          break;
        case '0':
          resetTransform('both');
          break;
        case 's':
        case 'S':
          swapImages();
          break;
        case 'l':
        case 'L':
          setSyncZoom(prev => !prev);
          break;
        case 'd':
        case 'D':
          setShowDifference(prev => !prev);
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleZoomIn, handleZoomOut, resetTransform, swapImages, onClose]);

  const handleClose = () => {
    onClose();
    resetTransform('both');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-white text-sm md:text-base font-medium">
                Compare Images
              </span>
              <div className="flex items-center gap-2">
                <Switch
                  id="sync-zoom"
                  checked={syncZoom}
                  onCheckedChange={setSyncZoom}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="sync-zoom" className="text-white text-xs md:text-sm cursor-pointer flex items-center gap-1">
                  {syncZoom ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  Sync Zoom
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-difference"
                  checked={showDifference}
                  onCheckedChange={setShowDifference}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="show-difference" className="text-white text-xs md:text-sm cursor-pointer flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Difference
                </Label>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleZoomOut('left')}
                disabled={leftScale <= 0.5}
                className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <span className="text-white text-xs md:text-sm font-medium min-w-12 text-center">
                {Math.round(leftScale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleZoomIn('left')}
                disabled={leftScale >= 5}
                className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetTransform('both')}
                disabled={leftScale === 1 && rightScale === 1}
                className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                title="Fit to Screen (0)"
              >
                <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={swapImages}
                className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
                title="Swap Images (S)"
              >
                <ArrowLeftRight className="h-4 w-4 md:h-5 md:w-5" />
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

          {/* Split View Container */}
          <div
            ref={containerRef}
            {...containerGestureBind()}
            className="flex-1 flex relative overflow-hidden touch-none"
            onMouseMove={handleImageMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Left Image */}
            <div
              className="absolute top-0 left-0 bottom-0 flex items-center justify-center overflow-hidden"
              style={{ width: `${splitPosition}%` }}
            >
              <div 
                ref={leftImageRef}
                {...leftGestureBind()}
                className="relative w-full h-full flex items-center justify-center touch-none"
              >
                <img
                  src={images[leftImageIndex]}
                  alt="Left comparison"
                  className="max-w-full max-h-full object-contain select-none pointer-events-none"
                  draggable="false"
                  style={{
                    transform: `scale(${leftScale}) translate(${leftPosition.x / leftScale}px, ${leftPosition.y / leftScale}px) rotate(${leftRotation}deg)`,
                    transition: leftScale === 1 ? 'transform 0.3s ease-out' : 'none',
                  }}
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
                  Left: {leftImageIndex + 1}
                </div>
                {leftScale > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
                    {Math.round(leftScale * 100)}%
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRotate('left')}
                  className="absolute bottom-2 left-2 text-white hover:bg-white/20 h-8 w-8"
                  title="Rotate Left"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div
              className="absolute top-0 right-0 bottom-0 flex items-center justify-center overflow-hidden"
              style={{ width: `${100 - splitPosition}%` }}
            >
              <div 
                ref={rightImageRef}
                {...rightGestureBind()}
                className="relative w-full h-full flex items-center justify-center touch-none"
              >
                <img
                  src={images[rightImageIndex]}
                  alt="Right comparison"
                  className="max-w-full max-h-full object-contain select-none pointer-events-none"
                  draggable="false"
                  style={{
                    transform: `scale(${rightScale}) translate(${rightPosition.x / rightScale}px, ${rightPosition.y / rightScale}px) rotate(${rightRotation}deg)`,
                    transition: rightScale === 1 ? 'transform 0.3s ease-out' : 'none',
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
                  Right: {rightImageIndex + 1}
                </div>
                {rightScale > 1 && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
                    {Math.round(rightScale * 100)}%
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRotate('right')}
                  className="absolute bottom-2 right-2 text-white hover:bg-white/20 h-8 w-8"
                  title="Rotate Right"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div
              className={cn(
                "absolute top-0 bottom-0 w-1 bg-white/50 cursor-col-resize hover:bg-white/80 transition-all z-40",
                isLongPressing && "bg-primary w-2"
              )}
              style={{ left: `${splitPosition}%` }}
              onMouseDown={handleDividerMouseDown}
              onTouchStart={handleDividerTouchStart}
              onTouchEnd={handleDividerTouchEnd}
            >
              <div className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 rounded-full flex items-center justify-center transition-all",
                isLongPressing ? "bg-primary scale-110" : "bg-white/80"
              )}>
                <ArrowLeftRight className={cn("h-4 w-4", isLongPressing ? "text-white" : "text-black")} />
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div ref={thumbnailStripRef} className="absolute bottom-0 left-0 right-0 z-50 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (leftImageIndex === index) {
                      setRightImageIndex(index);
                    } else {
                      setLeftImageIndex(index);
                    }
                    triggerHaptic();
                  }}
                  className={cn(
                    'relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all snap-center',
                    leftImageIndex === index && 'border-blue-500 ring-2 ring-blue-500',
                    rightImageIndex === index && 'border-green-500 ring-2 ring-green-500',
                    leftImageIndex !== index && rightImageIndex !== index && 'border-white/30 hover:border-white/60'
                  )}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {leftImageIndex === index && (
                    <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1">L</div>
                  )}
                  {rightImageIndex === index && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1">R</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Gesture Hints Overlay */}
          {showGestureHints && (
            <div className="absolute inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8">
              <div className="max-w-2xl w-full bg-card rounded-lg p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">Touch Gestures</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowGestureHints(false);
                      savePreferences();
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Maximize className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Pinch to Zoom</h4>
                      <p className="text-xs text-muted-foreground mt-1">Pinch in/out on images to zoom</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Hand className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Double Tap</h4>
                      <p className="text-xs text-muted-foreground mt-1">Double tap to zoom 2x or reset</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Move className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Two-Finger Pan</h4>
                      <p className="text-xs text-muted-foreground mt-1">Drag with 2 fingers when zoomed</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <ArrowLeftRight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Three-Finger Swipe</h4>
                      <p className="text-xs text-muted-foreground mt-1">Swipe with 3 fingers to swap images</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Hand className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Long Press Divider</h4>
                      <p className="text-xs text-muted-foreground mt-1">Hold divider for 0.5s to reset to 50/50</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Sync Zoom</h4>
                      <p className="text-xs text-muted-foreground mt-1">Toggle to zoom both images together</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowGestureHints(false);
                    savePreferences();
                  }}
                  className="w-full"
                >
                  Got it!
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
