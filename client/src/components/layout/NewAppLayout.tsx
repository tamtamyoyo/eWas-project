import React, { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import NewAppSidebar from "./NewAppSidebar"
import NewSiteHeader from "./NewSiteHeader"
import { 
  SidebarInset, 
  SidebarProvider 
} from "@/components/ui/sidebar/sidebar"

type NewAppLayoutProps = {
  children: React.ReactNode
}

export default function NewAppLayout({ children }: NewAppLayoutProps) {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()
  const { i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login")
    }
  }, [user, loading, setLocation])
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }
  
  const handleNewPost = () => {
    setLocation("/compose")
  }
  
  return (
    <SidebarProvider
      className={cn(
        "min-h-screen",
        isRtl ? "rtl" : "ltr"
      )}
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      <NewAppSidebar variant="inset" />
      <SidebarInset>
        <NewSiteHeader onNewPost={handleNewPost} />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}