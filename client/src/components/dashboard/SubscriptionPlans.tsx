import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Users, BarChart2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

// Plan feature type
type PlanFeature = {
  name: string;
  included: boolean;
};

// Plan card props type
type PlanCardProps = {
  title: string;
  description: string;
  price: number;
  interval: "monthly" | "yearly";
  yearlyDiscount?: number;
  popular?: boolean;
  features: PlanFeature[];
  maxAccounts: number;
  maxScheduledPosts: number | null;
  hasAdvancedAnalytics: boolean;
  hasTeamMembers: boolean;
  maxTeamMembers: number | null;
  hasSocialListening: boolean;
  currentPlan?: boolean;
  onSelect: () => void;
  planId: string;
};

function PlanCard({
  title,
  description,
  price,
  interval,
  yearlyDiscount = 0,
  popular = false,
  features,
  maxAccounts,
  maxScheduledPosts,
  hasAdvancedAnalytics,
  hasTeamMembers,
  maxTeamMembers,
  hasSocialListening,
  currentPlan = false,
  onSelect,
  planId
}: PlanCardProps) {
  const { t } = useTranslation();
  
  // Calculate the yearly price with discount
  const yearlyPrice = interval === "yearly" 
    ? Math.round(price * 12 * (1 - yearlyDiscount/100)) / 12 
    : price;
  
  // Pricing display based on interval
  const priceToDisplay = interval === "yearly" ? yearlyPrice : price;
  
  return (
    <Card className={`border ${popular ? 'border-primary shadow-sm' : ''} ${currentPlan ? 'bg-secondary/10' : ''}`}>
      {/* Card header with plan name and description */}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          {popular && (
            <Badge variant="default" className="bg-primary">
              {t('subscription.mostPopular')}
            </Badge>
          )}
          {currentPlan && (
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
              {t('subscription.currentPlan')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {/* Card content with pricing and features */}
      <CardContent className="space-y-6">
        {/* Pricing */}
        <div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">${priceToDisplay}</span>
            <span className="text-muted-foreground ml-1">/{t('subscription.month')}</span>
          </div>
          
          {interval === "yearly" && yearlyDiscount > 0 && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
              {t('subscription.savingYearly', { percent: yearlyDiscount })}
            </div>
          )}
          
          <div className="mt-1 text-xs text-muted-foreground">
            {interval === "yearly" 
              ? t('subscription.billedYearly', { total: Math.round(yearlyPrice * 12) })
              : t('subscription.billedMonthly')}
          </div>
        </div>
        
        {/* Key features */}
        <div className="space-y-4">
          {/* Social accounts */}
          <div className="flex items-start">
            <div className="mt-0.5 mr-3 p-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium">{t('subscription.socialAccounts')}</div>
              <div className="text-sm text-muted-foreground">
                {maxAccounts === -1 
                  ? t('subscription.unlimited') 
                  : t('subscription.upTo', { count: maxAccounts })}
              </div>
            </div>
          </div>
          
          {/* Scheduled posts */}
          <div className="flex items-start">
            <div className="mt-0.5 mr-3 p-1 bg-purple-50 dark:bg-purple-900/30 rounded-full">
              <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-medium">{t('subscription.scheduledPosts')}</div>
              <div className="text-sm text-muted-foreground">
                {maxScheduledPosts === null 
                  ? t('subscription.notIncluded')
                  : maxScheduledPosts === -1 
                    ? t('subscription.unlimited') 
                    : t('subscription.upTo', { count: maxScheduledPosts })}
              </div>
            </div>
          </div>
          
          {/* Advanced analytics */}
          <div className="flex items-start">
            <div className="mt-0.5 mr-3 p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              <BarChart2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-medium">{t('subscription.advancedAnalytics')}</div>
              <div className="text-sm text-muted-foreground">
                {hasAdvancedAnalytics 
                  ? t('subscription.included') 
                  : t('subscription.notIncluded')}
              </div>
            </div>
          </div>
          
          {/* Team members */}
          {hasTeamMembers && (
            <div className="flex items-start">
              <div className="mt-0.5 mr-3 p-1 bg-amber-50 dark:bg-amber-900/30 rounded-full">
                <Users className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <div className="font-medium">{t('subscription.teamMembers')}</div>
                <div className="text-sm text-muted-foreground">
                  {maxTeamMembers === null 
                    ? t('subscription.notIncluded')
                    : maxTeamMembers === -1 
                      ? t('subscription.unlimited') 
                      : t('subscription.upTo', { count: maxTeamMembers })}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Detailed features list */}
        <div className="pt-4 space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              {feature.included ? (
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 shrink-0" />
              ) : (
                <div className="h-4 w-4 border border-muted-foreground/30 rounded-full mr-2 shrink-0" />
              )}
              <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      
      {/* Action button */}
      <CardFooter>
        <Button 
          variant={popular ? "default" : "outline"} 
          className="w-full"
          onClick={onSelect}
          disabled={currentPlan}
        >
          {currentPlan 
            ? "Current Plan" 
            : "Choose Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SubscriptionPlans() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  
  // Free plan features
  const freePlanFeatures = [
    { name: "Basic Post Scheduling", included: true },
    { name: "Basic Analytics", included: true },
    { name: "Multi-Platform Support", included: true },
    { name: "Advanced Analytics", included: false },
    { name: "Team Collaboration", included: false },
    { name: "Content Planner", included: false },
    { name: "AI Assistant", included: false },
    { name: "Priority Support", included: false },
  ];
  
  // Starter plan features
  const starterPlanFeatures = [
    { name: "Basic Post Scheduling", included: true },
    { name: "Basic Analytics", included: true },
    { name: "Multi-Platform Support", included: true },
    { name: "Advanced Analytics", included: true },
    { name: "Team Collaboration", included: false },
    { name: "Content Planner", included: true },
    { name: "AI Assistant", included: false },
    { name: "Priority Support", included: false },
  ];
  
  // Business plan features
  const businessPlanFeatures = [
    { name: "Basic Post Scheduling", included: true },
    { name: "Basic Analytics", included: true },
    { name: "Multi-Platform Support", included: true },
    { name: "Advanced Analytics", included: true },
    { name: "Team Collaboration", included: true },
    { name: "Content Planner", included: true },
    { name: "AI Assistant", included: true },
    { name: "Priority Support", included: false },
  ];
  
  // Agency plan features
  const agencyPlanFeatures = [
    { name: "Basic Post Scheduling", included: true },
    { name: "Basic Analytics", included: true },
    { name: "Multi-Platform Support", included: true },
    { name: "Advanced Analytics", included: true },
    { name: "Team Collaboration", included: true },
    { name: "Content Planner", included: true },
    { name: "AI Assistant", included: true },
    { name: "Priority Support", included: true },
  ];
  
  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setLocation(`/subscribe?plan=${planId}&interval=${billingInterval}`);
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t('subscription.choosePlanTitle')}</h2>
        <p className="text-muted-foreground mt-2">
          {t('subscription.choosePlanDescription')}
        </p>
        
        {/* Billing interval toggle */}
        <div className="mt-6 inline-flex">
          <Tabs 
            value={billingInterval} 
            onValueChange={(v) => setBillingInterval(v as "monthly" | "yearly")}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">{t('subscription.monthly')}</TabsTrigger>
              <TabsTrigger value="yearly">
                {t('subscription.yearly')}
                <span className="ml-1.5 -mr-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-0.5 px-1.5 rounded-full">
                  -20%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Subscription plans grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Free Plan */}
        <PlanCard
          title={t('plans.free')}
          description={t('subscription.freePlanDescription') || "Basic plan with limited features"}
          price={0}
          interval={billingInterval}
          features={freePlanFeatures}
          maxAccounts={2}
          maxScheduledPosts={10}
          hasAdvancedAnalytics={false}
          hasTeamMembers={false}
          maxTeamMembers={null}
          hasSocialListening={false}
          currentPlan={user?.currentPlan === 'free'}
          onSelect={() => handleSelectPlan('free')}
          planId="free"
        />
        
        {/* Starter Plan */}
        <PlanCard
          title={t('plans.starter')}
          description={t('subscription.starterPlanDescription') || "Great for individuals and small businesses"}
          price={9}
          interval={billingInterval}
          yearlyDiscount={20}
          features={starterPlanFeatures}
          maxAccounts={5}
          maxScheduledPosts={50}
          hasAdvancedAnalytics={true}
          hasTeamMembers={false}
          maxTeamMembers={null}
          hasSocialListening={false}
          currentPlan={user?.currentPlan === 'starter'}
          onSelect={() => handleSelectPlan('starter')}
          planId="starter"
        />
        
        {/* Business Plan */}
        <PlanCard
          title={t('plans.business')}
          description={t('subscription.businessPlanDescription') || "Ideal for growing businesses"}
          price={19}
          interval={billingInterval}
          yearlyDiscount={20}
          popular={true}
          features={businessPlanFeatures}
          maxAccounts={10}
          maxScheduledPosts={200}
          hasAdvancedAnalytics={true}
          hasTeamMembers={true}
          maxTeamMembers={3}
          hasSocialListening={true}
          currentPlan={user?.currentPlan === 'business'}
          onSelect={() => handleSelectPlan('business')}
          planId="business"
        />
        
        {/* Agency Plan */}
        <PlanCard
          title={t('plans.agency')}
          description={t('subscription.agencyPlanDescription') || "Best for agencies and large teams"}
          price={29}
          interval={billingInterval}
          yearlyDiscount={20}
          features={agencyPlanFeatures}
          maxAccounts={-1} // Unlimited
          maxScheduledPosts={-1} // Unlimited
          hasAdvancedAnalytics={true}
          hasTeamMembers={true}
          maxTeamMembers={10}
          hasSocialListening={true}
          currentPlan={user?.currentPlan === 'agency'}
          onSelect={() => handleSelectPlan('agency')}
          planId="agency"
        />
      </div>
    </div>
  );
}