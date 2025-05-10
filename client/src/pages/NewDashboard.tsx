import React from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "wouter"
import { 
  FaArrowUp, 
  FaPenToSquare, 
  FaArrowDown, 
  FaChartLine, 
  FaUsers, 
  FaRectangleList 
} from "react-icons/fa6"
import { Link } from "wouter"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScheduledPostsWidget from "@/components/dashboard/ScheduledPostsWidget"
import ConnectedAccountsWidget from "@/components/dashboard/ConnectedAccountsWidget"

export default function NewDashboard() {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  
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
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.totalPosts', 'إجمالي المنشورات')}
                </CardTitle>
                <FaRectangleList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +2.5% {t('dashboard.stats.fromLastMonth', 'من الشهر الماضي')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.engagement', 'معدل التفاعل')}
                </CardTitle>
                <FaChartLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2%</div>
                <div className="flex items-center text-xs text-green-500">
                  <FaArrowUp className="mr-1 h-3 w-3" />
                  <span>+0.8%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.followers', 'المتابعين')}
                </CardTitle>
                <FaUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">573</div>
                <div className="flex items-center text-xs text-red-500">
                  <FaArrowDown className="mr-1 h-3 w-3" />
                  <span>-1.2%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.pending', 'منشورات مجدولة')}
                </CardTitle>
                <FaPenToSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.stats.scheduled', 'مقرر نشرها هذا الأسبوع')}
                </p>
              </CardContent>
            </Card>
          </div>
          
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
          
          {/* Two-column layout for widgets */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.scheduledPosts', 'المنشورات المجدولة')}</CardTitle>
                <CardDescription>
                  {t('dashboard.scheduledPostsDesc', 'استعراض المنشورات المجدولة القادمة')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduledPostsWidget />
              </CardContent>
              <CardFooter>
                <Link href="/scheduled">
                  <Button variant="outline" size="sm">
                    {t('dashboard.viewAll', 'عرض الكل')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.connectedAccounts', 'الحسابات المرتبطة')}</CardTitle>
                <CardDescription>
                  {t('dashboard.connectedAccountsDesc', 'إدارة حسابات التواصل الاجتماعي المرتبطة')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectedAccountsWidget />
              </CardContent>
              <CardFooter>
                <Link href="/connect">
                  <Button variant="outline" size="sm">
                    {t('dashboard.manage', 'إدارة الحسابات')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          {/* Get started steps */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.gettingStarted')}</CardTitle>
              <CardDescription>
                {t('dashboard.gettingStartedDesc', 'اتبع هذه الخطوات للبدء بسرعة')}
              </CardDescription>
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
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.analytics.title', 'تحليلات الأداء')}</CardTitle>
              <CardDescription>
                {t('dashboard.analytics.description', 'تحليل أداء منشوراتك وحساباتك')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FaChartLine className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  {t('dashboard.analytics.noDataTitle', 'لا توجد بيانات كافية بعد')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('dashboard.analytics.noDataDesc', 'قم بنشر المزيد من المحتوى لعرض تحليلات مفصلة')}
                </p>
                <Button>
                  {t('dashboard.analytics.viewDetails', 'عرض التفاصيل')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accounts" className="space-y-4">
          <ConnectedAccountsWidget />
        </TabsContent>
      </Tabs>
    </div>
  )
}