"use client"

import * as React from "react"
import { useLocation } from "wouter"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar/sidebar"
import { 
  FaChartPie, 
  FaPenToSquare, 
  FaCalendar, 
  FaChartLine, 
  FaLink, 
  FaUser, 
  FaCreditCard, 
  FaCircleQuestion,
  FaRightFromBracket
} from "react-icons/fa6"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NewAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [location] = useLocation()
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const mainNavItems = [
    {
      title: t('sidebar.dashboard', 'لوحة التحكم'),
      href: "/",
      icon: <FaChartPie size={18} />
    },
    {
      title: t('sidebar.compose', 'إنشاء محتوى'),
      href: "/compose",
      icon: <FaPenToSquare size={18} />
    },
    {
      title: t('sidebar.scheduled', 'المنشورات المجدولة'),
      href: "/scheduled",
      icon: <FaCalendar size={18} />
    },
    {
      title: t('sidebar.analytics', 'التحليلات'),
      href: "/analytics",
      icon: <FaChartLine size={18} />
    },
    {
      title: t('sidebar.connect', 'ربط الحسابات'),
      href: "/connect",
      icon: <FaLink size={18} />
    }
  ]

  const settingsNavItems = [
    {
      title: t('sidebar.account', 'الحساب'),
      href: "/settings",
      icon: <FaUser size={18} />
    },
    {
      title: t('sidebar.subscription', 'الاشتراك'),
      href: "/subscribe",
      icon: <FaCreditCard size={18} />
    },
    {
      title: t('sidebar.help', 'المساعدة'),
      href: "/help",
      icon: <FaCircleQuestion size={18} />
    }
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5 flex items-center gap-2"
              onClick={() => window.location.href = '/'}
            >
              <img src="/ewasl-logo.png" alt="eWasl Logo" className="h-8 w-auto" />
              <span className="text-xl font-semibold">eWasl</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-6">
        {/* User profile summary */}
        {user && (
          <div className="mb-6 p-4 bg-accent/30 rounded-lg">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user.fullName ? user.fullName.charAt(0) : (user.username ? user.username.charAt(0) : 'U')}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{user.fullName || user.username || t('common.user')}</h3>
                <p className="text-xs text-muted-foreground">{t(`plans.${user.currentPlan || 'free'}`)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="mb-6">
          <h4 className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('sidebar.mainNavigation', 'القائمة الرئيسية')}
          </h4>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  variant="ghost"
                  aria-selected={location === item.href}
                  className={cn(
                    location === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <a href={item.href}>
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        {/* Settings Navigation */}
        <div>
          <h4 className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('sidebar.settingsHeader', 'الإعدادات')}
          </h4>
          <SidebarMenu>
            {settingsNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  variant="ghost"
                  aria-selected={location === item.href}
                  className={cn(
                    location === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <a href={item.href}>
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <FaRightFromBracket size={18} />
          <span>{t('sidebar.logout', 'تسجيل الخروج')}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export default NewAppSidebar