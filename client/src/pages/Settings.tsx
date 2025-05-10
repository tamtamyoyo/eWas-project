import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SubscriptionPlans from "@/components/dashboard/SubscriptionPlans";
import TeamManagement from "@/components/settings/TeamManagement";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, logout, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Extract tab from URL if present
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const defaultTab = urlParams.get('tab') || 'account';
  
  // Use controlled tabs with state
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Profile update schema
  const profileSchema = z.object({
    fullName: z.string().min(2, {
      message: t('settings.validation.fullNameRequired'),
    }),
    username: z.string().min(3, {
      message: t('settings.validation.usernameRequired'),
    }),
    email: z.string().email({
      message: t('settings.validation.emailValid'),
    }),
  });
  
  // Password update schema
  const passwordSchema = z.object({
    currentPassword: z.string().min(6, {
      message: t('settings.validation.currentPasswordRequired'),
    }),
    newPassword: z.string().min(6, {
      message: t('settings.validation.newPasswordLength'),
    }),
    confirmPassword: z.string().min(6, {
      message: t('settings.validation.confirmPasswordRequired'),
    }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('settings.validation.passwordsMatch'),
    path: ["confirmPassword"],
  });
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      username: user?.username || "",
      email: user?.email || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/users/${user.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('settings.profileUpdateSuccess'),
        description: t('settings.profileUpdateSuccessMessage'),
      });
      refetchUser();
    },
    onError: (error: any) => {
      toast({
        title: t('settings.profileUpdateError'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update password mutation (this would be implemented in a real app)
  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordData: any) => {
      if (!user) throw new Error("User not authenticated");
      // This is where you'd call your API to update the password
      // For now, let's simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: t('settings.passwordUpdateSuccess'),
        description: t('settings.passwordUpdateSuccessMessage'),
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('settings.passwordUpdateError'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle profile submit
  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(values);
  };
  
  // Handle password submit
  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    updatePasswordMutation.mutate(values);
  };
  
  // Get user preferences
  const { preferences, updateLanguage, updateTheme } = useUserPreferences();
  
  // Handle language change
  const handleLanguageChange = (value: string) => {
    if (value === 'ar' || value === 'en') {
      updateLanguage(value);
    }
  };
  
  // Handle theme change - now uses the enhanced global theme system
  const handleThemeChange = (value: string) => {
    if (value === 'light' || value === 'dark' || value === 'system') {
      updateTheme(value);
      // No need for manual DOM manipulation - handled by the ThemeProvider
    }
  };
  
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-neutral-500">{t('settings.subtitle')}</p>
      </div>
      
      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="account">{t('settings.account')}</TabsTrigger>
          <TabsTrigger value="team">{t('settings.team')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('settings.preferences')}</TabsTrigger>
        </TabsList>
        
        {/* Account Settings Tab */}
        <TabsContent value="account">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-6">{t('settings.profileInformation')}</h3>
                
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.fullName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('settings.fullNamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.username')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('settings.usernamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.email')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('settings.emailPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        t('settings.saveChanges')
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Profile Picture */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-6">{t('settings.profilePicture')}</h3>
                
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-neutral-200 flex items-center justify-center uppercase text-3xl font-bold text-primary mb-4">
                    {user?.fullName ? user.fullName.charAt(0) : (user?.username ? user.username.charAt(0) : '?')}
                  </div>
                  
                  <div className="space-y-2 w-full">
                    <Button variant="outline" className="w-full">
                      <i className="fa-solid fa-upload mr-2"></i>
                      {t('settings.uploadPicture')}
                    </Button>
                    <Button variant="ghost" className="w-full">
                      <i className="fa-solid fa-trash mr-2"></i>
                      {t('settings.removePicture')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Change Password */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-6">{t('settings.changePassword')}</h3>
                
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.currentPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.newPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.confirmPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        t('settings.updatePassword')
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Danger Zone */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-red-500 mb-6">{t('settings.dangerZone')}</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium">{t('settings.deleteAccount')}</h4>
                    <p className="text-sm text-neutral-500 my-2">{t('settings.deleteAccountWarning')}</p>
                    <Button variant="destructive" size="sm">
                      {t('settings.deleteAccount')}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-100">
                    <h4 className="font-medium">{t('settings.logout')}</h4>
                    <p className="text-sm text-neutral-500 my-2">{t('settings.logoutDescription')}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={logout}
                    >
                      <i className="fa-solid fa-sign-out-alt mr-2"></i>
                      {t('settings.logoutButton')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Team Tab */}
        <TabsContent value="team">
          <TeamManagement />
        </TabsContent>
        
        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-semibold">{t('settings.currentPlan')}</h3>
                  <p className="text-neutral-500 text-sm">{t('settings.currentPlanDescription')}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{t(`plans.${user?.currentPlan || 'free'}`)}</div>
                  {user?.currentPlan && user.currentPlan !== 'free' ? (
                    <div className="text-xs text-secondary">{t('settings.activePlan')}</div>
                  ) : (
                    <div className="text-xs text-neutral-500">{t('settings.freePlan')}</div>
                  )}
                </div>
              </div>
              
              {user?.currentPlan && user.currentPlan !== 'free' && (
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{t('settings.nextBilling')}</p>
                    <p className="text-xs text-neutral-500">{t('settings.nextBillingDescription')}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('settings.manageBilling')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <SubscriptionPlans />
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-6">{t('settings.notificationPreferences')}</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.emailNotifications')}</h4>
                    <p className="text-sm text-neutral-500">{t('settings.emailNotificationsDescription')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.postPublished')}</h4>
                    <p className="text-sm text-neutral-500">{t('settings.postPublishedDescription')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.engagementAlerts')}</h4>
                    <p className="text-sm text-neutral-500">{t('settings.engagementAlertsDescription')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.weeklyReports')}</h4>
                    <p className="text-sm text-neutral-500">{t('settings.weeklyReportsDescription')}</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.productUpdates')}</h4>
                    <p className="text-sm text-neutral-500">{t('settings.productUpdatesDescription')}</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="pt-4">
                  <Button>
                    {t('settings.savePreferences')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-6">{t('settings.applicationPreferences')}</h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="language">{t('settings.language')}</Label>
                  <Select 
                    value={preferences.language} 
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger id="language" className="w-full md:w-[240px] mt-2">
                      <SelectValue placeholder={t('settings.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">{t('settings.languageDescription')}</p>
                </div>
                
                <div>
                  <Label htmlFor="theme">{t('settings.theme')}</Label>
                  <Select 
                    value={preferences.theme} 
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger id="theme" className="w-full md:w-[240px] mt-2">
                      <SelectValue placeholder={t('settings.selectTheme')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings.lightTheme')}</SelectItem>
                      <SelectItem value="dark">{t('settings.darkTheme')}</SelectItem>
                      <SelectItem value="system">{t('settings.systemTheme')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">{t('settings.themeDescription')}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.timeZone')}</h4>
                    <p className="text-sm text-neutral-500">{t('settings.timeZoneDescription')}</p>
                  </div>
                  <Select defaultValue="auto">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('settings.selectTimeZone')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('settings.autoTimeZone')}</SelectItem>
                      <SelectItem value="GMT">GMT (UTC+0)</SelectItem>
                      <SelectItem value="EST">EST (UTC-5)</SelectItem>
                      <SelectItem value="CST">CST (UTC-6)</SelectItem>
                      <SelectItem value="PST">PST (UTC-8)</SelectItem>
                      <SelectItem value="AST">AST (UTC+3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('settings.dateFomrat')}</h4>
                    <p className="text-sm text-neutral-500">{t('settings.dateFormatDescription')}</p>
                  </div>
                  <Select defaultValue="mdy">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('settings.selectDateFormat')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button>
                    {t('settings.savePreferences')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Help Tab */}
        <TabsContent value="help">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-6">{t('settings.helpSupport')}</h3>
              
              <div className="space-y-6">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{t('settings.documentation')}</h4>
                  <p className="text-sm text-neutral-600 mb-3">{t('settings.documentationDescription')}</p>
                  <Button variant="outline" size="sm">
                    <i className="fa-solid fa-book mr-2"></i>
                    {t('settings.viewDocumentation')}
                  </Button>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{t('settings.faq')}</h4>
                  <p className="text-sm text-neutral-600 mb-3">{t('settings.faqDescription')}</p>
                  <Button variant="outline" size="sm">
                    <i className="fa-solid fa-question-circle mr-2"></i>
                    {t('settings.browseFaq')}
                  </Button>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{t('settings.contactSupport')}</h4>
                  <p className="text-sm text-neutral-600 mb-3">{t('settings.contactSupportDescription')}</p>
                  <Button variant="outline" size="sm">
                    <i className="fa-solid fa-envelope mr-2"></i>
                    {t('settings.contactUs')}
                  </Button>
                </div>
              </div>
              
              <div className="mt-8 border-t border-neutral-100 pt-6">
                <h3 className="font-semibold mb-4">{t('settings.aboutSocialPulse')}</h3>
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">
                    {t('settings.aboutDescription')}
                  </p>
                  <div>
                    <span className="text-sm font-medium">{t('settings.version')}</span>
                    <span className="text-sm text-neutral-500 ml-2">1.0.0</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('settings.terms')}</span>
                    <Button variant="link" className="text-sm p-0 h-auto ml-2">
                      {t('settings.termsLink')}
                    </Button>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('settings.privacy')}</span>
                    <Button variant="link" className="text-sm p-0 h-auto ml-2">
                      {t('settings.privacyLink')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
