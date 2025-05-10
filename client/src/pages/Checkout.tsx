import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements, AddressElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, CreditCard, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm() {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setPaymentMessage(error.message || t('checkout.defaultError'));
        toast({
          title: t('checkout.paymentFailed'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPaymentSuccess(true);
        setPaymentMessage(t('checkout.paymentSuccessful'));
        toast({
          title: t('checkout.paymentSuccessful'),
          description: t('checkout.thankYou'),
        });
        
        // Redirect to dashboard after successful payment
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setPaymentMessage(err.message || t('checkout.defaultError'));
      toast({
        title: t('checkout.paymentFailed'),
        description: err.message,
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 mb-4">
          <Check size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('checkout.paymentSuccessful')}</h2>
        <p className="text-muted-foreground mb-6">{t('checkout.redirecting')}</p>
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">{t('checkout.billingDetails')}</h3>
          <AddressElement 
            options={{
              mode: 'billing',
            }} 
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">{t('checkout.paymentMethod')}</h3>
          <PaymentElement />
        </div>
      </div>
      
      {paymentMessage && (
        <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md text-sm">
          {paymentMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('checkout.processing')}
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {t('checkout.payNow')}
          </>
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Get query parameters from the URL
  const [location] = useLocation();
  const query = Object.fromEntries(new URLSearchParams(location.split('?')[1] || ''));
  const planId = query.plan;
  const amount = query.amount ? parseInt(query.amount, 10) : 0;
  const planName = query.name || 'Subscription';
  
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!planId || !amount) {
      setError(t('checkout.missingParams'));
      setLoading(false);
      return;
    }

    const fetchPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount,
          planId: parseInt(planId, 10),
          metadata: {
            planName,
          },
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || t('checkout.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPaymentIntent();
    }
  }, [planId, amount, planName, user, t]);

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('checkout.backToDashboard')}
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.checkoutTitle')}</CardTitle>
            <CardDescription>
              {t('checkout.completePurchase')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-1">{t('checkout.orderSummary')}</h3>
              <div className="flex justify-between py-2 border-b border-border">
                <span>{planName}</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(amount / 100)}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>{t('checkout.total')}</span>
                <span>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(amount / 100)}
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={() => setLocation('/dashboard')}>
                  {t('checkout.backToDashboard')}
                </Button>
              </div>
            ) : (
              clientSecret && (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    },
                  }}
                >
                  <CheckoutForm />
                </Elements>
              )
            )}
          </CardContent>
          <CardFooter className="border-t flex justify-center text-xs text-muted-foreground">
            <div className="text-center max-w-xs">
              {t('checkout.securePayment')}
            </div>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}