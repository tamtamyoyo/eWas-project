import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/ui/theme-provider';
import { User } from '@shared/schema';

type ThemeType = 'light' | 'dark' | 'system';
type LanguageType = 'ar' | 'en';

interface UserPreferences {
  theme: ThemeType;
  language: LanguageType;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  updateTheme: (theme: ThemeType) => Promise<void>;
  updateLanguage: (language: LanguageType) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const { theme: globalTheme, setTheme: setGlobalTheme, isLoading: themeLoading } = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  
  // Ensure proper typing for user
  const typedUser = user as User | null;
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: (globalTheme as ThemeType), // Use global theme from the provider
    language: (typedUser?.language as LanguageType) || 'ar'
  });

  // Initialize preferences from user data and global theme
  useEffect(() => {
    if (typedUser) {
      setPreferences(prev => ({
        ...prev,
        theme: (globalTheme as ThemeType), // Global theme is already synced with server
        language: (typedUser.language as LanguageType) || 'ar'
      }));
      setLoading(false);
    }
  }, [typedUser, globalTheme]);

  // Update theme preference - now integrated with global theme provider
  const updateTheme = async (theme: ThemeType): Promise<void> => {
    try {
      setLoading(true);
      
      // This will update the theme in both localStorage and the database if user is authenticated
      await setGlobalTheme(theme);
      
      // Update local state
      setPreferences(prev => ({ ...prev, theme }));
      
      toast({
        title: 'Theme updated',
        description: `Theme preference has been updated to ${theme}`,
      });
    } catch (error) {
      console.error('Failed to update theme:', error);
      toast({
        title: 'Failed to update theme',
        description: 'An error occurred while updating your theme preference',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update language preference
  const updateLanguage = async (language: LanguageType): Promise<void> => {
    if (!typedUser) return;
    
    try {
      setLoading(true);
      
      await apiRequest('PUT', `/api/users/${typedUser.id}/preferences`, {
        language
      });
      
      setPreferences(prev => ({ ...prev, language }));
      
      // Change i18n language instead of reloading
      i18n.changeLanguage(language);
      
      toast({
        title: 'Language updated',
        description: `Language preference has been updated to ${language === 'ar' ? 'Arabic' : 'English'}`,
      });
    } catch (error) {
      console.error('Failed to update language:', error);
      toast({
        title: 'Failed to update language',
        description: 'An error occurred while updating your language preference',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update multiple preferences at once - now with theme provider integration
  const updatePreferences = async (prefs: Partial<UserPreferences>): Promise<void> => {
    if (!typedUser) return;
    
    try {
      setLoading(true);
      
      // Handle theme change through global theme provider if provided
      if (prefs.theme) {
        // This will update theme in both localStorage and user database
        await setGlobalTheme(prefs.theme);
      }
      
      // For language and any other preferences, use the API
      const prefsToUpdate = { ...prefs };
      
      // Remove theme from API request since it's already handled by the theme provider
      if (prefsToUpdate.theme) {
        delete prefsToUpdate.theme;
      }
      
      // Only make the API call if there are other preferences to update
      if (Object.keys(prefsToUpdate).length > 0) {
        await apiRequest('PUT', `/api/users/${typedUser.id}/preferences`, prefsToUpdate);
      }
      
      // Update local state
      setPreferences(prev => ({ ...prev, ...prefs }));
      
      // Update language via i18n if it was changed
      if (prefs.language && prefs.language !== preferences.language) {
        i18n.changeLanguage(prefs.language);
      }
      
      toast({
        title: 'Preferences updated',
        description: 'Your preferences have been updated successfully',
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: 'Failed to update preferences',
        description: 'An error occurred while updating your preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    preferences,
    loading: loading || themeLoading, // Include theme loading state
    updateTheme,
    updateLanguage,
    updatePreferences
  };
};