import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslation from './locales/ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: arTranslation
      }
    },
    lng: 'ar', // Only Arabic language
    fallbackLng: 'ar', // Arabic as fallback
    interpolation: {
      escapeValue: false // React already safes from XSS
    },
    debug: false, // Disable debug in production
    saveMissing: true, // Save missing translations to help with development
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng} in namespace: ${ns}`);
    }
  });

// Function to set HTML dir attribute and lang for Arabic
export const setDocumentLanguage = () => {
  const htmlElement = document.documentElement;
  htmlElement.setAttribute('dir', 'rtl');
  htmlElement.setAttribute('lang', 'ar');
};

// Set RTL direction and Arabic language
setDocumentLanguage();

export default i18n;
