import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

// In a real app, this data would come from an API
const platforms = [
  {
    id: "facebook",
    name: "Facebook",
    iconClass: "fa-facebook-f",
    color: "#4267B2",
    isConnected: true
  },
  {
    id: "instagram",
    name: "Instagram",
    iconClass: "fa-instagram",
    color: "#E1306C",
    isConnected: true
  },
  {
    id: "twitter",
    name: "Twitter",
    iconClass: "fa-twitter",
    color: "#1DA1F2",
    isConnected: true
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    iconClass: "fa-linkedin-in",
    color: "#0077B5",
    isConnected: false
  },
  {
    id: "snapchat",
    name: "Snapchat",
    iconClass: "fa-snapchat",
    color: "#FFFC00",
    isConnected: false
  }
];

export default function ConnectedPlatforms() {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">{t('dashboard.connectedPlatforms')}</h3>
          <Link href="/connect">
            <Button variant="link" className="text-primary">
              {t('dashboard.addMore')}
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg hover:border-neutral-300 transition-all">
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 text-white rounded-full flex items-center justify-center"
                  style={{ backgroundColor: platform.color }}
                >
                  <i className={`fa-brands ${platform.iconClass}`}></i>
                </div>
                <span className="font-medium ml-3">{platform.name}</span>
              </div>
              <div className="flex items-center">
                {platform.isConnected ? (
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                    {t('common.connected')}
                  </span>
                ) : (
                  <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-1 rounded-full">
                    {t('common.connect')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
