import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// Post insights data structure
interface PlatformInsight {
  platform: 'instagram' | 'facebook' | 'twitter';
  posts: number;
  audience: number;
  totalLikes: number;
  followers: number;
}

interface PostInsightsProps {
  dateRange?: string;
  insights: PlatformInsight[];
  onViewDetail?: (platform: string) => void;
}

export default function PostInsights({ 
  dateRange = "From 5 Nov — 5 Dec 2024",
  insights = [],
  onViewDetail
}: PostInsightsProps) {
  const { t } = useTranslation();
  
  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'instagram':
        return (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png" alt="Instagram logo" className="w-full h-full object-cover" />
          </div>
        );
      case 'twitter':
        return (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" alt="Twitter logo" className="w-full h-full object-cover" />
          </div>
        );
      case 'facebook':
        return (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/800px-2021_Facebook_icon.svg.png" alt="Facebook logo" className="w-full h-full object-cover" />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">{t('dashboard.postInsights')}</h2>
          <Select defaultValue={dateRange}>
            <SelectTrigger className="w-[240px] text-sm border border-neutral-100 rounded-lg">
              <SelectValue placeholder={dateRange} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={dateRange}>{dateRange}</SelectItem>
              <SelectItem value="From 5 Oct — 5 Nov 2024">From 5 Oct — 5 Nov 2024</SelectItem>
              <SelectItem value="From 5 Sep — 5 Oct 2024">From 5 Sep — 5 Oct 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Platform insights */}
        <div className="space-y-6">
          {insights.map((insight) => (
            <motion.div 
              key={insight.platform}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  {getPlatformIcon(insight.platform)}
                  <div className="ml-3">
                    <div className="font-medium">{insight.platform.charAt(0).toUpperCase() + insight.platform.slice(1)}</div>
                    <div className="text-sm text-gray-500">{insight.posts} Posts</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs px-3 h-7 text-purple-600"
                  onClick={() => onViewDetail && onViewDetail(insight.platform)}
                >
                  See detail
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Audience</div>
                  <div className="font-bold text-lg">{insight.audience.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Likes</div>
                  <div className="font-bold text-lg">{insight.totalLikes.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Followers</div>
                  <div className="font-bold text-lg flex items-center">
                    +{insight.followers.toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}