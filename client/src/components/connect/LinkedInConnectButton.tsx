import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function LinkedInConnectButton({ accountData, onDisconnect }: {
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
        "/api/linkedin/complete-auth",
        { token }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("connect.successTitle", "تم الربط بنجاح"),
        description: t("connect.linkedin.connectSuccess", "تم ربط حساب لينكد إن بنجاح."),
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
        description: error.message || t("connect.linkedin.authError", "فشل إكمال ربط حساب لينكد إن"),
        variant: "destructive",
      });
      
      // Clear URL parameters even on error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
  
  // Handle URL parameters when redirected back from LinkedIn
  useEffect(() => {
    const handleLinkedInRedirect = async () => {
      // Parse URL search params
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const token = params.get('token');
      
      // Check if this is a LinkedIn connect redirect
      if (action === 'linkedin_connect' && token) {
        // Call the API to complete authentication
        setIsConnecting(true);
        try {
          await completeAuthMutation.mutateAsync(token);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    handleLinkedInRedirect();
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
        description: t("connect.linkedin.disconnectSuccess", "تم فصل حساب لينكد إن بنجاح."),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      if (onDisconnect) {
        onDisconnect('linkedin');
      }
    },
    onError: (error: any) => {
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.linkedin.disconnectError", "فشل فصل حساب لينكد إن."),
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
      console.log(`[${timestamp}] Starting LinkedIn auth process...`);
      
      const response = await fetch('/api/linkedin/auth');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${timestamp}] LinkedIn auth API error:`, errorData);
        throw new Error(errorData.message || t("connect.linkedin.authUrlError", "فشل الحصول على رابط المصادقة من لينكد إن."));
      }
      
      const data = await response.json();
      console.log(`[${timestamp}] LinkedIn auth response received:`, {
        hasAuthUrl: !!data.authUrl
      });
      
      if (data.authUrl) {
        // Store OAuth state in localStorage for the callback
        localStorage.setItem("ewasl_oauth_state", `linkedin_${Date.now()}`);
        
        console.log(`[${timestamp}] LinkedIn auth state saved, redirecting to LinkedIn...`);
        
        // Redirect to LinkedIn auth URL directly - no popup
        window.location.href = data.authUrl;
      } else {
        throw new Error(t("connect.linkedin.authUrlError", "فشل الحصول على رابط المصادقة من لينكد إن."));
      }
    } catch (error: any) {
      console.error("LinkedIn auth error:", error);
      
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.linkedin.authError", "فشل الاتصال بلينكد إن"),
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
              className="text-[#0077B5]"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>{accountData.accountName || accountData.username || 'LinkedIn Account'}</span>
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
          {t("connect.linkedin.connectedMessage", "تم ربط حساب لينكد إن الخاص بك. يمكنك الآن نشر المحتوى المهني وتحليل البيانات.")}
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
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      <span>
        {isConnecting ? t("connect.linkedin.connecting", "جاري الاتصال...") : t("connect.linkedin.connect", "ربط بلينكد إن")}
      </span>
    </Button>
  );
}