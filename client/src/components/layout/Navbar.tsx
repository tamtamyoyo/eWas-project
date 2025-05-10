import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '@/components/theme/ThemeToggle';
import LanguageToggle from '@/components/theme/LanguageToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="border-b shadow-sm bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Link href="/" className="flex items-center">
            <img src="/ewasl-logo.png" alt="eWasl.com" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Navigation Links - Show on larger screens */}
        <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-primary">
            {t('common.dashboard')}
          </Link>
          <Link href="/analytics" className="text-sm font-medium text-gray-600 hover:text-primary">
            {t('common.analytics')}
          </Link>
          <Link href="/compose" className="text-sm font-medium text-gray-600 hover:text-primary">
            {t('common.compose')}
          </Link>
          <Link href="/scheduled" className="text-sm font-medium text-gray-600 hover:text-primary">
            {t('common.scheduled')}
          </Link>
        </nav>

        {/* Right side items */}
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          {/* Language Switcher */}
          <LanguageToggle />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Login/Register or User Menu */}
          {user ? (
            <Link href="/dashboard">
              <Button variant="default" size="sm">
                {t('common.dashboard')}
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                {t('common.login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;