import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { SiSnapchat } from 'react-icons/si';

interface SnapchatConnectButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isConnected?: boolean;
  onDisconnect?: () => void;
  accountName?: string;
}

export function SnapchatConnectButton({
  onSuccess,
  onError,
  isConnected = false,
  onDisconnect,
  accountName
}: SnapchatConnectButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Handle connecting to Snapchat
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // First get the auth URL from the server
      const response = await apiRequest('GET', '/api/snapchat/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        // Display instructions about the app setup requirements before redirecting
        toast({
          title: t('connect.snapchat.redirecting') || 'Redirecting to Snapchat',
          description: t('connect.snapchat.redirectDescription') || 'You will be redirected to Snapchat for authentication. Make sure your Snapchat app has the correct redirect URI configured.',
          duration: 6000
        });
        
        // Delay slightly to allow toast to be read
        setTimeout(() => {
          // Open a new window for authentication
          window.location.href = data.authUrl;
        }, 1500);
      } else {
        throw new Error(t('connect.snapchat.authUrlError') || 'Failed to get authentication URL');
      }
    } catch (error) {
      console.error('Snapchat auth error:', error);
      
      // Enhanced error handling with more specific messages
      let errorMessage = '';
      let errorTitle = t('connect.errorTitle') || 'Connection Error';
      
      if (error instanceof Error) {
        if (error.message.includes('Client ID is missing')) {
          errorMessage = t('connect.snapchat.missingCredentials') || 'Snapchat API credentials are missing. Please contact the administrator.';
        } else if (error.message.includes('redirect') || error.message.includes('callback')) {
          errorMessage = t('connect.snapchat.redirectError') || 'Redirect URI issue. The callback URL needs to be added to your Snapchat app configuration.';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = t('connect.snapchat.authUrlError') || 'Failed to get authentication URL';
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnecting from Snapchat
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      
      // Call the disconnect endpoint
      const response = await apiRequest('DELETE', '/api/snapchat/disconnect');
      
      if (response.ok) {
        toast({
          title: t('connect.disconnectSuccessTitle') || 'Disconnected',
          description: t('connect.disconnectSuccessMessage') || 'Successfully disconnected your Snapchat account'
        });
        
        if (onDisconnect) {
          onDisconnect();
        }
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Snapchat disconnect error:', error);
      toast({
        title: t('connect.disconnectErrorTitle') || 'Disconnect Error',
        description: error instanceof Error ? error.message : 'Failed to disconnect Snapchat account',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render connected state
  if (isConnected) {
    return (
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex items-center justify-between p-4 bg-background border rounded-md">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <SiSnapchat className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="font-medium">{t('connect.snapchat.connected')}</p>
              {accountName && <p className="text-sm text-muted-foreground">{accountName}</p>}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDisconnect} 
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('connect.disconnect')}
          </Button>
        </div>
      </div>
    );
  }

  // Render connect button
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center justify-between p-4 bg-background border rounded-md">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <SiSnapchat className="h-8 w-8 text-yellow-400" />
          <div>
            <p className="font-medium">{t('connect.snapchat.title')}</p>
            <p className="text-sm text-muted-foreground">{t('connect.snapchat.description')}</p>
          </div>
        </div>
        <Button 
          onClick={handleConnect} 
          disabled={isLoading}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          {isLoading ? t('connect.snapchat.connecting') : t('connect.connect')}
        </Button>
      </div>
    </div>
  );
}