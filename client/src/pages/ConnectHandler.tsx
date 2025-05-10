import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ConnectHandler() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loginMutation } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<"connecting" | "success" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const handleConnection = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get("action");
        const error = urlParams.get("error");
        const errorMessage = urlParams.get("message");
        const denied = urlParams.get("denied");
        const userToken = localStorage.getItem("ewasl_user_token");
        const oauthState = localStorage.getItem("ewasl_oauth_state");
        const oauthSecret = localStorage.getItem("ewasl_oauth_secret");
        
        // Handle user denied permissions
        if (denied) {
          console.error("User denied OAuth permissions");
          setStatus("error");
          setError(t("connect.permissionDenied", "Permission was denied. Please allow all requested permissions to connect your account."));
          setIsProcessing(false);
          
          toast({
            title: t("connect.errorTitle", "Error"),
            description: t("connect.permissionDenied", "Permission was denied. Please allow all requested permissions to connect your account."),
            variant: "destructive",
          });
          
          setTimeout(() => {
            window.location.href = "/connect";
          }, 3000);
          return;
        }
        
        // Handle errors from OAuth provider
        if (error) {
          console.error(`OAuth error: ${error}, message: ${errorMessage}`);
          setStatus("error");
          setError(errorMessage || t("connect.genericError", "An error occurred during authentication"));
          setIsProcessing(false);
          
          toast({
            title: t("connect.errorTitle", "Error"),
            description: errorMessage || t("connect.genericError", "An error occurred during authentication"),
            variant: "destructive",
          });
          
          setTimeout(() => {
            window.location.href = "/connect";
          }, 3000);
          return;
        }
        
        // Get OAuth parameters based on platform
        // LinkedIn-specific parameters
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        
        // Twitter-specific parameters
        const oauthToken = urlParams.get("oauth_token");
        const oauthVerifier = urlParams.get("oauth_verifier");
        
        // Determine which platform we're connecting based on URL parameters or stored state
        let detectedPlatform = null;
        
        if (action?.includes("facebook")) {
          detectedPlatform = "Facebook";
        } else if (action?.includes("instagram")) {
          detectedPlatform = "Instagram";
        } else if (action?.includes("twitter") || (oauthToken && oauthVerifier)) {
          detectedPlatform = "Twitter";
        } else if (action?.includes("linkedin") || (code && state && state.includes("linkedin"))) {
          detectedPlatform = "LinkedIn";
        } else if (action?.includes("snapchat")) {
          detectedPlatform = "Snapchat";
        } else if (state) {
          // Try to determine platform from state
          if (state.includes("facebook")) {
            detectedPlatform = "Facebook";
          } else if (state.includes("instagram")) {
            detectedPlatform = "Instagram";
          } else if (state.includes("twitter")) {
            detectedPlatform = "Twitter";
          } else if (state.includes("linkedin")) {
            detectedPlatform = "LinkedIn";
          } else if (state.includes("snapchat")) {
            detectedPlatform = "Snapchat";
          }
        }
        
        // Update UI with detected platform
        setPlatform(detectedPlatform);
        console.log(`Detected platform: ${detectedPlatform}`);
        
        // Check we have what we need to complete the connection
        if (!detectedPlatform) {
          console.error("Could not determine social platform from URL parameters");
          setStatus("error");
          setError(t("connect.unknownPlatform", "Could not determine which social platform to connect"));
          setIsProcessing(false);
          return;
        }
        
        // Check for required platform-specific parameters
        const missingParams = [];
        if (detectedPlatform === "LinkedIn" && !code) {
          missingParams.push("code");
        }
        if (detectedPlatform === "Twitter" && (!oauthToken || !oauthVerifier)) {
          if (!oauthToken) missingParams.push("oauth_token");
          if (!oauthVerifier) missingParams.push("oauth_verifier");
        }
        if ((detectedPlatform === "Facebook" || detectedPlatform === "Instagram") && !code) {
          missingParams.push("code");
        }
        
        if (missingParams.length > 0) {
          console.error(`Missing required parameters: ${missingParams.join(", ")}`);
          setStatus("error");
          setError(t("connect.missingParams", "Missing required parameters: {{params}}", {
            params: missingParams.join(", ")
          }));
          setIsProcessing(false);
          return;
        }
        
        console.log(`Handling ${detectedPlatform} connection...`);
        
        // First, restore user authentication if we have a stored token
        if (userToken && !user) {
          console.log("Restoring user session from stored token...");
          try {
            // Get user credentials from stored token
            const userData = JSON.parse(atob(userToken));
            if (userData.email && userData.password) {
              console.log("Found valid credentials, logging in...");
              
              // Log in with stored credentials
              await loginMutation.mutateAsync({
                email: userData.email,
                password: userData.password
              });
              
              console.log("Login successful, continuing with social connection");
            }
          } catch (tokenError) {
            console.error("Error parsing stored user token:", tokenError);
          }
        }
        
        // Determine which API endpoint to call and prepare request data
        let endpoint = "";
        let requestData = {};
        
        if (detectedPlatform === "Facebook") {
          endpoint = "/api/facebook/complete-auth";
          requestData = { code };
        } else if (detectedPlatform === "Instagram") {
          endpoint = "/api/instagram/complete-auth";
          requestData = { code };
        } else if (detectedPlatform === "Twitter") {
          endpoint = "/api/twitter/complete-auth";
          requestData = { 
            oauth_token: oauthToken, 
            oauth_verifier: oauthVerifier,
            oauth_token_secret: oauthSecret // Retrieved from localStorage
          };
        } else if (detectedPlatform === "LinkedIn") {
          endpoint = "/api/linkedin/complete-auth";
          requestData = { code, state };
        } else if (detectedPlatform === "Snapchat") {
          endpoint = "/api/snapchat/complete-auth";
          requestData = { code };
        } else {
          throw new Error("Unknown social platform");
        }
        
        // Complete the connection using platform-specific parameters
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to complete ${platform || 'social media'} authentication`);
        }
        
        // Success! Connection complete
        console.log(`${platform || 'Social media'} connection successful`);
        setStatus("success");
        
        // Refresh data
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
        
        // Show success message
        toast({
          title: t("connect.successTitle", "Success"),
          description: t(`connect.${platform?.toLowerCase() || 'social'}.accountConnected`, `Your ${platform || 'social media'} account has been connected successfully.`),
        });
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = "/connect";
        }, 2000);
      } catch (error: any) {
        console.error("Connection handler error:", error);
        setStatus("error");
        setError(error.message || t("connect.genericError", "An error occurred during authentication"));
        setIsProcessing(false);
        
        toast({
          title: t("connect.errorTitle", "Error"),
          description: error.message || t("connect.genericError", "An error occurred during authentication"),
          variant: "destructive",
        });
        
        // Redirect after delay
        setTimeout(() => {
          window.location.href = "/connect";
        }, 3000);
      }
    };
    
    handleConnection();
  }, []);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md text-center">
        <div className="mb-6">
          {status === "connecting" ? (
            <>
              <div className="mb-4 flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <h1 className="text-xl font-bold">{t("common.connecting", "Connecting...")}</h1>
              <p className="text-muted-foreground">
                {platform ? 
                  t(`connect.${platform.toLowerCase()}.connecting`, `Connecting to ${platform}...`) :
                  t("connect.genericConnecting", "Completing social media connection...")}
              </p>
            </>
          ) : status === "success" ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-bold">{t("connect.successTitle", "Success")}</h1>
              <p className="text-muted-foreground">
                {platform ? 
                  t(`connect.${platform.toLowerCase()}.success`, `Successfully connected to ${platform}`) :
                  t("connect.genericSuccess", "Social media account connected successfully")}
              </p>
              <p className="mt-4 text-sm">
                {t("connect.redirectingToConnect", "Redirecting to connect page...")}
              </p>
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
              <p className="text-muted-foreground">{error}</p>
              <p className="mt-4 text-sm">
                {t("connect.redirectingToConnect", "Redirecting to connect page...")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}