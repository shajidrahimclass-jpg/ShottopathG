import { useState, useRef, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: TouchEvent) => {
    if (!isMobile || disabled || isRefreshing) return;
    
    // Only trigger if at top of page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isMobile || disabled || isRefreshing || startY.current === 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    // Only pull down
    if (distance > 0 && window.scrollY === 0) {
      // Dampen the pull effect
      const dampedDistance = Math.min(distance * 0.5, 80);
      setPullDistance(dampedDistance);
      
      // Prevent default scrolling when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isMobile || disabled || isRefreshing) return;
    
    // Trigger refresh if pulled more than 60px
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setPullDistance(60);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    startY.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, disabled, isRefreshing, pullDistance]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      {isMobile && pullDistance > 0 && (
        <div
          className={cn(
            'absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity z-50',
            pullDistance > 60 ? 'opacity-100' : 'opacity-50'
          )}
          style={{
            height: `${pullDistance}px`,
            transform: `translateY(-${60 - pullDistance}px)`,
          }}
        >
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg border">
            <Loader2
              className={cn(
                'h-5 w-5 text-primary',
                (isRefreshing || pullDistance > 60) && 'animate-spin'
              )}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
