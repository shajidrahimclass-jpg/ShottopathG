// Device and browser detection utilities
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  
  // Device type detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  
  // OS detection
  let osName = 'Unknown';
  let osVersion = '';
  
  if (/Windows NT 10.0/.test(ua)) {
    osName = 'Windows';
    osVersion = '10';
  } else if (/Windows NT 6.3/.test(ua)) {
    osName = 'Windows';
    osVersion = '8.1';
  } else if (/Windows NT 6.2/.test(ua)) {
    osName = 'Windows';
    osVersion = '8';
  } else if (/Windows NT 6.1/.test(ua)) {
    osName = 'Windows';
    osVersion = '7';
  } else if (/Mac OS X ([\d._]+)/.test(ua)) {
    osName = 'macOS';
    const match = ua.match(/Mac OS X ([\d._]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : '';
  } else if (/Android ([\d.]+)/.test(ua)) {
    osName = 'Android';
    const match = ua.match(/Android ([\d.]+)/);
    osVersion = match ? match[1] : '';
  } else if (/iPhone OS ([\d_]+)/.test(ua)) {
    osName = 'iOS';
    const match = ua.match(/iPhone OS ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : '';
  } else if (/iPad.*OS ([\d_]+)/.test(ua)) {
    osName = 'iPadOS';
    const match = ua.match(/OS ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : '';
  } else if (/Linux/.test(ua)) {
    osName = 'Linux';
  }
  
  // Browser detection
  let browserName = 'Unknown';
  let browserVersion = '';
  
  if (/Edg\/([\d.]+)/.test(ua)) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (/Chrome\/([\d.]+)/.test(ua) && !/Edg/.test(ua)) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (/Safari\/([\d.]+)/.test(ua) && !/Chrome/.test(ua)) {
    browserName = 'Safari';
    const match = ua.match(/Version\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (/Firefox\/([\d.]+)/.test(ua)) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (/MSIE|Trident/.test(ua)) {
    browserName = 'Internet Explorer';
  }
  
  return {
    deviceType,
    osName,
    osVersion,
    browserName,
    browserVersion,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
};

// Get UTM parameters from URL
export const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
};

// Get or create session ID
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get referrer URL
export const getReferrer = () => {
  return document.referrer || null;
};

// Detect if user is on mobile device
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if user is on desktop
export const isDesktopDevice = () => {
  return !isMobileDevice();
};

// Get recommended platform based on device
export const getRecommendedPlatform = (): 'android' | 'ios' | 'windows' | 'mac' | 'unknown' => {
  const ua = navigator.userAgent;
  
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X/i.test(ua)) return 'mac';
  
  return 'unknown';
};
