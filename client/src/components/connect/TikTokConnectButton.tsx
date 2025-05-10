import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function TikTokConnectButton({ accountData, onDisconnect }: {
  accountData?: any;
  onDisconnect?: (platform: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [location] = useLocation();
  
  // Complete auth mutation for handling token from redirect
  const completeAuthMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest(
        "POST",
        "/api/tiktok/complete-auth",
        { token }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("connect.successTitle", "تم الربط بنجاح"),
        description: t("connect.tiktok.connectSuccess", "تم ربط حساب تيك توك بنجاح."),
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
        description: error.message || t("connect.tiktok.authError", "فشل إكمال ربط حساب تيك توك"),
        variant: "destructive",
      });
      
      // Clear URL parameters even on error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
  
  // Handle URL parameters when redirected back from TikTok
  useEffect(() => {
    const handleTikTokRedirect = async () => {
      // Parse URL search params
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const token = params.get('token');
      
      // Check if this is a TikTok connect redirect
      if (action === 'tiktok_connect' && token) {
        // Call the API to complete authentication
        setIsConnecting(true);
        try {
          await completeAuthMutation.mutateAsync(token);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    handleTikTokRedirect();
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
        description: t("connect.tiktok.disconnectSuccess", "تم فصل حساب تيك توك بنجاح."),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      if (onDisconnect) {
        onDisconnect('tiktok');
      }
    },
    onError: (error: any) => {
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.tiktok.disconnectError", "فشل فصل حساب تيك توك."),
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
      
      // Add a timestamp to help with debugging
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Starting TikTok auth process...`);
      
      const response = await fetch('/api/tiktok/auth-url');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${timestamp}] TikTok auth API error:`, errorData);
        throw new Error(errorData.message || t("connect.tiktok.authUrlError", "فشل الحصول على رابط المصادقة من تيك توك."));
      }
      
      const data = await response.json();
      console.log(`[${timestamp}] TikTok auth response received:`, {
        hasUrl: !!data.url
      });
      
      if (data.url) {
        // Store OAuth state in localStorage for the callback
        localStorage.setItem("ewasl_oauth_state", `tiktok_${Date.now()}`);
        
        console.log(`[${timestamp}] TikTok auth state saved, redirecting to TikTok...`);
        
        // Redirect to TikTok auth URL directly - no popup
        window.location.href = data.url;
      } else {
        throw new Error(t("connect.tiktok.authUrlError", "فشل الحصول على رابط المصادقة من تيك توك."));
      }
    } catch (error: any) {
      console.error("TikTok auth error:", error);
      
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.tiktok.authError", "فشل الاتصال بتيك توك"),
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
              className="text-black"
            >
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
            </svg>
            <span>{accountData.accountName || accountData.username || 'TikTok Account'}</span>
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
          {t("connect.tiktok.connectedMessage", "تم ربط حساب تيك توك الخاص بك. يمكنك الآن نشر المحتوى وتحليل البيانات.")}
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
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
      <span>
        {isConnecting ? t("connect.tiktok.connecting", "جاري الاتصال...") : t("connect.tiktok.connect", "ربط بتيك توك")}
      </span>
    </Button>
  );
}