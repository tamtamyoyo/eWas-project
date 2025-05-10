import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صالح",
  }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRtl = i18n.language === 'ar';
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Form setup
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest("POST", "/api/auth/forgot-password", {
        email: values.email,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ ما");
      }
      
      setEmailSent(true);
      
      toast({
        title: t('forgotPassword.emailSent', 'تم إرسال البريد الإلكتروني'),
        description: t('forgotPassword.checkEmail', 'يرجى التحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور'),
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: t('forgotPassword.error', 'حدث خطأ'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Forgot password form in dark card */}
      <div className="w-full lg:w-[450px] xl:w-[500px] mx-auto mt-16 lg:mt-8 
                      lg:relative lg:rounded-[20px] lg:shadow-2xl
                      sm:absolute sm:bottom-0 h-auto
                      bg-[#0F172A] text-white rounded-t-[20px] pt-10 px-6 z-10">
        <h1 className="text-xl md:text-2xl text-center mb-6">
          {t('forgotPassword.title', 'استعادة كلمة المرور')}
        </h1>

        {!emailSent ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-6" dir={isRtl ? "rtl" : "ltr"}>
              <p className="text-gray-400 text-center mb-4">
                {t('forgotPassword.enterEmail', 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور')}
              </p>
              
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

              <Button
                type="submit"
                className="w-full h-14 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  t('forgotPassword.sendLink', 'إرسال رابط إعادة التعيين')
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center px-4 py-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-[#22C55E] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('forgotPassword.checkEmailTitle', 'تحقق من بريدك الإلكتروني')}</h2>
            <p className="text-gray-400 mb-6">
              {t('forgotPassword.successMessage', 'لقد أرسلنا لك بريدًا إلكترونيًا يحتوي على رابط لإعادة تعيين كلمة المرور الخاصة بك. تحقق من صندوق الوارد')}
            </p>
            <Button 
              type="button"
              className="w-full h-14 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              onClick={() => form.reset()}
            >
              {t('forgotPassword.resendEmail', 'إعادة إرسال الرابط')}
            </Button>
          </div>
        )}

        <div className="mt-8 text-center mb-6">
          <p className="text-gray-400">
            <Button
              type="button"
              variant="link"
              className="p-0 text-[#8B5CF6]"
              onClick={() => setLocation('/login')}
            >
              {t('login.backToLogin', 'العودة إلى تسجيل الدخول')}
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}