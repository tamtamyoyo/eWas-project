import { useEffect } from 'react';
import { supabase } from '../../lib/supabase-client';
import { useLocation } from 'wouter';

export function AuthCallback() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // Process the OAuth callback
    const handleAuthCallback = async () => {
      // Get the hash fragment from the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (!accessToken) {
        // Check if this is just a normal redirect after email confirmation
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          // User is logged in after email confirmation
          setLocation('/dashboard');
          return;
        }
        
        if (error) {
          console.error('Auth callback error:', error);
          setLocation('/login?error=auth_callback_failed');
          return;
        }
      }
      
      // If we have an access token, we can set the session manually
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('Error setting session:', error);
          setLocation('/login?error=auth_callback_failed');
          return;
        }
      }
      
      // Redirect to dashboard on success
      setLocation('/dashboard');
    };

    handleAuthCallback();
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing authentication...</h1>
        <p>Please wait while we complete your authentication.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 