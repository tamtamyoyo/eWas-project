import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';

export default function LinkedInCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error("LinkedIn authentication error:", error);
      setError(t('linkedin.callback.error'));
      toast({
        title: t('linkedin.callback.error'),
        description: error,
        variant: "destructive",
      });
      return;
    }
    
    if (!code) {
      console.error("No authorization code found in URL");
      setError(t('linkedin.callback.noCode'));
      toast({
        title: t('linkedin.callback.noCode'),
        variant: "destructive",
      });
      return;
    }
    
    // Process the authorization code
    const processCode = async () => {
      try {
        const response = await apiRequest('POST', '/api/linkedin/callback', { code });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Unknown error');
        }
        
        toast({
          title: t('linkedin.callback.success'),
          description: t('linkedin.callback.accountConnected'),
        });
        
        // Redirect back to connect page
        setLocation('/connect');
      } catch (error: any) {
        console.error("LinkedIn callback processing error:", error);
        setError(error.message || t('linkedin.callback.error'));
        
        toast({
          title: t('linkedin.callback.error'),
          description: error.message || t('linkedin.callback.unknownError'),
          variant: "destructive",
        });
      }
    };
    
    processCode();
  }, [setLocation, toast, t]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-2xl font-bold">{t('linkedin.callback.title')}</h1>
        
        {error ? (
          <div className="space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => setLocation('/connect')}>
              {t('linkedin.callback.backToConnect')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>{t('linkedin.callback.processing')}</p>
          </div>
        )}
      </div>
    </div>
  );
}