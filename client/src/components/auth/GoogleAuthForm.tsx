import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FaGoogle } from 'react-icons/fa';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthFormProps {
  view?: 'sign_in' | 'sign_up';
}

export default function GoogleAuthForm({ view = 'sign_in' }: GoogleAuthFormProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isRtl = i18n.language === 'ar';
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Get auth URL from server
      const response = await apiRequest('GET', '/api/google/auth');
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Special handling for missing API credentials
        if (errorData.errorType === 'CREDENTIALS_MISSING') {
          throw new Error('Google API credentials are not configured. Please contact support.');
        }
        
        throw new Error(errorData.message || 'Failed to start Google authorization');
      }
      
      const { authUrl } = await response.json();
      
      // Save current page to sessionStorage, so we can redirect back after auth
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      
      // Directly redirect to Google auth page
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('Google auth error:', error);
      setLoading(false);
      
      toast({
        title: t('auth.authError', 'Authentication Error'),
        description: error.message || t('auth.googleAuthFailed', 'Failed to authenticate with Google'),
        variant: 'destructive',
      });
    }
  };
  
  const handleGoogleCallback = async (code: string) => {
    try {
      // Send code to backend to complete authentication
      const response = await apiRequest('POST', '/api/google/callback', { code });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete Google authentication');
      }
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('Google callback error:', error);
      setLoading(false);
      
      toast({
        title: t('auth.authError', 'Authentication Error'),
        description: error.message || t('auth.googleAuthFailed', 'Failed to authenticate with Google'),
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="w-full">
      <Button 
        variant="outline" 
        className={`w-full h-14 rounded-full border-[#B2BDD0] flex items-center justify-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        ) : (
          <>
            <FaGoogle className="h-6 w-6 text-[#DB4437]" />
            <span className="text-base font-medium text-[#010A1B]">
              {view === 'sign_in' ? t('auth.signInWithGoogle', 'Sign in with Google') : t('auth.signUpWithGoogle', 'Sign up with Google')}
            </span>
          </>
        )}
      </Button>
    </div>
  );
}