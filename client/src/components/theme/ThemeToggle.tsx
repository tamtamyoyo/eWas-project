import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ui/theme-provider";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme, isLoading } = useTheme();

  // Function to toggle between light and dark
  const toggleTheme = () => {
    const nextTheme = theme === "light" 
      ? "dark" 
      : theme === "dark" 
        ? "system" 
        : "light";
        
    // Use the global theme provider which handles both localStorage and server sync
    setTheme(nextTheme);
  };

  // Icon variants
  const variants = {
    light: { rotate: 0 },
    dark: { rotate: 180 },
    system: { rotate: 90 }
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      title={t('theme.toggle')}
      className="rounded-full"
    >
      <motion.div
        animate={theme}
        variants={variants}
        transition={{ duration: 0.3 }}
        className={`w-5 h-5 flex items-center justify-center`}
      >
        {theme === 'light' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {theme === 'dark' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
        {theme === 'system' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
      </motion.div>
    </Button>
  );
}