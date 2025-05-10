import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isLoading: true,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "eWasl-theme",
  ...props
}: ThemeProviderProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [initialThemeLoaded, setInitialThemeLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from local storage or user preferences
  useEffect(() => {
    const loadTheme = () => {
      // Try to get theme from localStorage first
      const localTheme = localStorage.getItem(storageKey) as Theme;
      
      // If user is authenticated and has a theme preference, use that
      const typedUser = user as User | null;
      if (typedUser?.theme && isAuthenticated) {
        setTheme(typedUser.theme as Theme);
        // Also update localStorage to match user preferences
        localStorage.setItem(storageKey, typedUser.theme as string);
      } 
      // Otherwise use local storage theme if available
      else if (localTheme) {
        setTheme(localTheme);
      }
      // Fallback to default theme
      else {
        setTheme(defaultTheme);
      }
      
      setInitialThemeLoaded(true);
      setIsLoading(false);
    };

    if (!authLoading) {
      loadTheme();
    }
  }, [user, isAuthenticated, authLoading, defaultTheme, storageKey]);

  // Apply theme to document
  useEffect(() => {
    if (!initialThemeLoaded) return;
    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, initialThemeLoaded]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Update theme in both local storage and user preferences in DB
  const updateTheme = async (newTheme: Theme) => {
    // Update local state first for immediate UI response
    setTheme(newTheme);
    
    // Always save to localStorage
    localStorage.setItem(storageKey, newTheme);
    
    // If user is authenticated, save to database
    const typedUser = user as User | null;
    if (isAuthenticated && typedUser?.id) {
      try {
        await apiRequest('PUT', `/api/users/${typedUser.id}/preferences`, {
          theme: newTheme
        });
        console.log('Theme synchronized with server');
      } catch (error) {
        console.error('Failed to update theme on server:', error);
        // Continue anyway as the theme is saved locally
      }
    }
  };

  const value = {
    theme,
    setTheme: updateTheme,
    isLoading,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
