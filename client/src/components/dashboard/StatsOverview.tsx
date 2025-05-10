import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// Interface for a stat card
interface StatCardProps {
  title: string;
  value: number | string;
  change: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  today?: number;
}

// Individual stat card component 
const StatCard = ({ title, value, change, icon, today }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm text-gray-500">{title}</h3>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            {icon}
          </div>
        </div>
        
        <div className="text-2xl font-bold mb-2">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        
        <div className="flex items-center">
          <div 
            className={`text-xs font-medium px-2 py-1 rounded-full mr-2 ${
              change.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {change.isPositive ? '+' : ''}{change.value}%
          </div>
          
          {today !== undefined && (
            <div className="text-xs text-gray-500">
              {change.isPositive ? '+' : ''}{today} today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface StatsOverviewProps {
  stats: {
    userEngagement: number;
    userEngagementChange: number;
    userEngagementToday: number;
    trafficSources: number;
    trafficSourcesChange: number;
    trafficSourcesToday: number;
    audienceGrowth: number;
    audienceGrowthChange: number;
    audienceGrowthToday: number;
    contentPerformance: number;
    contentPerformanceChange: number;
    contentPerformanceToday: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const { t } = useTranslation();
  
  // Icons for cards
  const userIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
  
  const trafficIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
  
  const audienceIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
  
  const contentIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
  
  // Animation variants for cards
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };
  
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <StatCard 
          title="User Engagement"
          value={stats.userEngagement}
          change={{ value: stats.userEngagementChange, isPositive: stats.userEngagementChange > 0 }}
          icon={userIcon}
          today={stats.userEngagementToday}
        />
      </motion.div>
      
      <motion.div variants={item}>
        <StatCard 
          title="Traffic Sources"
          value={stats.trafficSources}
          change={{ value: stats.trafficSourcesChange, isPositive: stats.trafficSourcesChange > 0 }}
          icon={trafficIcon}
          today={stats.trafficSourcesToday}
        />
      </motion.div>
      
      <motion.div variants={item}>
        <StatCard 
          title="Audience Growth"
          value={stats.audienceGrowth}
          change={{ value: stats.audienceGrowthChange, isPositive: stats.audienceGrowthChange > 0 }}
          icon={audienceIcon}
          today={stats.audienceGrowthToday}
        />
      </motion.div>
      
      <motion.div variants={item}>
        <StatCard 
          title="Content Performance"
          value={stats.contentPerformance}
          change={{ value: stats.contentPerformanceChange, isPositive: stats.contentPerformanceChange > 0 }}
          icon={contentIcon}
          today={stats.contentPerformanceToday}
        />
      </motion.div>
    </motion.div>
  );
}