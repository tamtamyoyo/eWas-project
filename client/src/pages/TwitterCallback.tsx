import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

export default function TwitterCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeTwitterAuth = async () => {
      try {
        // Get the oauth_token and oauth_verifier from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const oauthToken = urlParams.get("oauth_token");
        const oauthVerifier = urlParams.get("oauth_verifier");
        const denied = urlParams.get("denied");
        
        if (denied) {
          throw new Error(t("connect.twitter.authDenied", "تم رفض تسجيل الدخول إلى تويتر"));
        }
        
        if (!oauthToken || !oauthVerifier) {
          throw new Error(t("connect.twitter.invalidCallback", "رابط استدعاء تويتر غير صالح"));
        }
        
        console.log("Twitter callback received with tokens");
        
        // Try to get token secret from different sources
        let oauthTokenSecret = null;
        
        // First check localStorage (may have been passed via secure token)
        const storedTokenSecret = localStorage.getItem("twitter_oauth_token_secret");
        const storedToken = localStorage.getItem("twitter_oauth_token");
        
        // If we have matching token and secret in localStorage, use it
        if (storedTokenSecret && storedToken && storedToken === oauthToken) {
          console.log("Found oauth_token_secret in localStorage");
          oauthTokenSecret = storedTokenSecret;
        }
        
        // Try to get it from secureToken if present
        const secureToken = localStorage.getItem("twitter_secure_token");
        if (!oauthTokenSecret && secureToken) {
          try {
            const tokenData = JSON.parse(atob(secureToken));
            if (tokenData.oauth_token_secret && tokenData.oauth_token === oauthToken) {
              console.log("Found oauth_token_secret in secureToken");
              oauthTokenSecret = tokenData.oauth_token_secret;
            }
          } catch (e) {
            console.error("Error parsing secureToken:", e);
          }
        }
        
        console.log("Sending Twitter callback data to server", {
          hasOauthToken: !!oauthToken,
          hasOauthVerifier: !!oauthVerifier,
          hasOauthTokenSecret: !!oauthTokenSecret
        });
        
        // Send the tokens to the server to complete the OAuth process
        const response = await fetch("/api/twitter/callback", {
          method: "POST",
          credentials: "include", // Critical for including cookies
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Cache-Control": "no-cache"
          },
          body: JSON.stringify({
            oauth_token: oauthToken,
            oauth_verifier: oauthVerifier,
            oauth_token_secret: oauthTokenSecret
          })
        });

        // Clear stored tokens for security
        localStorage.removeItem("twitter_oauth_token");
        localStorage.removeItem("twitter_oauth_token_secret");
        localStorage.removeItem("twitter_secure_token");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Twitter callback API error:", errorData);
          throw new Error(errorData.message || t("connect.twitter.callbackError", "خطأ في استدعاء تويتر"));
        }

        // Refresh user authentication status
        console.log("Twitter connection successful, refreshing auth state");
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });

        // Show success message
        toast({
          title: t("connect.successTitle", "تم بنجاح"),
          description: t("connect.twitter.accountConnected", "تم ربط حساب تويتر بنجاح"),
        });

        // Redirect back to the connect page
        setTimeout(() => {
          window.location.href = "/connect?success=twitter_connected";
        }, 1000);
      } catch (error: any) {
        console.error("Twitter callback processing error:", error);
        setError(error.message || t("connect.twitter.callbackError", "خطأ في استدعاء تويتر"));
        setIsProcessing(false);
        
        toast({
          title: t("connect.errorTitle", "خطأ"),
          description: error.message || t("connect.twitter.callbackError", "خطأ في استدعاء تويتر"),
          variant: "destructive",
        });
        
        // Redirect after a delay with a full page reload
        setTimeout(() => {
          window.location.href = "/connect?error=twitter_connection_failed";
        }, 5000);
      }
    };

    completeTwitterAuth();
  }, [setLocation, toast, t]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          {isProcessing ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
              <h1 className="text-xl font-bold">{t("common.processing", "جاري المعالجة")}</h1>
              <p className="text-neutral-500">{t("connect.twitter.completingAuth", "جاري إكمال عملية المصادقة مع تويتر...")}</p>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-bold">{t("connect.errorTitle", "خطأ")}</h1>
              <p className="text-neutral-500">{error}</p>
              <p className="mt-4 text-sm">
                {t("connect.twitter.redirecting", "جاري إعادة التوجيه...")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}