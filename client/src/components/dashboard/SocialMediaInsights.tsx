import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// Platform stats type
interface PlatformStats {
  platform: 'facebook' | 'twitter' | 'instagram';
  posts: number;
  audience: number;
  totalLikes: number;
  followers: number;
  growth: number;
}

interface SocialMediaInsightsProps {
  title?: string;
  platforms: PlatformStats[];
  dateRange?: string;
  totalAudience?: number;
  audienceGrowth?: number;
  onViewDetail?: (platform: string) => void;
}

export default function SocialMediaInsights({ 
  title = "Social Media Audience", 
  platforms = [],
  dateRange = "5 Nov — 5 Dec 2024",
  totalAudience = 20453,
  audienceGrowth = 14,
  onViewDetail 
}: SocialMediaInsightsProps) {
  const { t } = useTranslation();
  
  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'facebook':
        return (
          <div className="w-6 h-6 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="#1877f2">
              <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
            </svg>
          </div>
        );
      case 'twitter':
        return (
          <div className="w-6 h-6 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#1da1f2">
              <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/>
            </svg>
          </div>
        );
      case 'instagram':
        return (
          <div className="w-6 h-6 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#e1306c">
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Function to format growth percentage with color
  const formatGrowth = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={isPositive ? "text-green-500" : "text-red-500"}>
        {isPositive ? "+" : ""}{value.toFixed(1)}%
      </span>
    );
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-medium mb-4">{title}</h2>
        
        <div className="space-y-6">
          {/* Total audience summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-2 text-sm text-gray-500">Total Audience</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalAudience.toLocaleString()}</div>
              <div className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"/>
                </svg>
                {audienceGrowth}%
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="flex">
                <div className="bg-blue-600 h-full" style={{ width: '50%' }}></div>
                <div className="bg-blue-400 h-full" style={{ width: '20%' }}></div>
                <div className="bg-green-500 h-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                <span>Facebook</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span>Twitter</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Instagram</span>
              </div>
            </div>
          </div>
          
          {/* Platform stats */}
          <div className="space-y-4">
            {platforms.map((platform) => (
              <motion.div 
                key={platform.platform}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    {getPlatformIcon(platform.platform)}
                    <span className="font-medium">
                      {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {platform.posts} Posts
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs px-3 h-7 text-purple-600"
                    onClick={() => onViewDetail && onViewDetail(platform.platform)}
                  >
                    See detail
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Audience</div>
                    <div className="font-bold">{platform.audience.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Likes</div>
                    <div className="font-bold">{platform.totalLikes.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Followers</div>
                    <div className="font-bold flex items-center justify-center">
                      +{platform.followers.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}