import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface DatabaseSetupWarningProps {
  show: boolean;
  context?: 'products' | 'banners' | 'profile' | 'general';
}

export function DatabaseSetupWarning({ show, context = 'general' }: DatabaseSetupWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  const contextMessages = {
    products: 'Products could not be loaded',
    banners: 'Banners could not be loaded',
    profile: 'Profile data could not be loaded',
    general: 'Data could not be loaded',
  };

  return (
    <Alert className="mb-6 border-destructive/50 bg-destructive/10">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <AlertTitle className="text-destructive font-semibold">
        Failed to Load Data
      </AlertTitle>
      <AlertDescription className="text-destructive/90">
        <p className="mb-3">
          {contextMessages[context]}. Please check your connection and try refreshing the page.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs h-7"
          >
            Refresh Page
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="ml-auto text-xs h-7"
          >
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
