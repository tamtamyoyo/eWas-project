import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const { user, refetchUser } = useAuth();

  // Set initial language based on user preference or browser
  useEffect(() => {
    if (user && user.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user, i18n]);

  // Function to change language
  const changeLanguage = async (language: string) => {
    // Change the UI language
    i18n.changeLanguage(language);

    // Update HTML direction attribute
    const htmlElement = document.documentElement;
    if (language === 'ar') {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', 'ar');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', 'en');
    }

    // Save language preference to user profile if logged in
    if (user && user.id) {
      try {
        await apiRequest("PUT", `/api/users/${user.id}`, {
          language
        });
        refetchUser();
      } catch (error) {
        console.error("Failed to save language preference:", error);
      }
    }

    // Save to localStorage as fallback
    localStorage.setItem('socialPulseLanguage', language);
  };

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isRtl: i18n.language === 'ar',
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr'
  };
};
