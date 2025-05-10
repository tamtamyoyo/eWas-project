import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function YouTubeConnectButton({ accountData, onDisconnect }: {
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
        "/api/youtube/complete-auth",
        { token }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("connect.successTitle", "تم الربط بنجاح"),
        description: t("connect.youtube.connectSuccess", "تم ربط حساب يوتيوب بنجاح."),
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
        description: error.message || t("connect.youtube.authError", "فشل إكمال ربط حساب يوتيوب"),
        variant: "destructive",
      });
      
      // Clear URL parameters even on error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
  
  // Handle URL parameters when redirected back from YouTube
  useEffect(() => {
    const handleYouTubeRedirect = async () => {
      // Parse URL search params
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const token = params.get('token');
      
      // Check if this is a YouTube connect redirect
      if (action === 'youtube_connect' && token) {
        // Call the API to complete authentication
        setIsConnecting(true);
        try {
          await completeAuthMutation.mutateAsync(token);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    handleYouTubeRedirect();
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
        description: t("connect.youtube.disconnectSuccess", "تم فصل حساب يوتيوب بنجاح."),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      if (onDisconnect) {
        onDisconnect('youtube');
      }
    },
    onError: (error: any) => {
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.youtube.disconnectError", "فشل فصل حساب يوتيوب."),
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
      console.log(`[${timestamp}] Starting YouTube auth process...`);
      
      const response = await fetch('/api/youtube/auth-url');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${timestamp}] YouTube auth API error:`, errorData);
        throw new Error(errorData.message || t("connect.youtube.authUrlError", "فشل الحصول على رابط المصادقة من يوتيوب."));
      }
      
      const data = await response.json();
      console.log(`[${timestamp}] YouTube auth response received:`, {
        hasUrl: !!data.url
      });
      
      if (data.url) {
        // Store OAuth state in localStorage for the callback
        localStorage.setItem("ewasl_oauth_state", `youtube_${Date.now()}`);
        
        console.log(`[${timestamp}] YouTube auth state saved, redirecting to YouTube...`);
        
        // Redirect to YouTube auth URL directly - no popup
        window.location.href = data.url;
      } else {
        throw new Error(t("connect.youtube.authUrlError", "فشل الحصول على رابط المصادقة من يوتيوب."));
      }
    } catch (error: any) {
      console.error("YouTube auth error:", error);
      
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.youtube.authError", "فشل الاتصال بيوتيوب"),
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
              className="text-red-600"
            >
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
            <span>{accountData.accountName || accountData.username || 'YouTube Channel'}</span>
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
          {t("connect.youtube.connectedMessage", "تم ربط قناة يوتيوب الخاصة بك. يمكنك الآن نشر مقاطع الفيديو وتحليل البيانات.")}
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
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
      </svg>
      <span>
        {isConnecting ? t("connect.youtube.connecting", "جاري الاتصال...") : t("connect.youtube.connect", "ربط بيوتيوب")}
      </span>
    </Button>
  );
}