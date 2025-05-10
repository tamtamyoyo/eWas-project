import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/utils";

// Types for API data
type PlatformData = {
  name: string;
  color: string;
  followers: number;
  followersChange: number;
  engagement: number;
  engagementChange: number;
  posts: number;
  postsChange: number;
  reach: number;
  reachChange: number;
};

// Types for the metrics endpoint
type PlatformStats = {
  followers?: number;
  followersChange?: number;
  engagement?: number;
  engagementChange?: number;
  postsChange?: number;
  reach?: number;
  reachChange?: number;
  [key: string]: any;
};

type AccountDetail = {
  platform: string;
  accountName: string;
  username: string;
  profileUrl: string;
  stats?: PlatformStats;
  status: string;
};

type MetricsData = {
  accounts: {
    total: number;
    platforms: string[];
    details: AccountDetail[];
  };
  posts: {
    total: number;
    published: number;
    scheduled: number;
    byPlatform: Record<string, number>;
  };
  platformMetrics: any[];
};

export default function Analytics() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("30");
  const [platform, setPlatform] = useState("all");

  // In a real implementation, we would fetch this data from the API
  const { data: userStats, isLoading } = useQuery({
    queryKey: ['/api/user-stats'],
  });

  // Fetch real platform metrics from API
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<MetricsData>({
    queryKey: ['/api/user-metrics', timeRange, platform],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to improve performance
  });
  
  // Format dates for the chart
  const generateEmptyTimeSeriesData = (days: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      data.push({
        date: date.toISOString().slice(0, 10),
        followers: 0,
        engagement: 0,
        impressions: 0,
        clicks: 0,
      });
    }
    
    return data;
  };

  // Use real data if available, otherwise show empty chart with dates
  const chartData = useMemo(() => {
    if (!metrics?.accounts?.details?.length) {
      return generateEmptyTimeSeriesData(parseInt(timeRange));
    }
    
    // Process real data from the metrics endpoint
    // This will be populated with real data once the social accounts are connected
    const timelineData = generateEmptyTimeSeriesData(parseInt(timeRange));
    return timelineData;
  }, [metrics, timeRange]);

  // Map platform colors
  const getPlatformColor = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return "#E1306C";
      case 'facebook':
        return "#4267B2";
      case 'twitter':
        return "#1DA1F2";
      case 'linkedin':
        return "#0077B5";
      case 'snapchat':
        return "#FFFC00";
      default:
        return "#6E6E6E";
    }
  };
  
  // Create platform data from metrics
  const platforms: PlatformData[] = useMemo(() => {
    if (!metrics?.accounts?.details?.length) {
      return [];
    }
    
    return metrics.accounts.details.map(account => {
      // Extract stats from platform metrics
      const stats = account.stats || {};
      
      return {
        name: account.platform,
        color: getPlatformColor(account.platform),
        followers: stats.followers || 0,
        followersChange: stats.followersChange || 0,
        engagement: stats.engagement || 0,
        engagementChange: stats.engagementChange || 0,
        posts: metrics.posts.byPlatform[account.platform.toLowerCase()] || 0,
        postsChange: stats.postsChange || 0,
        reach: stats.reach || 0,
        reachChange: stats.reachChange || 0
      };
    });
  }, [metrics]);

  // Content type data derived from real metrics
  const contentTypeData = useMemo(() => {
    if (!metrics?.posts) {
      return [
        { name: t('analytics.photos'), value: 0 },
        { name: t('analytics.videos'), value: 0 },
        { name: t('analytics.links'), value: 0 },
        { name: t('analytics.text'), value: 0 }
      ];
    }
    
    // In a real implementation, these values would come from analysis of actual posts
    // For now, we'll create empty placeholders until we connect to platforms
    return [
      { name: t('analytics.photos'), value: 0 },
      { name: t('analytics.videos'), value: 0 },
      { name: t('analytics.links'), value: 0 },
      { name: t('analytics.text'), value: 0 }
    ];
  }, [metrics, t]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
        <p className="text-neutral-500">{t('analytics.subtitle')}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue="overview" className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
            <TabsTrigger value="followers">{t('analytics.followers')}</TabsTrigger>
            <TabsTrigger value="engagement">{t('analytics.engagement')}</TabsTrigger>
            <TabsTrigger value="content">{t('analytics.content')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('analytics.selectPlatform')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('analytics.allPlatforms')}</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('analytics.selectTimeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('analytics.last7Days')}</SelectItem>
              <SelectItem value="30">{t('analytics.last30Days')}</SelectItem>
              <SelectItem value="90">{t('analytics.last90Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {platforms.map((platform) => (
          <Card key={platform.name} className={platform.name.toLowerCase() === "instagram" ? "border-[#E1306C]/30" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: platform.color }}
                  >
                    <i className={`fa-brands fa-${platform.name.toLowerCase()}`}></i>
                  </div>
                  <h3 className="font-medium">{platform.name}</h3>
                </div>
                <span className={`text-xs font-medium ${platform.followersChange >= 0 ? 'text-secondary bg-secondary/10' : 'text-status-error bg-status-error/10'} px-2 py-1 rounded-full`}>
                  {platform.followersChange >= 0 ? '+' : ''}{platform.followersChange}%
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">{t('analytics.followers')}</span>
                  <span className="font-semibold">{formatNumber(platform.followers)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">{t('analytics.engagement')}</span>
                  <span className="font-semibold">{platform.engagement}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">{t('analytics.posts')}</span>
                  <span className="font-semibold">{platform.posts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Followers Growth Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('analytics.followersGrowth')}</h3>
              <Button variant="ghost" size="sm">
                <i className="fa-solid fa-download mr-2"></i>
                {t('analytics.export')}
              </Button>
            </div>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="followers" 
                    name={t('analytics.followers')}
                    stroke="#3050F8" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('analytics.engagementTrends')}</h3>
              <Button variant="ghost" size="sm">
                <i className="fa-solid fa-download mr-2"></i>
                {t('analytics.export')}
              </Button>
            </div>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    name={t('analytics.engagement')}
                    stroke="#FF9500" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* More Analytics Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Content Type Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">{t('analytics.contentTypeBreakdown')}</h3>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name={t('analytics.percentage')} fill="#3050F8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Posts */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">{t('analytics.topPerformingPosts')}</h3>
            
            {metrics?.posts?.total ? (
              <div className="space-y-4">
                {/* This would use actual post data from metrics once available */}
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-muted-foreground">
                    ستظهر هنا أفضل المنشورات أداءً بناءً على التفاعل والوصول بعد ربط حساباتك والنشر عبرها.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <i className="fa-solid fa-chart-line text-xl text-muted-foreground mb-4"></i>
                <h4 className="font-medium mb-2">لا توجد منشورات بعد</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  قم بإنشاء ونشر المحتوى الخاص بك لعرض تحليلات المنشورات
                </p>
                <Link href="/compose">
                  <Button size="sm" variant="outline">
                    إنشاء منشور
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Download Reports Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">{t('analytics.downloadReports')}</h3>
              <p className="text-neutral-500 text-sm">{t('analytics.downloadReportsDescription')}</p>
            </div>
            <Button>
              <i className="fa-solid fa-file-export mr-2"></i>
              {t('analytics.generateReport')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-neutral-100 rounded-lg p-4 hover:border-neutral-300 transition-all">
              <div className="flex items-center mb-3">
                <i className="fa-solid fa-chart-line text-primary mr-2"></i>
                <h4 className="font-medium">{t('analytics.performanceReport')}</h4>
              </div>
              <p className="text-sm text-neutral-500 mb-4">{t('analytics.performanceReportDescription')}</p>
              <Button variant="outline" size="sm" className="w-full">
                <i className="fa-solid fa-download mr-2"></i>
                {t('analytics.download')}
              </Button>
            </div>

            <div className="border border-neutral-100 rounded-lg p-4 hover:border-neutral-300 transition-all">
              <div className="flex items-center mb-3">
                <i className="fa-solid fa-users text-accent mr-2"></i>
                <h4 className="font-medium">{t('analytics.audienceReport')}</h4>
              </div>
              <p className="text-sm text-neutral-500 mb-4">{t('analytics.audienceReportDescription')}</p>
              <Button variant="outline" size="sm" className="w-full">
                <i className="fa-solid fa-download mr-2"></i>
                {t('analytics.download')}
              </Button>
            </div>

            <div className="border border-neutral-100 rounded-lg p-4 hover:border-neutral-300 transition-all">
              <div className="flex items-center mb-3">
                <i className="fa-solid fa-file-lines text-secondary mr-2"></i>
                <h4 className="font-medium">{t('analytics.contentReport')}</h4>
              </div>
              <p className="text-sm text-neutral-500 mb-4">{t('analytics.contentReportDescription')}</p>
              <Button variant="outline" size="sm" className="w-full">
                <i className="fa-solid fa-download mr-2"></i>
                {t('analytics.download')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
