import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function InstagramConnectButton({ accountData, onDisconnect }: {
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
        "/api/instagram/complete-auth",
        { token }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("connect.successTitle", "تم الربط بنجاح"),
        description: t("connect.instagram.connectSuccess", "تم ربط حساب انستغرام بنجاح."),
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
        description: error.message || t("connect.instagram.authError", "فشل إكمال ربط حساب انستغرام"),
        variant: "destructive",
      });
      
      // Clear URL parameters even on error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
  
  // Handle URL parameters when redirected back from Instagram
  useEffect(() => {
    const handleInstagramRedirect = async () => {
      // Parse URL search params
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const token = params.get('token');
      
      // Check if this is an Instagram connect redirect
      if (action === 'instagram_connect' && token) {
        // Call the API to complete authentication
        setIsConnecting(true);
        try {
          await completeAuthMutation.mutateAsync(token);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    handleInstagramRedirect();
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
        description: t("connect.instagram.disconnectSuccess", "تم فصل حساب انستغرام بنجاح."),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      if (onDisconnect) {
        onDisconnect('instagram');
      }
    },
    onError: (error: any) => {
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.instagram.disconnectError", "فشل فصل حساب انستغرام."),
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
      console.log(`[${timestamp}] Starting Instagram auth process...`);
      
      const response = await fetch('/api/instagram/auth');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${timestamp}] Instagram auth API error:`, errorData);
        throw new Error(errorData.message || t("connect.instagram.authUrlError", "فشل الحصول على رابط المصادقة من انستغرام."));
      }
      
      const data = await response.json();
      console.log(`[${timestamp}] Instagram auth response received:`, {
        hasAuthUrl: !!data.authUrl
      });
      
      if (data.authUrl) {
        // Store OAuth state in localStorage for the callback
        localStorage.setItem("ewasl_oauth_state", `instagram_${Date.now()}`);
        
        console.log(`[${timestamp}] Instagram auth state saved, redirecting to Instagram...`);
        
        // Redirect to Instagram auth URL directly - no popup
        window.location.href = data.authUrl;
      } else {
        throw new Error(t("connect.instagram.authUrlError", "فشل الحصول على رابط المصادقة من انستغرام."));
      }
    } catch (error: any) {
      console.error("Instagram auth error:", error);
      
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.instagram.authError", "فشل الاتصال بانستغرام"),
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
              className="text-[#E1306C]"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>{accountData.accountName || accountData.username || 'Instagram Account'}</span>
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
          {t("connect.instagram.connectedMessage", "تم ربط حساب انستغرام الخاص بك. يمكنك الآن نشر المحتوى وتحليل البيانات.")}
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
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
      <span>
        {isConnecting ? t("connect.instagram.connecting", "جاري الاتصال...") : t("connect.instagram.connect", "ربط بانستغرام")}
      </span>
    </Button>
  );
}