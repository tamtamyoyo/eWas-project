import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { FaEnvelope, FaHeadset, FaCircleQuestion as FaQuestion, FaBook, FaFile as FaFileAlt } from "react-icons/fa6";

// Schema for support message form
const supportFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

export default function HelpPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default form values
  const defaultValues: Partial<SupportFormValues> = {
    name: user?.fullName || "",
    email: user?.email || "",
    subject: "",
    message: "",
  };

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues,
  });

  async function onSubmit(data: SupportFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/support/send-message", data);
      
      if (response.ok) {
        toast({
          title: t("support.success"),
          description: t("support.messageSent"),
        });
        form.reset(defaultValues);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
    } catch (error: any) {
      toast({
        title: t("support.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container py-10 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#2A2F5B]">
            {t("help.title", "Help & Support")}
          </h1>
          <p className="text-muted-foreground">
            {t("help.description", "Get help with your eWasl account and services")}
          </p>
        </div>

        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <FaHeadset className="h-4 w-4" />
              <span>{t("help.contactUs", "Contact Us")}</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <FaQuestion className="h-4 w-4" />
              <span>{t("help.faq", "FAQ")}</span>
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <FaBook className="h-4 w-4" />
              <span>{t("help.documentation", "Documentation")}</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FaFileAlt className="h-4 w-4" />
              <span>{t("help.termsPolicy", "Terms & Policy")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("support.contactFormTitle", "Send us a message")}</CardTitle>
                  <CardDescription>
                    {t("support.contactFormDescription", "Fill out the form below and we'll get back to you as soon as possible.")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("support.nameLabel", "Full Name")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("support.namePlaceholder", "Enter your name")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("support.emailLabel", "Email")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("support.emailPlaceholder", "Enter your email")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("support.subjectLabel", "Subject")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("support.subjectPlaceholder", "What is your message about?")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("support.messageLabel", "Message")}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t("support.messagePlaceholder", "Enter your message here...")} 
                                className="min-h-[150px]" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto bg-[#6A0CF8] hover:bg-[#5909CC]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            <span>{t("support.sending", "Sending...")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FaEnvelope className="h-4 w-4" />
                            <span>{t("support.sendMessage", "Send Message")}</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("support.quickHelp", "Quick Help")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">{t("support.emailUs", "Email Us")}</h3>
                      <p className="text-sm text-muted-foreground">support@ewasl.com</p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-medium">{t("support.businessHours", "Business Hours")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("support.businessHoursDetails", "Sunday - Thursday: 9:00 AM - 6:00 PM")}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-medium">{t("support.responseTime", "Response Time")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("support.responseTimeDetails", "We aim to respond to all inquiries within 24-48 hours.")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("support.helpfulResources", "Helpful Resources")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <FaBook className="mr-2 h-4 w-4" />
                      {t("support.userGuide", "User Guide")}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FaQuestion className="mr-2 h-4 w-4" />
                      {t("support.commonIssues", "Common Issues")}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FaFileAlt className="mr-2 h-4 w-4" />
                      {t("support.apiDocumentation", "API Documentation")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("help.faqTitle", "Frequently Asked Questions")}</CardTitle>
                <CardDescription>
                  {t("help.faqDescription", "Find answers to the most common questions about eWasl.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#2A2F5B]">
                    {t("help.faq1Title", "What is eWasl?")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("help.faq1Answer", "eWasl is a comprehensive social media management platform specifically designed for Arabic-speaking markets, allowing businesses and individuals to manage their social media accounts from a single dashboard.")}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#2A2F5B]">
                    {t("help.faq2Title", "How do I connect my social accounts?")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("help.faq2Answer", "Go to the Connect section in the sidebar, then click on the social media platform you want to connect. Follow the authorization steps to link your account securely.")}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#2A2F5B]">
                    {t("help.faq3Title", "What payment methods do you accept?")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("help.faq3Answer", "We accept all major credit cards (Visa, Mastercard, American Express), and PayPal. All payments are processed securely through Stripe.")}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#2A2F5B]">
                    {t("help.faq4Title", "How does the AI content analyzer work?")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("help.faq4Answer", "Our AI content analyzer uses advanced natural language processing to evaluate your content's engagement potential, sentiment, and appropriateness for your target audience. It provides specific recommendations to improve your content's performance.")}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#2A2F5B]">
                    {t("help.faq5Title", "Can I cancel my subscription anytime?")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("help.faq5Answer", "Yes, you can cancel your subscription at any time from your account settings. Your plan will remain active until the end of the current billing period.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("help.documentationTitle", "Documentation")}</CardTitle>
                <CardDescription>
                  {t("help.documentationDescription", "Comprehensive guides to help you get the most out of eWasl.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("docs.gettingStarted", "Getting Started")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("docs.gettingStartedDesc", "Learn the basics of eWasl and set up your account.")}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="w-full">{t("docs.readMore", "Read More")}</Button>
                    </CardFooter>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("docs.contentManagement", "Content Management")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("docs.contentManagementDesc", "Learn how to create, schedule, and optimize your content.")}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="w-full">{t("docs.readMore", "Read More")}</Button>
                    </CardFooter>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("docs.analytics", "Analytics & Reporting")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("docs.analyticsDesc", "Understand your performance metrics and generate reports.")}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="w-full">{t("docs.readMore", "Read More")}</Button>
                    </CardFooter>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("docs.aiFeatures", "AI Features")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("docs.aiFeaturesDesc", "Leverage our AI tools for content optimization and analysis.")}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="w-full">{t("docs.readMore", "Read More")}</Button>
                    </CardFooter>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("docs.accountManagement", "Account Management")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("docs.accountManagementDesc", "Manage your eWasl account, billing, and team members.")}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="w-full">{t("docs.readMore", "Read More")}</Button>
                    </CardFooter>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("docs.troubleshooting", "Troubleshooting")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("docs.troubleshootingDesc", "Solve common issues and get technical support.")}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="w-full">{t("docs.readMore", "Read More")}</Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("help.termsTitle", "Terms & Privacy Policy")}</CardTitle>
                <CardDescription>
                  {t("help.termsDescription", "Important legal information about using eWasl.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2A2F5B]">{t("legal.termsOfService", "Terms of Service")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("legal.termsOfServiceIntro", "By using eWasl, you agree to the following terms and conditions.")}
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      {t("legal.termsContent1", "1. eWasl provides a social media management platform. Use of the service is at your own risk.")}
                    </p>
                    <p>
                      {t("legal.termsContent2", "2. You must comply with all social media platforms' terms of service when using eWasl.")}
                    </p>
                    <p>
                      {t("legal.termsContent3", "3. You are responsible for maintaining the security of your account and password.")}
                    </p>
                    <p>
                      {t("legal.termsContent4", "4. eWasl reserves the right to modify or terminate the service for any reason, without notice.")}
                    </p>
                    <p>
                      {t("legal.termsContent5", "5. eWasl is not responsible for any content posted through our service.")}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2A2F5B]">{t("legal.privacyPolicy", "Privacy Policy")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("legal.privacyPolicyIntro", "This Privacy Policy describes how we collect, use, and share your personal information.")}
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      {t("legal.privacyContent1", "1. We collect information when you register, connect social accounts, and use our services.")}
                    </p>
                    <p>
                      {t("legal.privacyContent2", "2. We use your information to provide and improve our services, communicate with you, and for analytics.")}
                    </p>
                    <p>
                      {t("legal.privacyContent3", "3. We may share your information with third-party service providers and social media platforms as necessary.")}
                    </p>
                    <p>
                      {t("legal.privacyContent4", "4. We use industry-standard security measures to protect your data.")}
                    </p>
                    <p>
                      {t("legal.privacyContent5", "5. You have the right to access, correct, or delete your personal information.")}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" className="mr-2">
                    {t("legal.downloadTerms", "Download Terms of Service")}
                  </Button>
                  <Button variant="outline">
                    {t("legal.downloadPrivacy", "Download Privacy Policy")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}