import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { getRelativeTimeString } from "@/lib/utils";

// In a real app, this data would come from an API
const activities = [
  {
    id: 1,
    type: "post-published",
    title: "Post published",
    description: "Your post was successfully published to Instagram and Facebook.",
    iconClass: "fa-share-nodes",
    iconBgColor: "bg-primary/10",
    iconColor: "text-primary",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 2,
    type: "engagement-spike",
    title: "Engagement spike",
    description: "Your Twitter post received 143% more engagement than usual.",
    iconClass: "fa-bell",
    iconBgColor: "bg-accent/10",
    iconColor: "text-accent",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  },
  {
    id: 3,
    type: "follower-milestone",
    title: "Follower milestone",
    description: "Congratulations! You've reached 10,000 followers on Instagram.",
    iconClass: "fa-user-plus",
    iconBgColor: "bg-secondary/10",
    iconColor: "text-secondary",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
];

export default function RecentActivities() {
  const { t } = useTranslation();
  
  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">{t('dashboard.recentActivities')}</h3>
          <Button variant="link" className="text-primary">
            {t('common.viewAll')}
          </Button>
        </div>
        
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 rtl:space-x-reverse">
              <div className={`w-10 h-10 ${activity.iconBgColor} rounded-full flex items-center justify-center ${activity.iconColor}`}>
                <i className={`fa-solid ${activity.iconClass}`}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t(`activities.${activity.type}.title`) || activity.title}</h4>
                  <span className="text-xs text-neutral-500">{getRelativeTimeString(activity.timestamp)}</span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">
                  {t(`activities.${activity.type}.description`) || activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
