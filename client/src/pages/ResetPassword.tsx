import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { Link, useLocation, useRoute } from 'wouter';
import { useTranslation } from 'react-i18next';

// Define form schema with password validation
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل')
      .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
      .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the token from URL
  const [match, params] = useRoute<{ token: string }>('/reset-password/:token');
  const [, navigate] = useLocation();
  
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Extract token from URL on component mount
  useEffect(() => {
    if (match && params.token) {
      setToken(params.token);
      setIsLoading(false);
      setIsTokenValid(true); // We'll assume the token is valid until proven otherwise
    } else {
      setError('رمز إعادة تعيين كلمة المرور غير صالح أو مفقود');
      setIsLoading(false);
      setIsTokenValid(false);
    }
  }, [match, params]);

  // Handle form submission
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('رمز إعادة تعيين كلمة المرور غير صالح أو مفقود');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        password: data.password,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        
        // Navigate to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
        if (result.message === 'Invalid or expired token') {
          setIsTokenValid(false);
        }
      }
    } catch (error) {
      setError('حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-md">
          <div className="flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-purple-500 border-gray-200"></div>
          </div>
          <p className="text-center text-gray-400">جاري التحقق من صلاحية الرمز...</p>
        </div>
      </div>
    );
  }

  // Show invalid token message
  if (!isTokenValid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">انتهت صلاحية الرابط</h2>
            <p className="mt-2 text-gray-400">
              رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.
            </p>
          </div>
          <div className="text-center">
            <Link href="/forgot-password">
              <Button className="mt-4 w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                طلب رابط جديد
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">تم إعادة تعيين كلمة المرور</h2>
            <p className="mt-2 text-gray-400">
              تم إعادة تعيين كلمة المرور الخاصة بك بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول...
            </p>
          </div>
          <div className="text-center">
            <Link href="/login">
              <Button className="mt-4 w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">إعادة تعيين كلمة المرور</h2>
          <p className="mt-2 text-gray-400">
            الرجاء إدخال كلمة المرور الجديدة للحساب.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الجديدة</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تأكيد كلمة المرور</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-gray-400">
              <p>كلمة المرور يجب أن تحتوي على:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>8 أحرف على الأقل</li>
                <li>حرف كبير واحد على الأقل</li>
                <li>رقم واحد على الأقل</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  جاري إعادة تعيين كلمة المرور...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  إعادة تعيين كلمة المرور
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-blue-500 hover:text-blue-400">
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;