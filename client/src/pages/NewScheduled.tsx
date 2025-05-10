import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useLocation } from "wouter";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {  Plus,  } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import {  AlertDialog,  AlertDialogAction,  AlertDialogCancel,  AlertDialogContent,  AlertDialogDescription,  AlertDialogFooter,  AlertDialogHeader,  AlertDialogTitle, } from "@/components/ui/alert-dialog";


// Helper to get platform icon
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'twitter':
      return <FaTwitter className="h-4 w-4 text-[#1DA1F2]" />;
    case 'facebook':
      return <FaFacebook className="h-4 w-4 text-[#1877F2]" />;
    case 'instagram':
      return <FaInstagram className="h-4 w-4 text-[#E1306C]" />;
    case 'linkedin':
      return <FaLinkedin className="h-4 w-4 text-[#0A66C2]" />;
    default:
      return null;
  }
};

export default function NewScheduled() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const { data: scheduledPosts = [], isLoading, isError, error, deletePost } = useScheduledPosts();

  const handleDeleteClick = (postId: number) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      deletePost(postToDelete)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
          toast({
            title: t("scheduled.deleteSuccess", "تم حذف المنشور بنجاح"),
          });
          setDeleteDialogOpen(false);
        })
        .catch((error: any) => {
          toast({
            title: t("scheduled.deleteError", "فشل حذف المنشور"),
            description: error.message,
            variant: "destructive",
          });
        });
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("scheduled.title", "المنشورات المجدولة")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("scheduled.description", "قم بإدارة المنشورات المجدولة للنشر التلقائي")}
          </p>
        </div>
        <Button onClick={() => setLocation("/compose")} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("scheduled.newPost", "إنشاء منشور جديد")}
        </Button>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("scheduled.calendar", "التقويم")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("scheduled.posts", "المنشورات المجدولة")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Plus className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center text-red-500">
                <p>{error?.message || t("scheduled.error", "حدث خطأ أثناء تحميل المنشورات المجدولة")}</p>
              </div>
            ) : scheduledPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <i className="fa-regular fa-calendar text-xl text-muted-foreground"></i>
                </div>
                <h3 className="font-semibold mb-2">{t("scheduled.empty", "لا توجد منشورات مجدولة")}</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {t("scheduled.emptyDescription", "جدول منشوراتك مسبقاً للنشر التلقائي في الوقت المناسب")}
                </p>
                <Button onClick={() => setLocation("/compose")} variant="outline" className="mt-4">
                  {t("scheduled.createFirst", "إنشاء أول منشور")}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {scheduledPosts.map((post) => (
                  <div key={post.id} className="py-4 flex items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{post.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <i className="fa-regular fa-clock"></i>
                        <span>{format(new Date(post.scheduledAt), "dd/MM/yyyy hh:mm a", { locale: ar })}</span>
                      </div>
                      <div className="flex space-x-1 space-x-reverse">
                        {post.platforms.map(platform => (
                          <div key={platform} className="w-6 h-6 flex items-center justify-center">
                            <PlatformIcon platform={platform} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Button onClick={() => handleDeleteClick(post.id)} variant="ghost" size="icon" className="text-red-500">
                        <i className="fa-solid fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scheduled.confirmDelete", "تأكيد الحذف")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("scheduled.deleteWarning", "هل أنت متأكد من حذف هذا المنشور المجدول؟ لا يمكن التراجع عن هذا الإجراء.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel", "إلغاء")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("scheduled.delete", "حذف")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}