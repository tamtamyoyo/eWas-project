import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import GoogleAuthForm from "./GoogleAuthForm";
import { Separator } from "@/components/ui/separator";

type AuthFormProps = {
  type: "login" | "register";
};

const loginSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().min(1, { message: "Full name is required" }),
});

// Create a combined type to fix TypeScript errors with form fields
type FormSchema = z.infer<typeof loginSchema> | (z.infer<typeof registerSchema>);

export default function AuthForm({ type }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const isLogin = type === "login";
  const schema = isLogin ? loginSchema : registerSchema;

  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...(isLogin ? {} : { fullName: "" }),
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await apiRequest("POST", endpoint, values);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();

      toast({
        title: isLogin ? t("login.success") : t("register.success"),
        description: isLogin ? t("login.successMessage") : t("register.successMessage"),
      });

      if (isLogin) {
        // Wait for auth state to be updated
        await queryClient.invalidateQueries(['/api/auth/user']);
        const user = await queryClient.fetchQuery(['/api/auth/user']);
        
        if (user) {
          window.location.replace("/dashboard");
        } else {
          console.error("Login succeeded but user state not updated");
          toast({
            title: "Error",
            description: "Authentication error occurred. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        window.location.replace("/login");
      }
    } catch (error: any) {
      toast({
        title: isLogin ? t("login.error") : t("register.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLogin ? t("login.title") : t("register.title")}</CardTitle>
        <CardDescription>
          {isLogin ? t("login.description") : t("register.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isLogin && (
              <FormField
                control={form.control}
                name={"fullName" as keyof FormSchema}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.fullName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("common.fullNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.email")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("common.emailPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t("common.passwordPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : isLogin ? (
                t("login.button")
              ) : (
                t("register.button")
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleAuthForm view={isLogin ? 'sign_in' : 'sign_up'} />
          </div>
        </div>

        <div className="mt-4 text-center text-sm">
          {isLogin ? (
            <p>
              {t("login.noAccount")}{" "}
              <Button variant="link" className="p-0" onClick={() => setLocation("/register")}>
                {t("login.registerLink")}
              </Button>
            </p>
          ) : (
            <p>
              {t("register.haveAccount")}{" "}
              <Button variant="link" className="p-0" onClick={() => setLocation("/login")}>
                {t("register.loginLink")}
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}