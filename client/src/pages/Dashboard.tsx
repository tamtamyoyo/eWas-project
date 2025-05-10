import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent, CardTitle, CardDescription, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { PencilLine, BarChart3, Users, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import ConnectedAccountsWidget from "@/components/dashboard/ConnectedAccountsWidget";
import ScheduledPostsWidget from "@/components/dashboard/ScheduledPostsWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

// Type definition for metrics data
type MetricsData = {
  accounts: {
    total: number;
    platforms: string[];
    details: Array<{
      platform: string;
      accountName: string;
      username: string;
      profileUrl: string;
      stats?: {
        followers?: number;
        followersChange?: number;
        engagement?: number;
        engagementChange?: number;
        [key: string]: any;
      };
    }>;
  };
  posts: {
    total: number;
    published: number;
    scheduled: number;
    byPlatform: Record<string, number>;
  };
  platformMetrics: any[];
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  
  // Fetch metrics data
  const { data: metrics, isLoading } = useQuery<MetricsData>({
    queryKey: ['/api/user-metrics'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to improve performance
  });
  
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>
      
      {/* Main dashboard content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="accounts">الحسابات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Quick stats cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المنشورات</CardTitle>
                <PencilLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-14 flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics?.posts?.total || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics?.posts?.published ? `${metrics?.posts?.published} منشور نشط` : 'لا يوجد منشورات نشطة'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل التفاعل</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-14 flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {metrics?.accounts?.details?.length ? 
                        `${(metrics?.accounts?.details?.reduce((sum, acc) => sum + (acc.stats?.engagement || 0), 0) / metrics?.accounts?.details?.length).toFixed(1)}%` : 
                        '0%'
                      }
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>حسب إحصائيات الحسابات المرتبطة</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المتابعين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-14 flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {metrics?.accounts?.details?.reduce((sum, acc) => sum + (acc.stats?.followers || 0), 0) || 0}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>عبر {metrics?.accounts?.total || 0} حساب</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">منشورات مجدولة</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-14 flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics?.posts?.scheduled || 0}</div>
                    <p className="text-xs text-muted-foreground">مقرر نشرها قريباً</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Main dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Create post card */}
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{t('dashboard.createPost')}</h3>
                      <p className="opacity-90 mb-4">{t('dashboard.createPostDescription')}</p>
                    </div>
                    <Link href="/compose">
                      <Button variant="secondary" className="w-full md:w-auto">
                        {t('dashboard.composeNow')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              {/* Get started guide */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.gettingStarted')}</CardTitle>
                  <CardDescription>اتبع هذه الخطوات للبدء بسرعة</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        ١
                      </div>
                      <div>
                        <h3 className="font-medium">{t('dashboard.step1Title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('dashboard.step1Description')}</p>
                        <Link href="/connect">
                          <Button variant="outline" size="sm" className="mt-2">
                            {t('dashboard.connectAccounts')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        ٢
                      </div>
                      <div>
                        <h3 className="font-medium">{t('dashboard.step2Title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('dashboard.step2Description')}</p>
                        <Link href="/compose">
                          <Button variant="outline" size="sm" className="mt-2">
                            {t('dashboard.createPost')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        ٣
                      </div>
                      <div>
                        <h3 className="font-medium">{t('dashboard.step3Title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('dashboard.step3Description')}</p>
                        <Link href="/settings">
                          <Button variant="outline" size="sm" className="mt-2">
                            {t('dashboard.exploreSettings')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right column - Connected platforms */}
            <div className="lg:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.connectedAccounts', 'الحسابات المرتبطة')}</CardTitle>
                  <CardDescription>إدارة حسابات التواصل الاجتماعي المرتبطة</CardDescription>
                </CardHeader>
                <CardContent>
                  <ConnectedAccountsWidget />
                </CardContent>
                <CardFooter>
                  <Link href="/connect">
                    <Button variant="outline" size="sm">
                      إدارة الحسابات
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.scheduledPosts', 'المنشورات المجدولة')}</CardTitle>
                  <CardDescription>استعراض المنشورات المجدولة القادمة</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScheduledPostsWidget />
                </CardContent>
                <CardFooter>
                  <Link href="/scheduled">
                    <Button variant="outline" size="sm">
                      عرض الكل
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليلات الأداء</CardTitle>
              <CardDescription>
                تحليل أداء منشوراتك وحساباتك
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : metrics?.accounts?.details?.length ? (
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border bg-card p-3">
                      <h4 className="mb-1 text-sm font-medium text-muted-foreground">المتابعين</h4>
                      <p className="text-2xl font-semibold">
                        {metrics?.accounts?.details?.reduce((sum, acc) => sum + (acc.stats?.followers || 0), 0) || 0}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <h4 className="mb-1 text-sm font-medium text-muted-foreground">التفاعل</h4>
                      <p className="text-2xl font-semibold">
                        {metrics?.accounts?.details?.length ? 
                          `${(metrics?.accounts?.details?.reduce((sum, acc) => sum + (acc.stats?.engagement || 0), 0) / metrics?.accounts?.details?.length).toFixed(1)}%` : 
                          '0%'
                        }
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <h4 className="mb-1 text-sm font-medium text-muted-foreground">المنشورات</h4>
                      <p className="text-2xl font-semibold">{metrics?.posts?.total || 0}</p>
                    </div>
                  </div>
                  <Link href="/analytics">
                    <Button>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      عرض التحليلات المفصلة
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">
                    لا توجد بيانات كافية بعد
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    قم بربط حساباتك وعرض التحليلات المفصلة
                  </p>
                  <div className="flex gap-4">
                    <Link href="/connect">
                      <Button variant="outline">
                        ربط الحسابات
                      </Button>
                    </Link>
                    <Link href="/analytics">
                      <Button>
                        عرض التحليلات
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accounts" className="space-y-4">
          <ConnectedAccountsWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}