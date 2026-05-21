import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code/token from the URL for a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (session?.user) {
          // Ensure profile exists for OAuth users (Google, etc.)
          // The DB trigger handle_new_user normally creates it automatically.
          // This is a safety fallback only — never hardcode a role here.
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!existingProfile) {
            const email = session.user.email ?? '';
            const rawUsername = email.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;
            const name =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              rawUsername;

            // Insert without role — DB default handles role assignment
            await supabase.from('profiles').upsert(
              {
                id: session.user.id,
                email,
                username: rawUsername,
                name,
                full_name: name,
              } as any,
              { onConflict: 'id', ignoreDuplicates: true }
            );
          }

          navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="text-lg font-medium text-foreground">Signing you in...</p>
        <p className="text-sm text-muted-foreground">Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
}
