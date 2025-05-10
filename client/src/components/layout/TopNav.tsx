import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useLocation } from "wouter";
import { DialogTitle } from "@/components/ui/dialog";

type TopNavProps = {
  onNewPost?: () => void;
};

export default function TopNav({ onNewPost }: TopNavProps) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 h-16 bg-background border-b flex items-center justify-between px-4 md:px-6">
      {/* Mobile menu button and logo for mobile */}
      <div className="flex items-center">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <i className="fa-solid fa-bars"></i>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-72 overflow-y-auto">
            <div className="flex flex-col h-full">
              <DialogTitle className="sr-only">قائمة التنقل</DialogTitle>
              <div className="flex items-center justify-between h-16 border-b px-4">
                <img 
                  src="/ewasl-logo.png" 
                  alt="eWasl.com" 
                  className="h-8 w-auto"
                />
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <i className="fa-solid fa-xmark"></i>
                  </Button>
                </SheetClose>
              </div>
              <MobileSidebar currentPath={location} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Logo on mobile */}
        <div className="md:hidden">
          <img 
            src="/ewasl-logo.png" 
            alt="eWasl.com" 
            className="h-8 w-auto"
          />
        </div>
      </div>
      
      {/* Search */}
      <div className="hidden md:flex items-center flex-1 justify-center">
        <div className="relative max-w-md w-full">
          <Input
            type="text"
            placeholder={t('common.search', 'بحث')}
            className="w-full h-9 bg-muted"
          />
          <i className="fa-solid fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
        </div>
      </div>
      
      {/* Mobile search button */}
      <Button variant="ghost" size="icon" className="md:hidden">
        <i className="fa-solid fa-search"></i>
      </Button>
      
      {/* Quick actions */}
      <div className="flex items-center gap-2">
        {/* Notifications button */}
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hidden sm:flex">
          <i className="fa-solid fa-bell"></i>
        </Button>
        
        {/* New post button - mobile version is icon only */}
        <Button 
          onClick={onNewPost}
          className="md:hidden"
          size="icon"
          variant="default"
        >
          <i className="fa-solid fa-plus"></i>
        </Button>
        
        {/* New post button - desktop version has text */}
        <Button 
          onClick={onNewPost}
          size="sm"
          variant="default"
          className="hidden md:flex gap-2 rounded-md"
        >
          <span>{t('common.newPost', 'منشور جديد')}</span>
          <span className="bg-primary-foreground text-primary w-5 h-5 flex items-center justify-center rounded-full text-xs">+</span>
        </Button>
        
        {/* Theme toggle button */}
        <ThemeToggle />
      </div>
    </header>
  );
}

function MobileSidebar({ currentPath, closeMobileMenu }: { currentPath: string, closeMobileMenu: () => void }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  const handleNavigation = (path: string) => {
    setLocation(path);
    closeMobileMenu();
  };
  
  const MenuItem = ({ path, icon, label }: { path: string, icon: string, label: string }) => (
    <button 
      onClick={() => handleNavigation(path)}
      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium w-full text-left ${
        currentPath === path 
          ? 'bg-accent text-accent-foreground' 
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-md ${
        currentPath === path 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground group-hover:text-foreground'
      }`}>
        <i className={`fa-solid ${icon}`} />
      </span>
      <span>{label}</span>
      {currentPath === path && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </button>
  );
  
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground mb-3 px-2">القائمة الرئيسية</p>
        <MenuItem path="/" icon="fa-chart-simple" label={t('sidebar.dashboard', 'لوحة التحكم')} />
        <MenuItem path="/compose" icon="fa-pen-to-square" label={t('sidebar.compose', 'إنشاء محتوى')} />
        <MenuItem path="/scheduled" icon="fa-calendar" label={t('sidebar.scheduled', 'المنشورات المجدولة')} />
        <MenuItem path="/analytics" icon="fa-chart-line" label={t('sidebar.analytics', 'التحليلات')} />
        <MenuItem path="/connect" icon="fa-link" label={t('sidebar.connect', 'ربط الحسابات')} />
      </div>
      
      <div className="mt-8 px-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 px-2">
          {t('sidebar.settingsHeader', 'الإعدادات')}
        </p>
        <div className="space-y-1">
          <MenuItem path="/settings" icon="fa-user" label={t('sidebar.account', 'الحساب')} />
          <MenuItem path="/subscribe" icon="fa-credit-card" label={t('sidebar.subscription', 'الاشتراك')} />
          <MenuItem path="/help" icon="fa-circle-question" label={t('sidebar.help', 'المساعدة')} />
        </div>
      </div>
    </div>
  );
}
