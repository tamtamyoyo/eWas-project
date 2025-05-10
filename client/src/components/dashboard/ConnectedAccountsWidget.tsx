import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'wouter';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { SocialAccount } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { ExternalLinkIcon, RefreshCcwIcon } from 'lucide-react';
import { 
  FaFacebookF, 
  FaInstagram, 
  FaLinkedinIn, 
  FaSnapchatGhost, 
  FaTwitter 
} from 'react-icons/fa';

const ConnectedAccountsWidget: React.FC = () => {
  const { t } = useTranslation();
  const { data: socialAccounts, isLoading } = useSocialAccounts();

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <FaTwitter className="text-white" />;
      case 'facebook':
        return <FaFacebookF className="text-white" />;
      case 'instagram':
        return <FaInstagram className="text-white" />;
      case 'linkedin':
        return <FaLinkedinIn className="text-white" />;
      case 'snapchat':
        return <FaSnapchatGhost className="text-black" />;
      default:
        return <RefreshCcwIcon className="text-white" />;
    }
  };

  const getPlatformBgColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return 'bg-[#1DA1F2]';
      case 'facebook':
        return 'bg-[#4267B2]';
      case 'instagram':
        return 'bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]';
      case 'linkedin':
        return 'bg-[#0077B5]';
      case 'snapchat':
        return 'bg-[#FFFC00]';
      default:
        return 'bg-gray-400';
    }
  };

  // Function to generate platform cards for both connected and not connected accounts
  const renderAllPlatforms = () => {
    const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'snapchat'];
    const connectedPlatforms = socialAccounts?.map(account => account.platform.toLowerCase()) || [];
    
    return platforms.map(platform => {
      const isConnected = connectedPlatforms.includes(platform);
      const matchingAccount = socialAccounts?.find(
        account => account.platform.toLowerCase() === platform
      );
      
      return (
        <div key={platform} className="flex items-center justify-between p-3 bg-secondary/30 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${getPlatformBgColor(platform)} flex items-center justify-center`}>
              {getPlatformIcon(platform)}
            </div>
            <div className="font-medium capitalize">
              {platform}
            </div>
          </div>
          <Link to="/connect">
            <Button 
              variant={isConnected ? "ghost" : "outline"}
              size="sm"
              className="text-xs"
            >
              {isConnected ? matchingAccount?.username : t('dashboard.connect')}
            </Button>
          </Link>
        </div>
      );
    });
  };

  return (
    <Card className="shadow-md h-full dark:border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-right">
          {t('dashboard.connectedPlatforms')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            </div>
          ) : (
            <div className="space-y-3">
              {renderAllPlatforms()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedAccountsWidget;