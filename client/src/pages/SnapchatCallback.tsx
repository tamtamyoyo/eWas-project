import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function SnapchatCallback() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string>('');

  useEffect(() => {
    // Store the current URL for diagnostics
    setCallbackUrl(window.location.href);
    
    // Parse the URL search params to get the code parameter
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      setStatus('error');
      setErrorMessage(error);
      if (errorDescription) {
        setErrorDetails(errorDescription);
      }
      return;
    }
    
    if (!code) {
      setStatus('error');
      setErrorMessage(t('connect.snapchat.callback.noCode') || 'No authorization code found');
      setErrorDetails(t('connect.snapchat.redirectError') || 'This may be due to an incorrect redirect URI configuration in your Snapchat app');
      return;
    }
    
    // Call the API to exchange the code for tokens
    const handleCallback = async () => {
      try {
        // Log the code being sent (without revealing the full code for security)
        const maskedCode = code.substring(0, 4) + '...' + code.substring(code.length - 4);
        console.log(`Processing Snapchat callback with code starting with ${maskedCode}`);
        
        const response = await apiRequest('POST', '/api/snapchat/callback', { code });
        
        if (response.ok) {
          setStatus('success');
          // Store success in localStorage so we can refresh the connect page
          localStorage.setItem('snapchat_connected', 'true');
          toast({
            title: t('connect.snapchat.callback.success') || 'Connected to Snapchat',
            description: t('connect.snapchat.callback.accountConnected') || 'Your Snapchat account has been successfully connected',
          });
        } else {
          const data = await response.json();
          console.error('Snapchat callback API error:', data);
          setStatus('error');
          setErrorMessage(data.message || t('connect.snapchat.callback.unknownError') || 'Unknown error occurred');
          
          // Extract any additional error details from the response
          if (data.error) {
            setErrorDetails(typeof data.error === 'string' ? data.error : JSON.stringify(data.error, null, 2));
          }
        }
      } catch (error) {
        console.error('Error exchanging code:', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : t('connect.snapchat.callback.unknownError') || 'Unknown error occurred'
        );
      }
    };
    
    handleCallback();
  }, [t, toast]);

  // Function to navigate back to the connect page
  const handleBackToConnect = () => {
    navigate('/connect');
  };

  // Render loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto max-w-md py-20">
        <Card>
          <CardHeader>
            <CardTitle>{t('connect.snapchat.callback.title') || 'Snapchat Authentication'}</CardTitle>
            <CardDescription>
              {t('connect.snapchat.callback.processing') || 'Processing your Snapchat authentication...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Spinner className="w-10 h-10 mb-4" />
            <p className="text-center">{t('connect.snapchat.callback.processing') || 'Please wait while we connect your account...'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render success state
  if (status === 'success') {
    return (
      <div className="container mx-auto max-w-md py-20">
        <Card>
          <CardHeader>
            <CardTitle>{t('connect.snapchat.callback.success') || 'Connected to Snapchat'}</CardTitle>
            <CardDescription>
              {t('connect.snapchat.callback.accountConnected') || 'Your Snapchat account has been successfully connected.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
            <p className="text-center mb-6">
              {t('connect.snapchat.callback.accountConnected') || 'Your Snapchat account has been successfully connected.'}
            </p>
            <Button onClick={handleBackToConnect}>
              {t('connect.snapchat.callback.backToConnect') || 'Back to Connect Accounts'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  return (
    <div className="container mx-auto max-w-md py-20">
      <Card>
        <CardHeader>
          <CardTitle>{t('connect.snapchat.callback.error') || 'Snapchat Authentication Error'}</CardTitle>
          <CardDescription>
            {t('connect.snapchat.callback.errorDescription') || 'There was a problem connecting your Snapchat account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
          <p className="text-center text-red-500 mb-2 font-medium">
            {t('connect.snapchat.callback.error') || 'Authentication Error'}
          </p>
          <p className="text-center mb-6">
            {errorMessage}
          </p>
          
          {/* Help section with troubleshooting information */}
          <Collapsible className="w-full mb-6 border rounded-md p-2">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-2">
              <div className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                <span>{t('common.troubleshooting') || 'Troubleshooting'}</span>
              </div>
              {showDiagnostics ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pt-2 pb-4 text-sm">
              <p className="mb-2 font-medium">{t('common.possibleSolutions') || 'Possible Solutions'}:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>{t('connect.snapchat.troubleshooting.checkRedirectUri') || 'Check that your Snapchat app has the correct redirect URI configured'}</li>
                <li>{t('connect.snapchat.troubleshooting.checkPermissions') || 'Ensure your Snapchat app has the necessary permissions'}</li>
                <li>{t('connect.snapchat.troubleshooting.tryAgain') || 'Try connecting again after a few minutes'}</li>
              </ul>
              
              {errorDetails && (
                <div className="mt-2">
                  <p className="font-medium mb-1">{t('common.details') || 'Details'}:</p>
                  <p className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {errorDetails}
                  </p>
                </div>
              )}
              
              <div className="mt-3">
                <p className="font-medium mb-1">{t('connect.snapchat.troubleshooting.callbackUrl') || 'Callback URL'}:</p>
                <p className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                  {callbackUrl}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <Button onClick={handleBackToConnect}>
            {t('connect.snapchat.callback.backToConnect') || 'Back to Connect Accounts'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}