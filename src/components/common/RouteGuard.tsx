import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminBasePath } from '@/config/admin';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Pages accessible without login
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/verify-email', '/403', '/404', '/', '/products', '/products/*', '/app'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminBasePath = getAdminBasePath();
  const isAdminRoute = location.pathname.startsWith(adminBasePath);

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // Redirect unauthenticated users away from protected routes
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // Only enforce admin check once profile has finished loading
    if (!profileLoading && isAdminRoute) {
      if (!user) {
        navigate('/login', { state: { from: location.pathname }, replace: true });
        return;
      }
      if (profile && profile.role !== 'admin') {
        // Logged-in non-admin tried to access admin — send them home
        navigate('/', { replace: true });
      }
    }
  }, [user, profile, loading, profileLoading, location.pathname, navigate, isAdminRoute]);

  // Block render while auth is initialising
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // On admin routes, hold render until we know the profile role
  if (isAdminRoute && user && profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}