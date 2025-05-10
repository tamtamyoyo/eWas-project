import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function TwitterConnectButton({ accountData, onDisconnect }: {
  accountData?: any;
  onDisconnect?: (platform: string) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  
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
        description: t("connect.twitter.disconnectSuccess", "تم فصل حساب تويتر بنجاح."),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      if (onDisconnect) {
        onDisconnect('twitter');
      }
    },
    onError: (error: any) => {
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.twitter.disconnectError", "فشل فصل حساب تويتر."),
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
      console.log(`[${timestamp}] Starting Twitter auth process...`);
      
      const response = await fetch('/api/twitter/auth', {
        credentials: 'include' // Include cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${timestamp}] Twitter auth API error:`, errorData);
        
        // Check for different error types and provide more helpful messaging
        if (errorData.message && errorData.message.includes("401 Unauthorized")) {
          throw new Error(t("connect.twitter.unauthorizedError", "خطأ في المصادقة: أوراق اعتماد Twitter API غير صالحة. يرجى الاتصال بالدعم."));
        } else if (errorData.message && errorData.message.includes("timeout")) {
          throw new Error(t("connect.twitter.timeoutError", "انتهت مهلة الاتصال بخدمة Twitter. يرجى المحاولة مرة أخرى."));
        } else if (errorData.message && errorData.message.includes("credentials")) {
          throw new Error(t("connect.twitter.credentialsError", "بيانات اعتماد واجهة برمجة تطبيقات Twitter غير مكتملة أو غير صالحة. يرجى الاتصال بالدعم."));
        } else if (errorData.message && errorData.message.includes("callback")) {
          throw new Error(t("connect.twitter.callbackError", "عنوان URL لإعادة توجيه Twitter غير صالح. يرجى الاتصال بالدعم."));
        } else {
          throw new Error(errorData.message || t("connect.twitter.authUrlError", "فشل الحصول على رابط المصادقة من تويتر."));
        }
      }
      
      const data = await response.json();
      console.log(`[${timestamp}] Twitter auth response received:`, {
        hasAuthUrl: !!data.authUrl,
        hasOauthToken: !!data.oauth_token
      });
      
      if (data.authUrl && data.oauth_token) {
        // Store OAuth tokens in localStorage for the callback to retrieve
        localStorage.setItem("ewasl_oauth_state", `twitter_${Date.now()}`);
        
        // Store the tokens in localStorage for direct access in the callback handler
        localStorage.setItem("ewasl_oauth_token", data.oauth_token);
        
        // Store oauth_token_secret in localStorage as it's required to complete the flow
        if (data.oauth_token_secret) {
          localStorage.setItem("ewasl_oauth_secret", data.oauth_token_secret);
        }
        
        console.log(`[${timestamp}] Twitter auth tokens saved, redirecting to Twitter...`);
        
        // Redirect to Twitter auth URL directly
        window.location.href = data.authUrl;
      } else {
        throw new Error(t("connect.twitter.authUrlError", "فشل الحصول على رابط المصادقة من تويتر."));
      }
    } catch (error: any) {
      console.error("Twitter auth error:", error);
      
      toast({
        title: t("connect.errorTitle", "حدث خطأ"),
        description: error.message || t("connect.twitter.authError", "فشل الاتصال بتويتر"),
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
              className="text-[#1DA1F2]"
            >
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
            <span>{accountData.accountName || accountData.username || 'Twitter Account'}</span>
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
          {t("connect.twitter.connectedMessage", "تم ربط حساب تويتر الخاص بك. يمكنك الآن نشر تغريدات وتحليل البيانات.")}
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
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
      </svg>
      <span>
        {isConnecting ? t("connect.twitter.connecting", "جاري الاتصال...") : t("connect.twitter.connect", "ربط بتويتر")}
      </span>
    </Button>
  );
}