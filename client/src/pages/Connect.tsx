import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type SocialAccount } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import TwitterConnectButton from "@/components/connect/TwitterConnectButton";
import FacebookConnectButton from "@/components/connect/FacebookConnectButton";
import InstagramConnectButton from "@/components/connect/InstagramConnectButton";
import LinkedInConnectButton from "@/components/connect/LinkedInConnectButton";
import { SnapchatConnectButton } from "@/components/connect/SnapchatConnectButton";
import TikTokConnectButton from "@/components/connect/TikTokConnectButton";
import YouTubeConnectButton from "@/components/connect/YouTubeConnectButton";

// Social platform configuration for display
const getPlatforms = (t: any) => [
  {
    id: "facebook",
    name: "Facebook",
    icon: "fa-facebook-f",
    color: "#4267B2",
    description: t('connect.facebookDesc', "قم بربط صفحة الفيسبوك الخاصة بك لجدولة المنشورات وعرض التحليلات")
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "fa-instagram",
    color: "#E1306C",
    description: t('connect.instagramDesc', "قم بربط حساب انستغرام الخاص بك لجدولة المنشورات وتتبع التفاعل")
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: "fa-twitter",
    color: "#1DA1F2",
    description: t('connect.twitterDesc', "قم بربط حساب تويتر الخاص بك لجدولة التغريدات وتتبع الأداء")
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "fa-linkedin-in",
    color: "#0077B5",
    description: t('connect.linkedinDesc', "قم بربط صفحة لينكد إن الخاصة بك لمشاركة التحديثات المهنية")
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: "fa-snapchat",
    color: "#FFFC00",
    description: t('connect.snapchatDesc', "قم بربط حساب سناب شات الخاص بك لإدارة وجدولة السنابات")
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "fa-tiktok", // Font Awesome TikTok icon
    color: "#000000",
    description: t('connect.tiktokDesc', "قم بربط حساب تيك توك الخاص بك لنشر مقاطع الفيديو وتحليل البيانات")
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "fa-youtube",
    color: "#FF0000",
    description: t('connect.youtubeDesc', "قم بربط قناة يوتيوب الخاصة بك لنشر الفيديوهات وتحليل البيانات")
  }
];

export default function Connect() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const platforms = getPlatforms(t);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connectForm, setConnectForm] = useState({
    accountName: "",
    accessToken: "oauth-access-token-placeholder", // In real app, this would come from OAuth
    refreshToken: "oauth-refresh-token-placeholder" // In real app, this would come from OAuth
  });

  // Fetch connected accounts
  const { data: connectedAccounts, isLoading } = useQuery<SocialAccount[]>({
    queryKey: ['/api/social-accounts'],
  });

  // Connect social account mutation
  const connectMutation = useMutation({
    mutationFn: async (accountData: any) => {
      const response = await apiRequest("POST", "/api/social-accounts", accountData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      toast({
        title: t('connect.successTitle', 'تم الربط بنجاح'),
        description: t('connect.successMessage', 'تم ربط الحساب بنجاح'),
      });
      setSelectedPlatform(null);
      setConnectForm({
        accountName: "",
        accessToken: "oauth-access-token-placeholder",
        refreshToken: "oauth-refresh-token-placeholder"
      });
    },
    onError: (error: any) => {
      toast({
        title: t('connect.errorTitle', 'حدث خطأ'),
        description: error.message || t('connect.genericError', 'حدث خطأ أثناء محاولة ربط الحساب'),
        variant: "destructive",
      });
    }
  });

  // Disconnect social account mutation
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: number) => {
      await apiRequest("DELETE", `/api/social-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      toast({
        title: t('connect.disconnectSuccessTitle', 'تم فصل الحساب'),
        description: t('connect.disconnectSuccessMessage', 'تم فصل الحساب بنجاح'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('connect.disconnectErrorTitle', 'خطأ في فصل الحساب'),
        description: error.message || t('connect.disconnectGenericError', 'حدث خطأ أثناء محاولة فصل الحساب'),
        variant: "destructive",
      });
    }
  });

  const handleConnect = (platform: string) => {
    setSelectedPlatform(platform);
  };

  const handleSubmitConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;
    
    // In a real implementation, this would be handled by OAuth
    // Here we're just simulating the connection process
    connectMutation.mutate({
      platform: selectedPlatform,
      accountId: `${selectedPlatform}-${Date.now()}`, // Mock ID
      accountName: connectForm.accountName,
      accessToken: connectForm.accessToken,
      refreshToken: connectForm.refreshToken,
      isConnected: true
    });
  };

  const handleDisconnect = (accountId: number) => {
    if (confirm(t('connect.confirmDisconnect', 'هل أنت متأكد من أنك ترغب في فصل هذا الحساب؟'))) {
      disconnectMutation.mutate(accountId);
    }
  };

  // Find if a platform is already connected
  const isPlatformConnected = (platformId: string) => {
    return connectedAccounts?.some(account => account.platform === platformId);
  };

  // Get connected account for a platform
  const getConnectedAccount = (platformId: string) => {
    return connectedAccounts?.find(account => account.platform === platformId);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('connect.title', 'ربط الحسابات')}</h1>
        <p className="text-neutral-500">{t('connect.subtitle', 'قم بربط حسابات التواصل الاجتماعي الخاصة بك لإدارتها من مكان واحد')}</p>
      </div>

      {/* Connect Form Modal */}
      {selectedPlatform && (
        <Card className="mb-6 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{
                    backgroundColor: platforms.find(p => p.id === selectedPlatform)?.color
                  }}
                >
                  <i className={`fa-brands ${platforms.find(p => p.id === selectedPlatform)?.icon}`}></i>
                </div>
                <h3 className="font-semibold">{'ربط مع ' + platforms.find(p => p.id === selectedPlatform)?.name}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPlatform(null)}>
                <i className="fa-solid fa-times"></i>
              </Button>
            </div>

            <form onSubmit={handleSubmitConnect} className="space-y-4">
              <div>
                <Label htmlFor="accountName">{t('connect.accountName', 'اسم الحساب')}</Label>
                <Input
                  id="accountName"
                  value={connectForm.accountName}
                  onChange={(e) => setConnectForm({ ...connectForm, accountName: e.target.value })}
                  placeholder={t('connect.accountPlaceholder', '@اسم_المستخدم')}
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">{t('connect.accountNameDesc', 'اسم المستخدم أو معرف الحساب الخاص بك على المنصة')}</p>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={connectMutation.isPending}>
                  {connectMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <i className="fa-solid fa-link mr-2"></i>
                      {t('connect.connectButton', 'ربط')}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setSelectedPlatform(null)}
                  className="ml-2"
                >
                  {t('common.cancel', 'إلغاء')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-xl text-right mb-6">{t('connect.connectedAccounts', 'الحسابات المرتبطة')}</h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {platforms.map((platform) => {
                const isConnected = isPlatformConnected(platform.id);
                const connectedAccount = getConnectedAccount(platform.id);

                return (
                  <div key={platform.id} className="flex flex-row-reverse items-center justify-between p-4 border border-neutral-100 rounded-lg hover:border-neutral-300 transition-all">
                    <div className="flex flex-row-reverse items-center">
                      <div
                        className="mr-3 w-12 h-12 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: platform.color }}
                      >
                        <i className={`fa-brands ${platform.icon} text-xl`}></i>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-row-reverse items-center">
                          <h4 className="font-medium text-base">{platform.name}</h4>
                          {isConnected && (
                            <span className="mr-2 text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                              {t('connect.connected', 'متصل')}
                            </span>
                          )}
                        </div>
                        {isConnected ? (
                          <p className="text-sm text-neutral-600">
                            {connectedAccount?.accountName}
                          </p>
                        ) : (
                          <p className="text-sm text-neutral-500">
                            {platform.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {isConnected ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDisconnect(connectedAccount?.id || 0)}
                          disabled={disconnectMutation.isPending}
                        >
                          {disconnectMutation.isPending ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          ) : (
                            t('connect.disconnect', 'فصل')
                          )}
                        </Button>
                      ) : platform.id === "twitter" ? (
                        <TwitterConnectButton 
                          onDisconnect={() => queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] })} 
                        />
                      ) : platform.id === "facebook" ? (
                        <FacebookConnectButton 
                          onDisconnect={() => queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] })} 
                        />
                      ) : platform.id === "instagram" ? (
                        <InstagramConnectButton 
                          onDisconnect={() => queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] })} 
                        />
                      ) : platform.id === "linkedin" ? (
                        <LinkedInConnectButton 
                          onDisconnect={() => queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] })} 
                        />
                      ) : platform.id === "snapchat" ? (
                        <SnapchatConnectButton 
                          onDisconnect={() => queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] })} 
                        />
                      ) : platform.id === "tiktok" ? (
                        <TikTokConnectButton 
                          onDisconnect={() => queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] })} 
                        />
                      ) : platform.id === "youtube" ? (
                        <YouTubeConnectButton 
                          onDisconnect={() => queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] })} 
                        />
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConnect(platform.id)}
                        >
                          {t('connect.connect', 'ربط')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-6">{t('connect.accountSettings', 'إعدادات الحساب')}</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t('connect.autoPublish', 'نشر تلقائي')}</h4>
                <p className="text-sm text-neutral-500">{t('connect.autoPublishDesc', 'نشر المنشورات المجدولة تلقائياً في الوقت المحدد')}</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t('connect.errorNotifications', 'إشعارات الأخطاء')}</h4>
                <p className="text-sm text-neutral-500">{t('connect.errorNotificationsDesc', 'تلقي إشعارات عند حدوث أخطاء في نشر المحتوى')}</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{t('connect.analytics', 'التحليلات')}</h4>
                <p className="text-sm text-neutral-500">{t('connect.analyticsDesc', 'جمع إحصائيات وتحليلات من حساباتك المرتبطة')}</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="border-t border-neutral-100 pt-6">
              <h4 className="font-medium mb-3">{t('connect.refreshTokens', 'تحديث رموز الوصول')}</h4>
              <p className="text-sm text-neutral-500 mb-3">{t('connect.refreshTokensDesc', 'تحديث رموز الوصول للحسابات المرتبطة في حالة انتهاء صلاحيتها')}</p>
              <Button variant="outline">
                <i className="fa-solid fa-rotate mr-2"></i>
                {t('connect.refreshAll', 'تحديث الكل')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
