import React from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Platform specific styles
const platformStyles = {
  twitter: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: "16px",
    lineHeight: "1.4",
    maxLength: 280,
    avatar: "rounded-full",
    imageContainer: "rounded-xl overflow-hidden mt-3",
    container: "bg-white dark:bg-[#15202b] text-black dark:text-white p-4 rounded-xl",
    username: "text-[#536471] dark:text-[#8899a6] text-sm",
    date: "text-[#536471] dark:text-[#8899a6] text-sm",
  },
  facebook: {
    fontFamily: "'Segoe UI Historic', 'Segoe UI', Helvetica, Arial, sans-serif",
    fontSize: "15px",
    lineHeight: "1.5",
    maxLength: 5000,
    avatar: "rounded-full",
    imageContainer: "rounded-md overflow-hidden mt-3",
    container: "bg-white dark:bg-[#242526] text-black dark:text-white p-4 rounded-md",
    username: "font-semibold",
    date: "text-[#65676b] dark:text-[#b0b3b8] text-xs",
  },
  instagram: {
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    maxLength: 2200,
    avatar: "rounded-full",
    imageContainer: "mt-3",
    container: "bg-white dark:bg-black text-black dark:text-white p-4",
    username: "font-semibold",
    date: "text-[#8e8e8e] text-xs",
  },
  linkedin: {
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    fontSize: "16px",
    lineHeight: "1.5",
    maxLength: 3000,
    avatar: "rounded-md",
    imageContainer: "rounded-md overflow-hidden mt-3",
    container: "bg-white dark:bg-[#1d2226] text-black dark:text-white p-4 rounded-md",
    username: "font-semibold",
    date: "text-[#666666] dark:text-[#a6a6a6] text-sm",
  },
};

interface PostPreviewProps {
  content: string;
  mediaUrls: string[];
  platform: "twitter" | "facebook" | "instagram" | "linkedin" | "all";
}

const NewPostPreview: React.FC<PostPreviewProps> = ({
  content,
  mediaUrls,
  platform,
}) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  // Get current date in Arabic or English
  const currentDate = format(new Date(), "d MMMM yyyy", { locale: ar });

  // Handle empty state
  if (!content && (!mediaUrls || mediaUrls.length === 0)) {
    return (
      <div className="bg-muted p-6 rounded-md text-center">
        <p className="text-muted-foreground">
          {t("preview.emptyContent", "المعاينة ستظهر هنا عند كتابة المحتوى")}
        </p>
      </div>
    );
  }

  // If platform is "all", use Twitter as default
  const style = platform === "all" ? platformStyles.twitter : platformStyles[platform];

  return (
    <Card className="border">
      <CardContent className="p-0">
        <div 
          className={style.container} 
          style={{ 
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          {/* Post Header */}
          <div className="flex items-start">
            <Avatar className={`${style.avatar} h-10 w-10 mr-3`}>
              <AvatarImage 
                src={user?.photoURL || ""}
                alt={user?.fullName || user?.username || ""}
              />
              <AvatarFallback>
                {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col">
                <span className={style.username}>
                  {user?.fullName || user?.username || t("preview.user", "المستخدم")}
                </span>
                <span className={style.date}>
                  {currentDate}
                </span>
              </div>
              
              {/* Post Content */}
              <div className="mt-2 whitespace-pre-wrap">{content}</div>
              
              {/* Media Display */}
              {mediaUrls && mediaUrls.length > 0 && (
                <div 
                  className={`${style.imageContainer} ${
                    mediaUrls.length > 1 ? "grid grid-cols-2 gap-1" : ""
                  }`}
                >
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="overflow-hidden">
                      {url.endsWith('.mp4') ? (
                        <video 
                          className="w-full max-h-72 object-cover" 
                          src={url} 
                          controls={false}
                        />
                      ) : (
                        <img 
                          className="w-full object-cover" 
                          src={url}
                          alt=""
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform-specific Interaction Controls (simplified) */}
          <div className="flex justify-around mt-4 text-sm text-muted-foreground">
            {platform === "twitter" && (
              <>
                <div>💬 {t("preview.comment", "تعليق")}</div>
                <div>🔁 {t("preview.retweet", "إعادة تغريد")}</div>
                <div>❤️ {t("preview.like", "إعجاب")}</div>
                <div>📤 {t("preview.share", "مشاركة")}</div>
              </>
            )}
            
            {platform === "facebook" && (
              <>
                <div>👍 {t("preview.like", "إعجاب")}</div>
                <div>💬 {t("preview.comment", "تعليق")}</div>
                <div>📤 {t("preview.share", "مشاركة")}</div>
              </>
            )}
            
            {platform === "instagram" && (
              <>
                <div>❤️ {t("preview.like", "إعجاب")}</div>
                <div>💬 {t("preview.comment", "تعليق")}</div>
                <div>📤 {t("preview.share", "مشاركة")}</div>
              </>
            )}
            
            {platform === "linkedin" && (
              <>
                <div>👍 {t("preview.like", "إعجاب")}</div>
                <div>💬 {t("preview.comment", "تعليق")}</div>
                <div>🔄 {t("preview.repost", "إعادة نشر")}</div>
                <div>📤 {t("preview.send", "إرسال")}</div>
              </>
            )}
            
            {platform === "all" && (
              <>
                <div>❤️ {t("preview.like", "إعجاب")}</div>
                <div>💬 {t("preview.comment", "تعليق")}</div>
                <div>📤 {t("preview.share", "مشاركة")}</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewPostPreview;