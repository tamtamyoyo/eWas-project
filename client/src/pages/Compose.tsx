import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Link,
  FileUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import PostPreview from "@/components/compose/PostPreview";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";

export default function Compose() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: accounts, isLoading: accountsLoading } = useSocialAccounts();
  
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [schedule, setSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string>("12:00");
  
  // Get connected platforms
  const connectedPlatforms = accounts
    ? accounts.map((account: any) => account.platform)
    : [];
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    // Basic validation
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
    
    // Check for invalid files
    const invalidFiles = files.filter(
      file => !validTypes.includes(file.type) || file.size > maxFileSize
    );
    
    if (invalidFiles.length > 0) {
      toast({
        title: t("compose.invalidFiles"),
        description: t("compose.invalidFilesDescription"),
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });
      
      // Upload files
      const response = await fetch("/api/upload-media", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(t("compose.uploadFailed"));
      }
      
      const data = await response.json();
      setMediaUrls(prev => [...prev, ...data.fileUrls]);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: t("compose.uploadFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };
  
  const handlePublish = async () => {
    if (!content.trim()) {
      toast({
        title: t("compose.contentRequired"),
        description: t("compose.enterContent"),
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPlatform === "all" && connectedPlatforms.length === 0) {
      toast({
        title: t("compose.noConnectedPlatforms"),
        description: t("compose.connectPlatforms"),
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPlatform !== "all" && !connectedPlatforms.includes(selectedPlatform)) {
      toast({
        title: t("compose.platformNotConnected"),
        description: t("compose.connectPlatform", { platform: selectedPlatform }),
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Implement actual publishing logic
    
    toast({
      title: schedule 
        ? t("compose.scheduledSuccessfully") 
        : t("compose.publishedSuccessfully"),
      description: schedule 
        ? t("compose.postScheduled") 
        : t("compose.postSentToQueue"),
    });
    
    // Reset form after successful publish
    setContent("");
    setMediaUrls([]);
    setSchedule(false);
    setScheduledDate(undefined);
    setScheduledTime("12:00");
  };
  
  // Available platform options
  const platformOptions = [
    { value: "all", label: t("compose.allPlatforms"), icon: <Upload className="h-4 w-4" /> },
    { value: "twitter", label: "Twitter", icon: <FaTwitter className="h-4 w-4 text-[#1DA1F2]" /> },
    { value: "facebook", label: "Facebook", icon: <FaFacebook className="h-4 w-4 text-[#1877F2]" /> },
    { value: "instagram", label: "Instagram", icon: <FaInstagram className="h-4 w-4 text-[#E1306C]" /> },
    { value: "linkedin", label: "LinkedIn", icon: <FaLinkedin className="h-4 w-4 text-[#0A66C2]" /> },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-right">{t("compose.title")}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Compose Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div></div> {/* Empty div for flex spacing */}
                <Select 
                  value={selectedPlatform} 
                  onValueChange={setSelectedPlatform}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>{platformOptions.find(p => p.value === selectedPlatform)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value} className="flex items-center">
                        <div className="flex items-center">
                          {platform.icon}
                          <span className="mr-2">{platform.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder={t("compose.writeSomething")}
                className="min-h-[200px] text-right resize-none mb-4"
                value={content}
                onChange={handleContentChange}
                dir="rtl"
              />
              
              {/* Media preview */}
              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={t("compose.uploadedMedia")}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Media upload and tools */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t">
                <div className="flex space-x-3">
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={handleFileUpload}
                      multiple
                      accept="image/jpeg,image/png,image/gif,video/mp4"
                      disabled={uploading}
                    />
                    <Button variant="ghost" size="sm" className="text-gray-500" disabled={uploading}>
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Image className="h-5 w-5 mr-1" />
                          <span className="sr-only">{t("compose.addImage")}</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Video className="h-5 w-5 mr-1" />
                    <span className="sr-only">{t("compose.addVideo")}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Link className="h-5 w-5 mr-1" />
                    <span className="sr-only">{t("compose.addLink")}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <FileUp className="h-5 w-5 mr-1" />
                    <span className="sr-only">{t("compose.addDocument")}</span>
                  </Button>
                </div>
                
                <div className="flex items-center mt-3 sm:mt-0">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="schedule" className="text-sm cursor-pointer">
                      {t("compose.schedulePost")}
                    </Label>
                    <Switch
                      id="schedule"
                      checked={schedule}
                      onCheckedChange={setSchedule}
                    />
                  </div>
                </div>
              </div>
              
              {/* Scheduling options */}
              {schedule && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <Label className="mb-2 block text-sm">{t("compose.date")}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[200px] justify-start text-left"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? (
                              format(scheduledDate, "PPP", { locale: ar })
                            ) : (
                              <span>{t("compose.pickDate")}</span>
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
                      <Label className="mb-2 block text-sm">{t("compose.time")}</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-[200px] h-10 px-9 rounded-md border border-input bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {!scheduledDate && (
                    <div className="mt-3 flex items-center text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="text-xs">{t("compose.dateRequired")}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Publish button */}
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handlePublish} 
                  disabled={!content.trim() || (schedule && !scheduledDate)}
                >
                  {schedule ? t("compose.schedule") : t("compose.publish")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Preview and AI Assistance Area */}
        <div className="space-y-6">
          <Tabs defaultValue="preview" dir="rtl">
            <TabsList className="w-full">
              <TabsTrigger value="preview">{t("compose.preview")}</TabsTrigger>
              <TabsTrigger value="suggestions">{t("compose.suggestions")}</TabsTrigger>
              <TabsTrigger value="hashtags">{t("compose.hashtags")}</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="pt-4">
              {content ? (
                <PostPreview 
                  content={content} 
                  mediaUrls={mediaUrls} 
                  platform={selectedPlatform as any} 
                />
              ) : (
                <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                  <p>{t("compose.enterContentForPreview")}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="suggestions" className="pt-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t("compose.aiSuggestionsComingSoon")}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="hashtags" className="pt-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t("compose.hashtagSuggestionsComingSoon")}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}