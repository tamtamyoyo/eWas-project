import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">
          {t('errors.pageNotFound', 'Page Not Found')}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          {t('errors.pageNotFoundDescription', 'The page you are looking for doesn\'t exist or has been moved.')}
        </p>
        <Link href="/dashboard">
          <Button className="mt-6">
            {t('common.backToDashboard', 'Back to Dashboard')}
          </Button>
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;