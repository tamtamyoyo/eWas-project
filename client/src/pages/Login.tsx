import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// Form validation schema
const formSchema = z.object({
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صالح",
  }),
  password: z.string().min(6, {
    message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const [location, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login, refetchUser } = useAuth();
  const isRtl = i18n.language === 'ar';
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Handle Google OAuth callback
  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const token = params.get('token');
    const errorParam = params.get('error');
    
    // Handle Google Auth callback with token
    if (action === 'google_auth' && token) {
      try {
        setGoogleLoading(true);
        console.log("Processing Google OAuth callback");
        
        // Decode the token
        const decodedData = JSON.parse(atob(token));
        
        if (!decodedData.code) {
          throw new Error("Invalid callback data");
        }
        
        // Check if token is still valid (5 minutes)
        if (Date.now() - decodedData.timestamp > 300000) {
          throw new Error("Authentication session expired");
        }
        
        // Call API endpoint to complete Google authentication
        handleGoogleCallback(decodedData.code);
      } catch (error: any) {
        console.error("Failed to process Google callback:", error);
        setGoogleLoading(false);
        toast({
          title: t('auth.googleAuthError', 'خطأ في تسجيل الدخول بجوجل'),
          description: error.message || "حدث خطأ أثناء إكمال عملية تسجيل الدخول",
          variant: "destructive"
        });
        
        // Clean up URL
        window.history.replaceState({}, document.title, "/login");
      }
    }
    
    // Handle error parameter
    else if (errorParam) {
      const errorMessage = params.get('message') || "Unknown error";
      toast({
        title: t('auth.loginError', 'خطأ في تسجيل الدخول'),
        description: decodeURIComponent(errorMessage),
        variant: "destructive"
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, "/login");
    }
  }, [location]);
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Enhanced form submission with better error handling
  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);
      console.log("Login attempt with:", values.email);
      
      // Clear any previous form errors
      form.clearErrors();
      
      // Validate inputs before submitting
      if (!values.email || !values.email.includes('@')) {
        form.setError('email', { 
          type: 'manual', 
          message: t('validation.invalidEmail', 'يرجى إدخال بريد إلكتروني صالح') 
        });
        setIsLoading(false);
        return;
      }
      
      if (!values.password || values.password.length < 6) {
        form.setError('password', { 
          type: 'manual', 
          message: t('validation.passwordTooShort', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل') 
        });
        setIsLoading(false);
        return;
      }
      
      // Using the login function from useAuth hook
      login({
        email: values.email,
        password: values.password
      });
      
      // The login function handles success toasts and navigation via its mutation
      // When successful, we should be redirected to the dashboard
    } catch (error: any) {
      console.error("Login form error:", error);
      toast({
        title: t('auth.loginError', 'خطأ في تسجيل الدخول'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Enhanced Google sign-in with proper API request
  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      console.log("Initiating Google OAuth");
      
      // First fetch the auth URL from our backend
      const response = await fetch("/api/google/auth", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        }
      });
      
      if (!response.ok) {
        // Handle error responses
        const errorData = await response.json().catch(() => ({ message: "Failed to get auth URL" }));
        throw new Error(errorData.message || "Failed to initialize Google login");
      }
      
      // Parse the response to get the Google auth URL
      const data = await response.json();
      
      if (!data.authUrl) {
        throw new Error("No authentication URL received from server");
      }
      
      console.log("Redirecting to Google OAuth:", data.authUrl);
      
      // Redirect to Google's authorization page
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: t('auth.googleAuthError', 'خطأ في تسجيل الدخول بجوجل'),
        description: error.message || "Failed to initiate Google login",
        variant: "destructive"
      });
      setGoogleLoading(false);
    }
  }
  
  // Process the Google OAuth callback
  async function handleGoogleCallback(code: string) {
    try {
      console.log("Processing Google authentication code");
      
      // Exchange the code for user data
      const response = await fetch("/api/google/callback", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to authenticate with Google" }));
        throw new Error(errorData.message || "Authentication failed");
      }
      
      // Get the user data
      const userData = await response.json();
      
      // Show success message
      toast({
        title: t('auth.loginSuccess', 'تم تسجيل الدخول بنجاح'),
        description: t('auth.welcomeBackGoogle', 'مرحبًا بك مجددًا عبر حساب جوجل')
      });
      
      // Trigger user data refresh and navigate to dashboard
      await refetchUser();
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, "/login");
      
      // Navigate to dashboard
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Google callback processing error:", error);
      toast({
        title: t('auth.googleAuthError', 'خطأ في تسجيل الدخول بجوجل'),
        description: error.message || "Failed to complete Google authentication",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#AC8AF7] to-[#6E4CEE] flex flex-col">
      {/* Top circles background - Only visible on mobile */}
      <div className="absolute w-[454px] h-[454px] -left-10 -top-12 lg:hidden">
        <div className="absolute w-[376px] h-[376px] left-0 -top-2 border border-purple-300 rounded-full opacity-20"></div>
        <div className="absolute w-[300px] h-[300px] left-9 top-7 border border-purple-300 rounded-full opacity-30"></div>
        <div className="absolute w-[226px] h-[226px] left-[74px] top-[66px] border border-purple-300 rounded-full opacity-50"></div>

        {/* Small circles */}
        <div className="absolute w-[10px] h-[10px] left-[144px] top-[70px] bg-gradient-to-b from-[#AC8AF7] to-[#6E4CEE] opacity-30 rounded-full"></div>
        <div className="absolute w-[32px] h-[32px] left-[328px] top-[264px] bg-[#9CEAE9] rounded-full"></div>
        <div className="absolute w-[32px] h-[32px] left-[262px] top-[277px] bg-blue-300 rounded-full"></div>
      </div>

      {/* Desktop background circles */}
      <div className="hidden lg:block absolute left-0 top-0 w-full h-full overflow-hidden">
        <div className="absolute w-[500px] h-[500px] left-[10%] top-[15%] border border-purple-300 rounded-full opacity-20"></div>
        <div className="absolute w-[400px] h-[400px] left-[20%] top-[25%] border border-purple-300 rounded-full opacity-30"></div>
        <div className="absolute w-[300px] h-[300px] left-[30%] top-[35%] border border-purple-300 rounded-full opacity-50"></div>
      </div>

      {/* App logo */}
      <div className="pt-12 flex justify-center z-10">
        <h1 className="text-white text-2xl md:text-3xl font-bold flex items-center">
          eWasl.com <span className="text-xs ml-1">®</span>
        </h1>
      </div>

      {/* Login form in dark card */}
      <div className="w-full lg:w-[450px] xl:w-[500px] mx-auto lg:mt-8 
                      lg:relative lg:rounded-[20px] lg:shadow-2xl
                      sm:absolute sm:bottom-0 h-auto
                      bg-[#0F172A] text-white rounded-t-[20px] pt-10 px-6 z-10">
        <h1 className="text-xl md:text-2xl text-center mb-6">
          {t('login.signInToApp', 'تسجيل الدخول إلى وصل')}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-6" dir={isRtl ? "rtl" : "ltr"}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      className={`h-14 text-white bg-[#1E293B] rounded-full border-none px-6 ${isRtl ? 'text-right' : ''}`}
                      placeholder={t('common.emailPlaceholder', 'أدخل بريدك الإلكتروني')}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        className={`h-14 text-white bg-[#1E293B] rounded-full border-none pl-6 pr-12 ${isRtl ? 'text-right pr-6 pl-12' : ''}`}
                        placeholder={t('common.passwordPlaceholder', 'أدخل كلمة المرور')}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                className="p-0 text-gray-400 hover:text-[#8B5CF6]"
                onClick={() => setLocation('/forgot-password')}
              >
                {t('login.forgotPassword', 'نسيت كلمة المرور؟')}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                t('login.button', 'تسجيل الدخول')
              )}
            </Button>
          </form>
        </Form>

        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="h-[1px] bg-gray-700 flex-1"></div>
          <span className="text-gray-400 text-sm whitespace-nowrap">{t('auth.orContinueWith', 'أو متابعة باستخدام')}</span>
          <div className="h-[1px] bg-gray-700 flex-1"></div>
        </div>

        <Button
          type="button"
          variant="outline"
          className={`w-full h-14 rounded-full border-[#B2BDD0] flex items-center justify-center gap-3 bg-transparent ${isRtl ? 'flex-row-reverse' : ''}`}
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          ) : (
            <>
              <FaGoogle className="h-6 w-6 text-[#DB4437]" />
              <span className="text-base font-medium text-white">
                {t('auth.signInWithGoogle', 'الدخول باستخدام جوجل')}
              </span>
            </>
          )}
        </Button>

        <div className="mt-8 text-center mb-6">
          <p className="text-gray-400">
            {t('login.noAccount', "ليس لديك حساب؟")}{' '}
            <Button
              type="button"
              variant="link"
              className="p-0 text-[#8B5CF6]"
              onClick={() => setLocation('/register')}
            >
              {t('register.button', 'تسجيل')}
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}