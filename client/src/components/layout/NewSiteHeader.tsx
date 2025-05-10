"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { useSidebar } from "@/components/ui/sidebar/sidebar"
import { FaBars, FaXmark, FaBell, FaSun, FaMoon } from "react-icons/fa6"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Temporary theme implementation until useTheme hook is properly set up
const useTheme = () => { 
  return { 
    theme: 'light', 
    setTheme: (theme: string) => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  };
}
import { cn } from "@/lib/utils"

interface SiteHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onNewPost?: () => void
}

export function NewSiteHeader({ onNewPost, className, ...props }: SiteHeaderProps) {
  const { t, i18n } = useTranslation()
  const { isSidebarOpen, setIsSidebarOpen, isDesktop } = useSidebar()
  const { theme, setTheme } = useTheme()
  const isRtl = i18n.language === 'ar'

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6",
        className
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        className="ltr:mr-2 rtl:ml-2 h-9 w-9 lg:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <FaXmark className="h-5 w-5" />
        ) : (
          <FaBars className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle Menu</span>
      </Button>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex gap-2 rounded-full"
          onClick={onNewPost}
        >
          <span>{t('header.createNew', 'إنشاء منشور جديد')}</span>
          <span className="bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center rounded-full text-xs">+</span>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground h-9 w-9"
          aria-label="Notifications"
        >
          <FaBell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FaSun className="h-5 w-5" />
              ) : (
                <FaMoon className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRtl ? "start" : "end"}>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              {t('header.lightMode', 'الوضع النهاري')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              {t('header.darkMode', 'الوضع الليلي')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              {t('header.systemMode', 'الوضع التلقائي')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default NewSiteHeader