import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { queryClient } from "@/lib/queryClient";

export default function GoogleCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeGoogleAuth = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        
        if (error) {
          throw new Error(error);
        }
        
        if (!code) {
          throw new Error(t("auth.invalidCallback", "Invalid callback"));
        }

        console.log("Google callback received code:", code.substring(0, 10) + '...');

        // Exchange the code for user information
        const response = await apiRequest("POST", "/api/google/callback", { code });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Google auth API error:", errorData);
          throw new Error(errorData.message || "Failed to complete Google authentication");
        }

        const userData = await response.json();
        console.log("Successfully authenticated with Google");

        // Show success message
        toast({
          title: t("auth.successTitle", "تم تسجيل الدخول بنجاح"),
          description: t("auth.successDescription", "مرحبًا بك"),
        });

        // Ensure auth state is updated
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        
        try {
          // Try to fetch the updated user data
          await queryClient.fetchQuery({ queryKey: ['/api/auth/user'] });
          
          // Clear any stored redirect paths
          sessionStorage.removeItem('redirectAfterAuth');
          
          // Redirect to dashboard
          setLocation('/dashboard');
        } catch (authError) {
          console.error("Failed to update auth state:", authError);
          toast({
            title: t("auth.error", "خطأ"),
            description: t("auth.sessionError", "حدثت مشكلة في تحديث الجلسة، جاري إعادة التوجيه"),
            variant: "destructive",
          });
          
          // Force reload as a fallback
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      } catch (error: any) {
        console.error("Google callback processing error:", error);
        setError(error.message || t("auth.callbackError", "فشلت عملية المصادقة"));
        setIsProcessing(false);
        
        toast({
          title: t("auth.errorTitle", "خطأ في المصادقة"),
          description: error.message || t("auth.callbackError", "فشلت عملية المصادقة"),
          variant: "destructive",
        });
        
        // Redirect after a delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      }
    };

    completeGoogleAuth();
  }, [setLocation, toast, t]);
  
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {error ? (
        <div className="max-w-md p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold mb-4 text-white">{t("auth.authError", "خطأ في المصادقة")}</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
            onClick={() => window.location.href = "/login"}
          >
            {t("auth.backToLogin", "العودة إلى صفحة الدخول")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          <p className="mt-4 text-gray-300">{t("auth.completing", "جاري إتمام عملية المصادقة...")}</p>
        </div>
      )}
    </div>
  );
}