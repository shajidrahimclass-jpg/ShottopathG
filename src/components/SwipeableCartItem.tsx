import { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableCartItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  index: number;
}

export function SwipeableCartItem({ children, onDelete, index }: SwipeableCartItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile or tablet
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (!isMobile) return;
      
      // Only allow left swipe
      if (eventData.deltaX < 0) {
        const offset = Math.max(eventData.deltaX, -100);
        setSwipeOffset(offset);
        setIsSwiping(true);
      }
    },
    onSwiped: (eventData) => {
      if (!isMobile) return;
      
      setIsSwiping(false);
      
      // If swiped more than 60px, trigger delete
      if (eventData.deltaX < -60) {
        handleDelete();
      } else {
        // Reset position
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
  });

  const handleDelete = () => {
    setIsDeleting(true);
    setSwipeOffset(-100);
    
    // Wait for animation then call onDelete
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  const handleDeleteClick = () => {
    handleDelete();
  };

  // Don't apply swipe on desktop
  if (!isMobile) {
    return <div>{children}</div>;
  }

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {/* Delete button background */}
      <div className="absolute inset-0 bg-destructive flex items-center justify-end pr-6">
        <Trash2 className="h-6 w-6 text-destructive-foreground" />
      </div>

      {/* Swipeable content */}
      <div
        {...handlers}
        className={cn(
          'relative transition-transform',
          isSwiping ? 'duration-0' : 'duration-300 ease-out',
          isDeleting && 'opacity-0'
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {children}
      </div>

      {/* Delete button overlay (visible when swiped) */}
      {swipeOffset < -20 && (
        <button
          onClick={handleDeleteClick}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground rounded-full p-3 shadow-lg z-10 transition-opacity"
          style={{
            opacity: Math.min(Math.abs(swipeOffset) / 60, 1),
          }}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
