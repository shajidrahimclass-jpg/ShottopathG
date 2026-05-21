import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

/**
 * Custom hook to detect device type based on screen width
 * Mobile: < 768px (below md breakpoint)
 * Desktop: >= 768px (md breakpoint and above)
 * Returns device type and loading state for smooth transitions
 */
export function useDeviceType(): { deviceType: DeviceType; isTransitioning: boolean } {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    // Initial detection
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const newDeviceType = window.innerWidth < 768 ? 'mobile' : 'desktop';
      if (newDeviceType !== deviceType) {
        // Start transition animation
        setIsTransitioning(true);
        
        // Update device type
        setDeviceType(newDeviceType);
        
        // End transition after animation duration
        setTimeout(() => {
          setIsTransitioning(false);
        }, 600); // 600ms transition duration
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Initial check
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [deviceType]);

  return { deviceType, isTransitioning };
}

/**
 * Get device-specific images for a product
 * Returns device-specific images if available, otherwise returns empty array
 */
export function getDeviceImages(
  deviceType: DeviceType,
  pcImages: string[] | undefined,
  mobileImages: string[] | undefined
): string[] {
  if (deviceType === 'desktop' && pcImages && pcImages.length > 0) {
    return pcImages;
  }
  
  if (deviceType === 'mobile' && mobileImages && mobileImages.length > 0) {
    return mobileImages;
  }
  
  // Return empty array if no device-specific images
  return [];
}

/**
 * Get device-specific thumbnail for a product
 * Returns device-specific thumbnail if available, otherwise falls back to regular thumbnail
 */
export function getDeviceThumbnail(
  deviceType: DeviceType,
  pcThumbnail: string | null | undefined,
  mobileThumbnail: string | null | undefined,
  regularThumbnail: string | null | undefined
): string {
  if (deviceType === 'desktop' && pcThumbnail) {
    return pcThumbnail;
  }
  
  if (deviceType === 'mobile' && mobileThumbnail) {
    return mobileThumbnail;
  }
  
  // Fallback to regular thumbnail
  return regularThumbnail || '';
}
