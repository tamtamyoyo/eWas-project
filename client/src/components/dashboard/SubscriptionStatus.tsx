import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Calendar, Settings, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils";

type SubscriptionStatusProps = {
  minimized?: boolean;
  onUpgrade?: () => void;
};

// Extended User type with proper typing for the currentPlan field
type UserWithPlan = {
  id: number;
  username: string;
  email: string;
  currentPlan?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  [key: string]: any;
};

export default function SubscriptionStatus({ minimized = false, onUpgrade }: SubscriptionStatusProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const user = authUser as UserWithPlan;
  const [, setLocation] = useLocation();

  // For demo purposes, set an expiration date
  const [expiryDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  });
  
  // Get the readable plan name with proper capitalization
  const getPlanName = (planCode: string | null | undefined) => {
    if (!planCode) return t('subscription.freePlan');
    
    if (planCode === 'free') return t('subscription.freePlan');
    if (planCode === 'starter') return t('subscription.starterPlan');
    if (planCode === 'business') return t('subscription.businessPlan');
    if (planCode === 'agency') return t('subscription.agencyPlan');
    
    return planCode.charAt(0).toUpperCase() + planCode.slice(1);
  };
  
  // Handle upgrade button click
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation('/subscribe');
    }
  };
  
  // Handle manage subscription click
  const handleManageSubscription = () => {
    setLocation('/settings?tab=subscription');
  };
  
  // If no user or minimized mode with free plan, return simplified view
  if (!user || (minimized && (!user.currentPlan || user.currentPlan === 'free'))) {
    return (
      <Card className={minimized ? "bg-muted/40" : ""}>
        <CardHeader className={minimized ? "p-4" : undefined}>
          <CardTitle className={minimized ? "text-base" : undefined}>
            {t('subscription.status')}
          </CardTitle>
          {!minimized && (
            <CardDescription>
              {t('subscription.currentPlanDetails')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={minimized ? "p-4 pt-0" : undefined}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t('subscription.freePlan')}</span>
            </div>
            <Button 
              size={minimized ? "sm" : "default"} 
              onClick={handleUpgrade}
              className={minimized ? "px-2.5" : undefined}
            >
              {t('subscription.upgrade')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Return detailed view for paid plans
  return (
    <Card className={minimized ? "bg-muted/40" : ""}>
      <CardHeader className={minimized ? "p-4" : undefined}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={minimized ? "text-base" : undefined}>
              {t('subscription.status')}
            </CardTitle>
            {!minimized && (
              <CardDescription>
                {t('subscription.currentPlanDetails')}
              </CardDescription>
            )}
          </div>
          
          {!minimized && user.currentPlan && user.currentPlan !== 'free' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
              {t('subscription.active')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={minimized ? "p-4 pt-0" : undefined}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-full ${
                user.currentPlan === 'free' ? 'bg-neutral-100 dark:bg-neutral-800' :
                user.currentPlan === 'starter' ? 'bg-blue-50 dark:bg-blue-900/30' :
                user.currentPlan === 'business' ? 'bg-purple-50 dark:bg-purple-900/30' :
                'bg-indigo-50 dark:bg-indigo-900/30'
              }`}>
                <CreditCard className={`h-5 w-5 ${
                  user.currentPlan === 'free' ? 'text-neutral-500 dark:text-neutral-400' :
                  user.currentPlan === 'starter' ? 'text-blue-500 dark:text-blue-400' :
                  user.currentPlan === 'business' ? 'text-purple-500 dark:text-purple-400' :
                  'text-indigo-500 dark:text-indigo-400'
                }`} />
              </div>
              <div>
                <div className="font-medium">
                  {getPlanName(user.currentPlan)}
                </div>
                {!minimized && user.currentPlan && user.currentPlan !== 'free' && (
                  <div className="text-sm text-muted-foreground">
                    {t('subscription.renews')} {formatDate(expiryDate)}
                  </div>
                )}
              </div>
            </div>
            
            {user.currentPlan === 'free' ? (
              <Button 
                size={minimized ? "sm" : "default"} 
                onClick={handleUpgrade}
                className={minimized ? "px-2.5" : undefined}
              >
                {t('subscription.upgrade')}
              </Button>
            ) : minimized ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleManageSubscription}
                className="p-0 h-8 w-8"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
          
          {!minimized && user.currentPlan && user.currentPlan !== 'free' && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">{t('subscription.billingDate')}</p>
                  <p className="text-muted-foreground">{formatDate(expiryDate)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">{t('subscription.paymentMethod')}</p>
                  <p className="text-muted-foreground">•••• 4242</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {!minimized && user.currentPlan && user.currentPlan !== 'free' && (
        <CardFooter className="bg-muted/50 px-6 py-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:flex-1"
              onClick={handleUpgrade}
            >
              {t('subscription.changePlan')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:flex-1"
              onClick={handleManageSubscription}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t('subscription.manageSubscription')}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}