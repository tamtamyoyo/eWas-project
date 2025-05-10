import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

export default function FacebookCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeFacebookAuth = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        
        if (!code) {
          setError(t("connect.facebook.invalidCallback", "Invalid callback parameters"));
          setIsProcessing(false);
          return;
        }

        console.log("Facebook callback received with code, sending to server");
        
        // Send the code to the server to complete the OAuth process
        // Use fetch directly with specific options to ensure cookies are included
        const response = await fetch("/api/facebook/callback", {
          method: "POST",
          credentials: "include", // Critical for including cookies
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to complete Facebook authentication");
        }

        // Refresh user authentication status
        console.log("Facebook connection successful, refreshing auth state");
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });

        // Show success message
        toast({
          title: t("connect.successTitle", "Success"),
          description: t("connect.facebook.accountConnected", "Your Facebook account has been connected successfully."),
        });

        // Redirect back to the connect page with a full page reload
        // But delay slightly to allow session to be properly saved
        setTimeout(() => {
          window.location.href = "/connect";
        }, 1000);
      } catch (error: any) {
        console.error("Facebook callback processing error:", error);
        setError(error.message || t("connect.facebook.callbackError", "Failed to process authentication callback"));
        setIsProcessing(false);
        
        toast({
          title: t("connect.errorTitle", "Error"),
          description: error.message || t("connect.facebook.callbackError", "Failed to process authentication callback"),
          variant: "destructive",
        });
        
        // Redirect after a delay with a full page reload
        setTimeout(() => {
          window.location.href = "/connect";
        }, 5000);
      }
    };

    completeFacebookAuth();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          {isProcessing ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
              <h1 className="text-xl font-bold">{t("common.processing", "Processing")}</h1>
              <p className="text-neutral-500">{t("connect.facebook.completingAuth", "Completing Facebook authentication...")}</p>
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
              <h1 className="text-xl font-bold">{t("connect.errorTitle", "Error")}</h1>
              <p className="text-neutral-500">{error}</p>
              <p className="mt-4 text-sm">
                {t("connect.facebook.redirecting", "Redirecting you back to the connect page...")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}