import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'wouter';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { Post } from '@shared/schema';
import { 
  CalendarIcon, 
  ExternalLinkIcon, 
  ImageIcon, 
  MessageSquareIcon,
  PencilIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const ScheduledPostsWidget: React.FC = () => {
  const { t } = useTranslation();
  const { data: scheduledPosts, isLoading } = useScheduledPosts();

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { 
        addSuffix: true,
        locale: ar
      });
    } catch (error) {
      return typeof date === 'string' ? date : '';
    }
  };

  return (
    <Card className="shadow-md h-full dark:border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <div>{t('dashboard.scheduledPosts')}</div>
          <div className="text-base font-normal">
            {!isLoading && 
              <div>
                {t('dashboard.posts')}: <span className="font-bold">{scheduledPosts?.length || 0}</span>
              </div>
            }
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
            </div>
          ) : scheduledPosts && scheduledPosts.length > 0 ? (
            <div className="space-y-3">
              {scheduledPosts.slice(0, 3).map((post: Post) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-secondary/30 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {post.mediaUrls && post.mediaUrls.length > 0 ? (
                      <div className="w-12 h-12 rounded bg-secondary dark:bg-slate-700 overflow-hidden">
                        <img 
                          src={post.mediaUrls[0]} 
                          alt="Post media" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-secondary dark:bg-slate-700 flex items-center justify-center">
                        <MessageSquareIcon className="text-muted-foreground" size={20} />
                      </div>
                    )}
                    <div className="max-w-[150px]">
                      <div className="font-medium truncate">{post.content.substring(0, 30)}{post.content.length > 30 ? '...' : ''}</div>
                      <div className="text-xs flex items-center text-muted-foreground dark:text-slate-400 gap-1">
                        <CalendarIcon size={12} />
                        {formatDate(post.scheduledAt)}
                      </div>
                    </div>
                  </div>
                  <Link to={`/scheduled/edit/${post.id}`}>
                    <Button variant="ghost" size="icon">
                      <PencilIcon size={16} />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">{t('dashboard.noScheduledPosts')}</p>
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-center">
          <Link to="/scheduled">
            <Button variant="outline">
              {scheduledPosts?.length ? t('dashboard.viewSchedule') : t('dashboard.createFirstPost')} 
              <ExternalLinkIcon size={16} className="mr-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledPostsWidget;