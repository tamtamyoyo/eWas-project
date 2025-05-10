import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Upload,
  Calendar as CalendarIcon,
  Clock,
  Image,
  Video,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PostPreview from "@/components/compose/NewPostPreview";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";

export default function NewCompose() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const editId = searchParams.get("edit");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Query connected social accounts
  const { data: socialAccounts, isLoading: accountsLoading } = useSocialAccounts();
  
  // Post state
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'all'>('all');
  
  // Scheduling state
  const [schedule, setSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string>("12:00");
  const [uploading, setUploading] = useState(false);
  
  // Media upload handling
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      
      const response = await apiRequest("POST", "/api/upload-media", formData);
      
      if (!response.ok) {
        throw new Error(t("compose.uploadError", "Failed to upload media"));
      }
      
      const data = await response.json();
      setMediaUrls(prev => [...prev, ...data.fileUrls]);
      
      toast({
        title: t("compose.uploadSuccess", "تم رفع الملفات بنجاح"),
        description: t("compose.mediaUploaded", "تم رفع الملفات بنجاح وإضافتها للمنشور"),
      });
    } catch (error: any) {
      toast({
        title: t("compose.error", "خطأ"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }
  
  // Remove a media item
  function removeMedia(indexToRemove: number) {
    setMediaUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  }
  
  // Toggle platform selection 
  function togglePlatform(platform: string) {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  }
  
  // Check if a platform is connected
  function isPlatformConnected(platform: string): boolean {
    if (!socialAccounts) return false;
    return socialAccounts.some(account => account.platform === platform);
  }
  
  // Create or update post mutation
  const postMutation = useMutation({
    mutationFn: async (postData: any) => {
      if (editId) {
        // Update existing post
        return apiRequest("PUT", `/api/posts/${editId}`, postData);
      } else {
        // Create new post
        return apiRequest("POST", "/api/posts", postData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/scheduled'] });
      
      toast({
        title: editId 
          ? t("compose.updateSuccess", "تم تحديث المنشور بنجاح") 
          : t("compose.success", "تم إنشاء المنشور بنجاح"),
        description: schedule 
          ? t("compose.scheduledMessage", "تم جدولة المنشور بنجاح وسيتم نشره في الوقت المحدد") 
          : t("compose.publishedMessage", "تم نشر المنشور بنجاح"),
      });
      
      // Redirect to scheduled posts if scheduled, otherwise to dashboard
      setLocation(schedule ? "/scheduled" : "/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: t("compose.error", "خطأ"),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch post data if editing
  const { data: existingPost, isLoading: postLoading } = useQuery({
    queryKey: ['/api/posts', editId],
    queryFn: async () => {
      if (!editId) return null;
      const response = await apiRequest("GET", `/api/posts/${editId}`);
      return response.json();
    },
    enabled: !!editId,
  });
  
  // Populate form with existing post data
  useEffect(() => {
    if (existingPost) {
      setContent(existingPost.content || "");
      setMediaUrls(existingPost.mediaUrls || []);
      setSelectedPlatforms(existingPost.platforms || []);
      
      if (existingPost.scheduledAt) {
        setSchedule(true);
        const scheduledDate = new Date(existingPost.scheduledAt);
        setScheduledDate(scheduledDate);
        
        // Format time as HH:MM
        const hours = scheduledDate.getHours().toString().padStart(2, "0");
        const minutes = scheduledDate.getMinutes().toString().padStart(2, "0");
        setScheduledTime(`${hours}:${minutes}`);
      }
    }
  }, [existingPost]);
  
  // Calculate combined scheduled datetime
  function getScheduledDateTime(): Date | null {
    if (!schedule || !scheduledDate) return null;
    
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const dateTime = new Date(scheduledDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!content && mediaUrls.length === 0) {
      toast({
        title: t("compose.error", "خطأ"),
        description: t("compose.contentRequired", "يرجى إدخال نص أو إضافة صورة للمنشور"),
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: t("compose.error", "خطأ"),
        description: t("compose.platformRequired", "يرجى اختيار منصة واحدة على الأقل"),
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for submission
    const postData: any = {
      content,
      mediaUrls,
      platforms: selectedPlatforms,
      status: schedule ? "scheduled" : "published",
    };
    
    // Add scheduled datetime if scheduling
    if (schedule) {
      const scheduledDateTime = getScheduledDateTime();
      
      if (!scheduledDateTime) {
        toast({
          title: t("compose.error", "خطأ"),
          description: t("compose.scheduleTimeRequired", "يرجى تحديد وقت للجدولة"),
          variant: "destructive",
        });
        return;
      }
      
      const now = new Date();
      if (scheduledDateTime <= now) {
        toast({
          title: t("compose.error", "خطأ"),
          description: t("compose.futureDateRequired", "يرجى اختيار تاريخ ووقت في المستقبل"),
          variant: "destructive",
        });
        return;
      }
      
      postData.scheduledAt = scheduledDateTime.toISOString();
    }
    
    // Submit the post
    postMutation.mutate(postData);
  }
  
  // Loading state
  if (editId && postLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جاري تحميل المنشور...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div dir="rtl" className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {editId ? t("compose.editPost", "تعديل المنشور") : t("compose.newPost", "إنشاء منشور جديد")}
        </h1>
        <p className="text-muted-foreground">
          {t("compose.description", "قم بإنشاء محتوى جديد ومشاركته عبر منصات التواصل الاجتماعي المختلفة")}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Content editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Textarea
                  className="min-h-[200px] resize-none text-base leading-relaxed"
                  placeholder={t("compose.contentPlaceholder", "اكتب منشورك هنا...")}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                
                {/* Media uploads */}
                {mediaUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {mediaUrls.map((url, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden border">
                        {url.endsWith('.mp4') ? (
                          <video 
                            src={url} 
                            className="w-full h-32 object-cover" 
                            controls={false}
                          />
                        ) : (
                          <img 
                            src={url} 
                            alt="" 
                            className="w-full h-32 object-cover" 
                          />
                        )}
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeMedia(index)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Media upload buttons */}
                <div className="flex items-center mt-4 space-x-4 justify-between">
                  <div>
                    <input
                      type="file"
                      id="media-upload"
                      className="hidden"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1 space-x-reverse rtl:space-x-reverse"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <Image className="h-4 w-4 ml-2" />
                        )}
                        <span>{t("compose.addMedia", "إضافة وسائط")}</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                    <span className="text-sm text-muted-foreground">
                      {content.length} {t("compose.characters", "حرف")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Platform selection */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium mb-4">{t("compose.selectPlatforms", "اختر المنصات")}</h2>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={selectedPlatforms.includes("twitter") ? "default" : "outline"}
                    size="lg"
                    className={`flex items-center space-x-2 space-x-reverse ${!isPlatformConnected("twitter") ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => isPlatformConnected("twitter") && togglePlatform("twitter")}
                    disabled={!isPlatformConnected("twitter")}
                  >
                    <FaTwitter className="h-5 w-5 ml-2 text-[#1DA1F2]" />
                    <span>Twitter</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={selectedPlatforms.includes("facebook") ? "default" : "outline"}
                    size="lg"
                    className={`flex items-center space-x-2 space-x-reverse ${!isPlatformConnected("facebook") ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => isPlatformConnected("facebook") && togglePlatform("facebook")}
                    disabled={!isPlatformConnected("facebook")}
                  >
                    <FaFacebook className="h-5 w-5 ml-2 text-[#1877F2]" />
                    <span>Facebook</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={selectedPlatforms.includes("instagram") ? "default" : "outline"}
                    size="lg"
                    className={`flex items-center space-x-2 space-x-reverse ${!isPlatformConnected("instagram") ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => isPlatformConnected("instagram") && togglePlatform("instagram")}
                    disabled={!isPlatformConnected("instagram")}
                  >
                    <FaInstagram className="h-5 w-5 ml-2 text-[#E1306C]" />
                    <span>Instagram</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={selectedPlatforms.includes("linkedin") ? "default" : "outline"}
                    size="lg"
                    className={`flex items-center space-x-2 space-x-reverse ${!isPlatformConnected("linkedin") ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => isPlatformConnected("linkedin") && togglePlatform("linkedin")}
                    disabled={!isPlatformConnected("linkedin")}
                  >
                    <FaLinkedin className="h-5 w-5 ml-2 text-[#0A66C2]" />
                    <span>LinkedIn</span>
                  </Button>
                </div>
                
                {selectedPlatforms.length === 0 && (
                  <div className="mt-4 flex items-center text-sm text-amber-600 dark:text-amber-500">
                    <AlertCircle className="h-4 w-4 ml-2" />
                    <span>{t("compose.noPlatformSelected", "يرجى اختيار منصة واحدة على الأقل")}</span>
                  </div>
                )}
                
                {!socialAccounts?.length && !accountsLoading && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="text-sm">{t("compose.noAccountsConnected", "لم تقم بربط أي حسابات بعد")}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm"
                      onClick={() => setLocation("/connect")}
                    >
                      {t("compose.connectAccounts", "ربط حسابات جديدة")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Scheduling options */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-medium">{t("compose.schedulePost", "جدولة المنشور")}</h2>
                  <Switch
                    checked={schedule}
                    onCheckedChange={setSchedule}
                  />
                </div>
                
                {schedule && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>{t("compose.date", "التاريخ")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-right mt-1"
                            >
                              <CalendarIcon className="ml-2 h-4 w-4" />
                              {scheduledDate ? (
                                format(scheduledDate, "EEEE d MMMM yyyy", { locale: ar })
                              ) : (
                                <span>{t("compose.selectDate", "اختر التاريخ")}</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              initialFocus
                              locale={ar}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Label>{t("compose.time", "الوقت")}</Label>
                        <div className="flex items-center mt-1">
                          <Button
                            variant="outline"
                            className="w-full justify-start text-right"
                          >
                            <Clock className="ml-2 h-4 w-4" />
                            <input 
                              type="time" 
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="border-0 p-0 focus:ring-0 focus:outline-none bg-transparent"
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date/time validation message */}
                    {scheduledDate && getScheduledDateTime() && getScheduledDateTime()! <= new Date() && (
                      <div className="flex items-center text-sm text-amber-600 dark:text-amber-500">
                        <AlertCircle className="h-4 w-4 ml-2" />
                        <span>{t("compose.invalidScheduleTime", "يرجى اختيار وقت في المستقبل")}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Submit buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(editId ? "/scheduled" : "/dashboard")}
              >
                {t("common.cancel", "إلغاء")}
              </Button>
              
              <Button 
                type="submit"
                disabled={postMutation.isPending || selectedPlatforms.length === 0}
                className="min-w-[120px]"
              >
                {postMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : schedule ? (
                  t("compose.schedule", "جدولة")
                ) : (
                  t("compose.publish", "نشر الآن")
                )}
              </Button>
            </div>
          </div>
          
          {/* Right column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-medium mb-4">{t("compose.preview", "معاينة")}</h2>
                  
                  {/* Platform selector tabs */}
                  <div className="mb-4">
                    <Tabs defaultValue="all">
                      <TabsList className="w-full">
                        <TabsTrigger 
                          value="all" 
                          onClick={() => setPreviewPlatform('all')}
                          className={previewPlatform === 'all' ? "bg-primary text-primary-foreground" : ""}
                        >
                          {t("compose.allPlatforms", "الكل")}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="twitter" 
                          onClick={() => setPreviewPlatform('twitter')}
                          className={previewPlatform === 'twitter' ? "bg-primary text-primary-foreground" : ""}
                          disabled={!selectedPlatforms.includes("twitter")}
                        >
                          <FaTwitter className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger 
                          value="facebook" 
                          onClick={() => setPreviewPlatform('facebook')}
                          className={previewPlatform === 'facebook' ? "bg-primary text-primary-foreground" : ""}
                          disabled={!selectedPlatforms.includes("facebook")}
                        >
                          <FaFacebook className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger 
                          value="instagram" 
                          onClick={() => setPreviewPlatform('instagram')}
                          className={previewPlatform === 'instagram' ? "bg-primary text-primary-foreground" : ""}
                          disabled={!selectedPlatforms.includes("instagram")}
                        >
                          <FaInstagram className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger 
                          value="linkedin" 
                          onClick={() => setPreviewPlatform('linkedin')}
                          className={previewPlatform === 'linkedin' ? "bg-primary text-primary-foreground" : ""}
                          disabled={!selectedPlatforms.includes("linkedin")}
                        >
                          <FaLinkedin className="h-4 w-4" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  {/* Post preview */}
                  <div className="mt-4">
                    <PostPreview 
                      content={content} 
                      mediaUrls={mediaUrls} 
                      platform={previewPlatform} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}