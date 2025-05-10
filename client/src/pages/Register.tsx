import { useState } from "react";
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
  username: z.string().min(3, {
    message: "يجب أن يكون الاسم 3 أحرف على الأقل",
  }),
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صالح",
  }),
  password: z.string().min(6, {
    message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register } = useAuth();
  const isRtl = i18n.language === 'ar';
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);
      console.log("Registration attempt with:", values.email);
      
      // Using the register function from useAuth hook
      register({
        username: values.username,
        email: values.email,
        password: values.password
      });
      
      // The register function handles success toasts and navigation via its mutation
    } catch (error: any) {
      console.error("Registration form error:", error);
      toast({
        title: t('auth.registerError', 'خطأ في إنشاء الحساب'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Google sign-in
  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      console.log("Redirecting to Google OAuth for registration");
      setLocation("/api/auth/google");
    } catch (error) {
      console.error("Google sign-in error:", error);
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

      {/* Registration form in dark card */}
      <div className="w-full lg:w-[450px] xl:w-[500px] mx-auto lg:mt-8 
                      lg:relative lg:rounded-[20px] lg:shadow-2xl
                      sm:absolute sm:bottom-0 h-auto pb-4
                      bg-[#0F172A] text-white rounded-t-[20px] pt-10 px-6 z-10">
        <h1 className="text-xl md:text-2xl text-center mb-6">
          {t('register.createAccount', 'إنشاء حساب جديد')}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-6" dir={isRtl ? "rtl" : "ltr"}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      className={`h-14 text-white bg-[#1E293B] rounded-full border-none px-6 ${isRtl ? 'text-right' : ''}`}
                      placeholder={t('common.usernamePlaceholder', 'اسم المستخدم')}
                      autoComplete="username"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

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
                        autoComplete="new-password"
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        className={`h-14 text-white bg-[#1E293B] rounded-full border-none pl-6 pr-12 ${isRtl ? 'text-right pr-6 pl-12' : ''}`}
                        placeholder={t('common.confirmPasswordPlaceholder', 'تأكيد كلمة المرور')}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-14 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                t('register.button', 'تسجيل')
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
                {t('auth.signUpWithGoogle', 'التسجيل باستخدام جوجل')}
              </span>
            </>
          )}
        </Button>

        <div className="mt-8 text-center mb-6">
          <p className="text-gray-400">
            {t('register.haveAccount', "لديك حساب بالفعل؟")}{' '}
            <Button
              type="button"
              variant="link"
              className="p-0 text-[#8B5CF6]"
              onClick={() => setLocation('/login')}
            >
              {t('login.button', 'تسجيل الدخول')}
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}