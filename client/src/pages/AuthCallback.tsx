import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get auth data from URL
        const { data, error: supabaseError } = await supabase.auth.getSession();
        
        if (supabaseError) {
          throw supabaseError;
        }
        
        if (!data.session) {
          throw new Error('No session found');
        }
        
        // Get the user info from Supabase
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        const user = userData.user;
        
        if (!user || !user.email) {
          throw new Error('No user found');
        }
        
        // Create or update user in our database
        const response = await apiRequest('POST', '/api/auth/google-callback', {
          email: user.email,
          fullName: user.user_metadata?.full_name,
          photoURL: user.user_metadata?.avatar_url,
          googleId: user.id,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to authenticate');
        }
        
        // Show success message
        toast({
          title: 'Successfully signed in',
          description: 'Welcome back!',
        });
        
        // Redirect to dashboard with a full page reload to ensure auth state is fresh
        window.location.href = '/dashboard';
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        
        toast({
          title: 'Authentication failed',
          description: err.message || 'Please try again',
          variant: 'destructive',
        });
        
        // Redirect to login page with a full page reload
        window.location.href = '/login';
      }
    };
    
    handleAuthCallback();
  }, [setLocation, toast]);
  
  return (
    <div className="h-screen flex items-center justify-center">
      {error ? (
        <div className="max-w-md p-6 bg-card border rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
            onClick={() => window.location.href = '/login'}
          >
            Back to Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          <p className="mt-4 text-muted-foreground">Completing authentication...</p>
        </div>
      )}
    </div>
  );
}