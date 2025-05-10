import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";

export default function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { preferences, updateLanguage } = useUserPreferences();
  
  // Get current language from preferences
  const currentLanguage = preferences.language;

  // Toggle between Arabic and English
  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    
    if (user) {
      // If user is authenticated, save preference to server
      updateLanguage(newLanguage);
    } else {
      // If not authenticated, just update i18n directly
      i18n.changeLanguage(newLanguage);
      
      // Also update document direction
      document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLanguage;
      
      // Save to localStorage for non-authenticated users
      localStorage.setItem('language', newLanguage);
    }
  };

  return (
    <Button 
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      title={t('language.toggle')}
      className="rounded-md text-sm font-medium"
    >
      {currentLanguage === 'ar' ? 'English' : 'العربية'}
    </Button>
  );
}