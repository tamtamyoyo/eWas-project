import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

interface PostPreviewProps {
  content: string;
  mediaUrls?: string[];
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'all';
}

export default function PostPreview({ content, mediaUrls = [], platform }: PostPreviewProps) {
  const { t } = useTranslation();
  
  // Determine which platforms to display
  const platformsToShow = platform === 'all' 
    ? ['twitter', 'facebook', 'instagram', 'linkedin'] 
    : [platform];
  
  // Function to render the Twitter preview
  const renderTwitterPreview = () => (
    <Card className="border-0 shadow-sm overflow-hidden max-w-sm mx-auto">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div>
            <div className="font-medium text-sm">@eWasl</div>
            <div className="text-xs text-gray-500">{t("compose.preview.justNow", "الآن")}</div>
          </div>
          <div className="ml-auto">
            <FaTwitter className="text-[#1DA1F2]" />
          </div>
        </div>
        
        <div className="mb-2">
          <p dir="rtl" className="text-sm">{content}</p>
        </div>
        
        {mediaUrls && mediaUrls.length > 0 && (
          <div className={`mb-2 rounded-lg overflow-hidden ${mediaUrls.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
            {mediaUrls.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={t("compose.preview.mediaAlt", "صورة المنشور")} 
                className="w-full h-auto rounded-lg"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Function to render the Facebook preview
  const renderFacebookPreview = () => (
    <Card className="border-0 shadow-sm overflow-hidden max-w-sm mx-auto">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div>
            <div className="font-medium text-sm">eWasl</div>
            <div className="text-xs text-gray-500">{t("compose.preview.justNow", "الآن")}</div>
          </div>
          <div className="ml-auto">
            <FaFacebook className="text-[#1877F2]" />
          </div>
        </div>
        
        <div className="mb-2">
          <p dir="rtl" className="text-sm">{content}</p>
        </div>
        
        {mediaUrls && mediaUrls.length > 0 && (
          <div className={`mb-2 rounded-lg overflow-hidden ${mediaUrls.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
            {mediaUrls.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={t("compose.preview.mediaAlt", "صورة المنشور")} 
                className="w-full h-auto rounded-lg"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Function to render the Instagram preview
  const renderInstagramPreview = () => (
    <Card className="border-0 shadow-sm overflow-hidden max-w-sm mx-auto">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div>
            <div className="font-medium text-sm">eWasl</div>
          </div>
          <div className="ml-auto">
            <FaInstagram className="text-[#E1306C]" />
          </div>
        </div>
        
        {mediaUrls && mediaUrls.length > 0 ? (
          <div className={`mb-2 rounded-lg overflow-hidden ${mediaUrls.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
            {mediaUrls.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={t("compose.preview.mediaAlt", "صورة المنشور")} 
                className="w-full h-auto rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="mb-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-6">
            <p className="text-white text-center text-sm font-medium">{content.substring(0, 30)}{content.length > 30 ? '...' : ''}</p>
          </div>
        )}
        
        <div className="mb-1">
          <p dir="rtl" className="text-sm">{content}</p>
        </div>
      </CardContent>
    </Card>
  );
  
  // Function to render the LinkedIn preview
  const renderLinkedInPreview = () => (
    <Card className="border-0 shadow-sm overflow-hidden max-w-sm mx-auto">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div>
            <div className="font-medium text-sm">eWasl</div>
            <div className="text-xs text-gray-500">{t("compose.preview.justNow", "الآن")}</div>
          </div>
          <div className="ml-auto">
            <FaLinkedin className="text-[#0077B5]" />
          </div>
        </div>
        
        <div className="mb-2">
          <p dir="rtl" className="text-sm">{content}</p>
        </div>
        
        {mediaUrls && mediaUrls.length > 0 && (
          <div className={`mb-2 rounded-lg overflow-hidden ${mediaUrls.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
            {mediaUrls.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={t("compose.preview.mediaAlt", "صورة المنشور")} 
                className="w-full h-auto rounded-lg"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // If only one platform is selected, render just that preview
  if (platform !== 'all') {
    if (platform === 'twitter') return renderTwitterPreview();
    if (platform === 'facebook') return renderFacebookPreview();
    if (platform === 'instagram') return renderInstagramPreview();
    if (platform === 'linkedin') return renderLinkedInPreview();
  }
  
  // Render tabs for all platforms
  return (
    <Tabs defaultValue="twitter" className="w-full max-w-md mx-auto">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="twitter">
          <FaTwitter className="text-[#1DA1F2] mr-1" />
          <span className="sr-only">Twitter</span>
        </TabsTrigger>
        <TabsTrigger value="facebook">
          <FaFacebook className="text-[#1877F2] mr-1" />
          <span className="sr-only">Facebook</span>
        </TabsTrigger>
        <TabsTrigger value="instagram">
          <FaInstagram className="text-[#E1306C] mr-1" />
          <span className="sr-only">Instagram</span>
        </TabsTrigger>
        <TabsTrigger value="linkedin">
          <FaLinkedin className="text-[#0077B5] mr-1" />
          <span className="sr-only">LinkedIn</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="twitter">
        {renderTwitterPreview()}
      </TabsContent>
      
      <TabsContent value="facebook">
        {renderFacebookPreview()}
      </TabsContent>
      
      <TabsContent value="instagram">
        {renderInstagramPreview()}
      </TabsContent>
      
      <TabsContent value="linkedin">
        {renderLinkedInPreview()}
      </TabsContent>
    </Tabs>
  );
}