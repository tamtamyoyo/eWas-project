import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { 
  CalendarIcon, 
  Clock, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Calendar as CalendarCheckIcon,
  CalendarDays,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id: number;
  content: string;
  scheduledAt: string;
  status: string;
  platforms: string[];
  mediaUrls?: string[];
}

export default function Scheduled() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  
  // Fetch scheduled posts from API
  const { data: scheduledPosts, isLoading, refetch } = useQuery<ScheduledPost[]>({
    queryKey: ['/api/posts/scheduled'],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/scheduled'] });
      toast({
        title: "تم حذف المنشور",
        description: "تم حذف المنشور المجدول بنجاح",
      });
      setPostToDelete(null); // Reset delete dialog
    },
    onError: (error: any) => {
      toast({
        title: "فشل حذف المنشور",
        description: error.message,
        variant: "destructive",
      });
      setPostToDelete(null); // Reset delete dialog
    }
  });
  
  // Handle delete confirmation
  const handleDelete = (postId: number) => {
    setPostToDelete(postId);
  };
  
  const confirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete);
    }
  };
  
  const cancelDelete = () => {
    setPostToDelete(null);
  };
  
  // Get platform icon with colors
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <FaTwitter className="h-5 w-5 text-[#1DA1F2]" />;
      case 'facebook':
        return <FaFacebook className="h-5 w-5 text-[#1877F2]" />;
      case 'instagram':
        return <FaInstagram className="h-5 w-5 text-[#E1306C]" />;
      case 'linkedin':
        return <FaLinkedin className="h-5 w-5 text-[#0A66C2]" />;
      default:
        return null;
    }
  };
  
  // Format date in Arabic (date and time separately)
  const formatScheduleDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEEE، d MMMM yyyy', { locale: ar });
  };

  const formatScheduleTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'h:mm a', { locale: ar });
  };
  
  // Organize posts by date
  const groupPostsByDate = (posts: ScheduledPost[] = []) => {
    const grouped: Record<string, ScheduledPost[]> = {};
    
    posts.forEach(post => {
      const date = new Date(post.scheduledAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(post);
    });
    
    // Sort dates with most recent first
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, posts]) => ({
        date,
        dateFormatted: formatScheduleDate(new Date(date).toISOString()),
        posts
      }));
  };
  
  // Poll for updates every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [refetch]);
  
  const groupedPosts = groupPostsByDate(scheduledPosts);
  
  return (
    <div dir="rtl" className="container mx-auto py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">المنشورات المجدولة</h1>
          <p className="text-muted-foreground">إدارة المنشورات المجدولة عبر حساباتك المرتبطة</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={view === 'list' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView('list')}
          >
            <CalendarCheckIcon className="h-4 w-4 mr-2" />
            قائمة
          </Button>
          <Button 
            variant={view === 'calendar' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView('calendar')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            تقويم
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">الأقسام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/compose">
                  <span className="ml-2">+ إنشاء منشور جديد</span>
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20" variant="ghost">
                <Link href="/scheduled">
                  <CalendarCheckIcon className="h-4 w-4 ml-2" />
                  <span>المنشورات المجدولة</span>
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="ghost">
                <Link href="/dashboard">
                  <span className="ml-2">لوحة التحكم</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Quick stats card */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">المنشورات المجدولة:</span>
                <Badge variant="outline" className="font-bold">
                  {scheduledPosts?.length || 0}
                </Badge>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">المنشورات اليوم:</span>
                <Badge variant="outline" className="font-bold">
                  {scheduledPosts?.filter(post => 
                    new Date(post.scheduledAt).toDateString() === new Date().toDateString()
                  ).length || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-3/4">
          <Card className="border-muted">
            <CardHeader className="pb-3 border-b">
              <div className="font-medium">المنشورات القادمة</div>
            </CardHeader>
            <CardContent className={view === 'list' ? "pt-0" : "pt-6"}>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : !scheduledPosts || scheduledPosts.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="font-medium text-lg mb-2">لا توجد منشورات مجدولة حتى الآن</h3>
                  <p className="text-muted-foreground mb-4">قم بإنشاء وجدولة منشور جديد ليظهر هنا</p>
                  <Button asChild>
                    <Link href="/compose">
                      جدولة منشور الآن
                    </Link>
                  </Button>
                </div>
              ) : view === 'list' ? (
                <div>
                  {groupedPosts.map(group => (
                    <div key={group.date} className="mt-2">
                      <div className="sticky top-0 bg-card z-10 p-4 font-semibold border-b text-primary/80">
                        {group.dateFormatted}
                      </div>
                      <div className="space-y-1 p-1">
                        {group.posts.map((post) => (
                          <div 
                            key={post.id} 
                            className="border hover:bg-muted/5 rounded-md p-4 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded">
                                  <CalendarIcon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{formatScheduleTime(post.scheduledAt)}</div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {new Date(post.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/compose?edit=${post.id}`}>
                                      <Pencil className="h-4 w-4 ml-2" />
                                      تعديل
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDelete(post.id)}
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-sm line-clamp-3">{post.content}</p>
                              
                              {/* Media preview with improved layout */}
                              {post.mediaUrls && post.mediaUrls.length > 0 && (
                                <div className={cn(
                                  "mt-3 gap-2",
                                  post.mediaUrls.length > 1 
                                    ? "grid grid-cols-2" 
                                    : "flex justify-center"
                                )}>
                                  {post.mediaUrls.map((url, index) => (
                                    <div 
                                      key={index} 
                                      className={cn(
                                        "relative rounded-md overflow-hidden border",
                                        post.mediaUrls?.length === 1 ? "max-w-[250px] h-[150px]" : "h-24"
                                      )}
                                    >
                                      {url.includes('.mp4') ? (
                                        <video src={url} className="object-cover w-full h-full" />
                                      ) : (
                                        <img src={url} alt="" className="object-cover w-full h-full" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                {post.platforms.map((platform) => (
                                  <div key={platform} className="bg-muted p-1.5 rounded-full">
                                    {getPlatformIcon(platform)}
                                  </div>
                                ))}
                              </div>
                              <Badge variant="outline" className="text-xs bg-secondary/50 text-secondary-foreground">
                                مجدول
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <h3 className="font-medium text-lg mb-2">عرض التقويم</h3>
                  <p className="text-muted-foreground">هذه الميزة قيد التطوير وستكون متاحة قريباً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={postToDelete !== null} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المنشور المجدول؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذا المنشور المجدول بشكل نهائي ولن يتم نشره.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "جاري الحذف..." : "حذف المنشور"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
