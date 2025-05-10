import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  const handleNewPost = () => {
    setLocation("/compose");
    setMobileMenuOpen(false);
  };
  
  return (
    <div className={cn(
      "flex h-screen overflow-hidden",
      i18n.language === 'ar' ? 'rtl' : 'ltr'
    )}>
      {/* Desktop sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <TopNav onNewPost={handleNewPost} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
        
        {/* Mobile bottom navigation */}
        {isMobile && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-neutral-100 flex items-center justify-around px-2 z-50">
            <MobileNavButton 
              icon="fa-home" 
              active={location.pathname === "/"} 
              onClick={() => setLocation("/")}
              label="Home"
            />
            <MobileNavButton 
              icon="fa-pen-to-square" 
              active={location.pathname === "/compose"} 
              onClick={() => setLocation("/compose")}
              label="Compose"
            />
            <MobileNavButton 
              icon="fa-calendar" 
              active={location.pathname === "/scheduled"} 
              onClick={() => setLocation("/scheduled")}
              label="Scheduled"
            />
            <MobileNavButton 
              icon="fa-chart-line" 
              active={location.pathname === "/analytics"} 
              onClick={() => setLocation("/analytics")}
              label="Analytics"
            />
            <MobileNavButton 
              icon="fa-cog" 
              active={location.pathname === "/settings"} 
              onClick={() => setLocation("/settings")}
              label="Settings"
            />
          </div>
        )}
      </main>
    </div>
  );
}

function MobileNavButton({ 
  icon, 
  active, 
  onClick, 
  label 
}: { 
  icon: string; 
  active: boolean; 
  onClick: () => void;
  label: string;
}) {
  return (
    <button 
      className={cn(
        "flex flex-col items-center justify-center px-2 py-1 rounded-md transition-colors",
        active 
          ? "text-primary" 
          : "text-neutral-500 hover:text-neutral-700"
      )}
      onClick={onClick}
    >
      <i className={`fa-solid ${icon} text-lg mb-1`} />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}
