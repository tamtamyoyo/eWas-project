import React from 'react';
import Navbar from './Navbar';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { i18n } = useTranslation();
  
  return (
    <div className={`min-h-screen flex flex-col bg-background ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="border-t py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} eWasl
        </div>
      </footer>
    </div>
  );
};

export default Layout;