import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function FacebookConnectButton({ accountData, onDisconnect }: {
  accountData?: any;
  onDisconnect?: (platform: string) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [location] = useLocation();
  
  // Complete auth mutation for handling token from redirect
  const completeAuthMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest(
        "POST",
        "/api/facebook/complete-auth",
        { token }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("connect.successTitle", "تم الربط بنجاح"),
        description: t("connect.facebook.connectSuccess", "تم ربط صفحة فيسبوك بنجاح."),
        variant: "default",
      });
      
      // Refresh social accounts list
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      
      // Clear URL parameters to avoid retrying on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    },
    onError: (error: any) => {
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.facebook.authError", "فشل إكمال ربط حساب فيسبوك"),
        variant: "destructive",
      });
      
      // Clear URL parameters even on error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
  
  // Handle URL parameters when redirected back from Facebook
  useEffect(() => {
    const handleFacebookRedirect = async () => {
      // Parse URL search params
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const token = params.get('token');
      
      // Check if this is a Facebook connect redirect
      if (action === 'facebook_connect' && token) {
        // Call the API to complete authentication
        setIsConnecting(true);
        try {
          await completeAuthMutation.mutateAsync(token);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    handleFacebookRedirect();
  // Only run on first mount or when location changes
  }, [location]);
  
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/social-accounts/${accountData.id}`
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("connect.disconnectSuccessTitle", "تم فصل الحساب"),
        description: t("connect.facebook.disconnectSuccess", "تم فصل حساب فيسبوك بنجاح."),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      if (onDisconnect) {
        onDisconnect('facebook');
      }
    },
    onError: (error: any) => {
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.facebook.disconnectError", "فشل فصل حساب فيسبوك."),
        variant: "destructive",
      });
    },
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Store user credentials for reconnection if authentication is lost
      const user = localStorage.getItem('ewasl_user');
      if (user) {
        // Store in a temporary token for potential restoration
        const userData = JSON.parse(user);
        if (userData.email && userData.password) {
          const userToken = btoa(JSON.stringify({
            email: userData.email,
            password: userData.password
          }));
          localStorage.setItem('ewasl_user_token', userToken);
        }
      }
      
      const response = await fetch('/api/facebook/auth', {
        credentials: 'include' // Include cookies
      });
      const data = await response.json();
      
      if (data.authUrl) {
        // If state is provided, store it for verification
        if (data.state) {
          localStorage.setItem("facebook_auth_state", data.state);
        }
        
        // Generate a token that will be passed back to the connect-handler
        const connectToken = crypto.randomUUID();
        localStorage.setItem("facebook_connect_token", connectToken);

        // Open a popup window for Facebook auth
        const width = 600;
        const height = 700;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        
        // Update the auth URL to include our token
        const authUrlWithToken = `${data.authUrl}&connect_token=${connectToken}`;
        
        const popup = window.open(
          authUrlWithToken,
          'facebook-auth',
          `width=${width},height=${height},top=${top},left=${left}`
        );
        
        // Check URL for successful connection or errors
        const checkPopupUrl = setInterval(() => {
          try {
            // Check if popup is still open and if it's accessible
            if (!popup || popup.closed) {
              clearInterval(checkPopupUrl);
              setIsConnecting(false);
              return;
            }
            
            // Check if we've been redirected back to our domain with success or error
            const currentUrl = popup.location.href;
            
            // Success case - redirected to our callback URL
            if (currentUrl.includes('/auth/facebook/callback')) {
              // The callback will redirect to our connect-handler
              popup.location.href = `/connect-handler?action=facebook_connect&token=${connectToken}`;
              clearInterval(checkPopupUrl);
              popup.close();
              setIsConnecting(false);
              return;
            }
            
            // Success case - already at connect-handler
            if (currentUrl.includes('/connect-handler')) {
              clearInterval(checkPopupUrl);
              popup.close();
              setIsConnecting(false);
              
              // Refresh accounts after a short delay
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
              }, 1000);
              return;
            }
            
            // Error case - our callback page with error parameter
            if (currentUrl.includes('/connect') && currentUrl.includes('error=facebook')) {
              clearInterval(checkPopupUrl);
              popup.close();
              setIsConnecting(false);
              
              // Extract error message if available
              const urlObj = new URL(currentUrl);
              const errorMessage = urlObj.searchParams.get('message');
              
              toast({
                title: t("connect.errorTitle", "حدث خطأ"),
                description: errorMessage || t("connect.facebook.authError", "فشل الاتصال بفيسبوك"),
                variant: "destructive",
              });
              return;
            }
          } catch (e) {
            // This will throw security error if popup URL is on a different domain
            // which is expected when redirecting to Facebook
            // Just continue checking until it's back on our domain
          }
        }, 1000);
        
        // Also check if the popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            clearInterval(checkPopupUrl); // Clear the URL checker too
            if (isConnecting) {
              setIsConnecting(false);
              toast({
                title: t("connect.cancelledTitle", "تم إلغاء العملية"),
                description: t("connect.facebook.authCancelled", "تم إلغاء عملية المصادقة مع فيسبوك."),
                variant: "default",
              });
            }
          }
        }, 500);
        
      } else {
        throw new Error(t("connect.facebook.authUrlError", "فشل الحصول على رابط المصادقة من فيسبوك."));
      }
    } catch (error: any) {
      console.error("Facebook auth error:", error);
      
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.facebook.authError", "فشل الاتصال بفيسبوك"),
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = () => {
    if (accountData && accountData.id) {
      disconnectMutation.mutate();
    }
  };

  if (accountData) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[#4267B2]"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.736-.9 10.125-5.866 10.125-11.854z"/>
            </svg>
            <span>{accountData.accountName || accountData.username || 'Facebook Page'}</span>
          </div>
          <Button 
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
          >
            {disconnectMutation.isPending 
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              : t("connect.disconnect", "فصل")
            }
          </Button>
        </div>
        <div className="text-muted-foreground text-sm">
          {t("connect.facebook.connectedMessage", "تم ربط صفحة فيسبوك الخاصة بك. يمكنك الآن نشر المحتوى وتحليل البيانات.")}
        </div>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isConnecting}
      className="flex items-center space-x-2 rtl:space-x-reverse"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24"
        fill="currentColor"
        className="inline-block"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.736-.9 10.125-5.866 10.125-11.854z"/>
      </svg>
      <span>
        {isConnecting ? t("connect.facebook.connecting", "جاري الاتصال...") : t("connect.facebook.connect", "ربط بفيسبوك")}
      </span>
    </Button>
  );
}