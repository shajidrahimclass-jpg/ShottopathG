import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Key, 
  Shield,
  ArrowRight,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

export default function AdminOAuthStatus() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const testGoogleOAuth = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Use signInWithOAuth with skipBrowserRedirect to test without actually redirecting
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      } as Parameters<typeof supabase.auth.signInWithOAuth>[0]);

      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          setTestResult('error');
          toast.error('Google provider is not enabled in Supabase');
        } else {
          setTestResult('success');
          toast.success('Google OAuth is configured correctly!');
        }
      } else if (data?.url) {
        setTestResult('success');
        toast.success('Google OAuth is configured correctly!');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Failed to test OAuth configuration');
    } finally {
      setTesting(false);
    }
  };

  const credentials = {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 md:h-8 md:w-8" />
            Google OAuth Status
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Configure and verify Google Sign-In authentication
          </p>
        </div>

        {/* Status Alert */}
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Action Required</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-medium">
              Google OAuth provider is not enabled in Supabase Dashboard.
            </p>
            <p className="mt-2 text-sm">
              Your credentials are configured, but you need to manually enable the provider in Supabase.
            </p>
          </AlertDescription>
        </Alert>

        {/* Test OAuth */}
        <Card>
          <CardHeader>
            <CardTitle>Test OAuth Configuration</CardTitle>
            <CardDescription>
              Check if Google provider is enabled in Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testGoogleOAuth} 
              disabled={testing}
              className="w-full md:w-auto"
            >
              {testing ? 'Testing...' : 'Test Google OAuth'}
            </Button>

            {testResult === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Google provider is NOT enabled. Follow the steps below to enable it.
                </AlertDescription>
              </Alert>
            )}

            {testResult === 'success' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Google OAuth is configured correctly! ✅
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your OAuth Credentials
            </CardTitle>
            <CardDescription>
              These credentials are securely stored in Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client ID</span>
                <Badge variant="secondary">Public</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg text-xs font-mono break-all">
                  {credentials.clientId}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.clientId, 'Client ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client Secret</span>
                <Badge variant="destructive">Private</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg text-xs font-mono">
                  {credentials.clientSecret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.clientSecret, 'Client Secret')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Keep this secret secure. Never commit it to version control.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Enable Google Provider in Supabase</CardTitle>
            <CardDescription>
              Follow these steps to enable Google Sign-In (5 minutes)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">Open Supabase Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Go to your Supabase project dashboard
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://app.supabase.com/', '_blank')}
                >
                  Open Supabase Dashboard
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">Navigate to Providers</h3>
                <p className="text-sm text-muted-foreground">
                  In the left sidebar: <strong>Authentication</strong> → <strong>Providers</strong>
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4" />
                  <span>Click <strong>Authentication</strong> (shield icon)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4" />
                  <span>Click <strong>Providers</strong> tab</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4" />
                  <span>Find <strong>Google</strong> in the list</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">Enable Google Provider</h3>
                <p className="text-sm text-muted-foreground">
                  Toggle the switch and enter your credentials
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Toggle <strong>"Enable Sign in with Google"</strong> to ON</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Paste <strong>Client ID</strong> (use copy button above)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Paste <strong>Client Secret</strong> (use copy button above)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Click <strong>Save</strong> button</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  4
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">Test the Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Verify that Google Sign-In works
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Click "Test Google OAuth" button above</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Or go to login page and click "Continue with Google"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>You should see Google's sign-in page</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Time Estimate */}
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                Estimated time: <strong>5 minutes</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Detailed guides and troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">GOOGLE_OAUTH_ENABLE_NOW.md</h4>
                <p className="text-xs text-muted-foreground">Urgent setup guide with screenshots</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">GOOGLE_OAUTH_CHECKLIST.md</h4>
                <p className="text-xs text-muted-foreground">Step-by-step verification checklist</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">GOOGLE_OAUTH_CONFIGURED.md</h4>
                <p className="text-xs text-muted-foreground">Complete configuration guide</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">GOOGLE_OAUTH_QUICK_SETUP.md</h4>
                <p className="text-xs text-muted-foreground">Quick reference guide</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
