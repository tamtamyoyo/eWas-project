"use client"

import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const insetVariants = cva(
  "fixed inset-0 z-50 flex flex-col w-full gap-0 border-r bg-background text-muted-foreground",
  {
    variants: {
      variant: {
        inset: "pt-0",
        large: "lg:pt-0",
      },
    },
    defaultVariants: {
      variant: "inset",
    },
  }
)

const mobileVariants = cva(
  "absolute inset-0 z-50 flex min-h-0 flex-col border-r bg-background overflow-auto",
  {
    variants: {
      variant: {
        default: "",
        inset: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SidebarContextValue {
  sidebarWidth: number
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>
  isSidebarExpanded: boolean
  setIsSidebarExpanded: React.Dispatch<React.SetStateAction<boolean>>
  isSidebarOpen: boolean
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  isDesktop: boolean
}

export const SidebarContext = React.createContext<SidebarContextValue>({
  sidebarWidth: 0,
  setSidebarWidth: () => {},
  isSidebarExpanded: true,
  setIsSidebarExpanded: () => {},
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  isDesktop: false,
})

export const useSidebar = () => {
  return React.useContext(SidebarContext)
}

interface SidebarProviderProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const SidebarProvider = ({ children, ...props }: SidebarProviderProps) => {
  const { className, ...rest } = props
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(288)
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState<boolean>(true)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(false)
  const [isDesktop, setIsDesktop] = React.useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  )

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
      setIsSidebarOpen(false)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        sidebarWidth,
        setSidebarWidth,
        isSidebarExpanded,
        setIsSidebarExpanded,
        isSidebarOpen,
        setIsSidebarOpen,
        isDesktop,
      }}
    >
      <div className={cn("relative h-full min-h-screen", className)} {...rest}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

interface SidebarInsetProps {
  children: React.ReactNode
  className?: string
}

export const SidebarInset = ({ children, className }: SidebarInsetProps) => {
  const { isDesktop, isSidebarExpanded, sidebarWidth } = useSidebar()

  const activeWidth = React.useMemo(() => {
    if (!isDesktop) return 0
    return isSidebarExpanded ? sidebarWidth : 0 + 64
  }, [isDesktop, isSidebarExpanded, sidebarWidth])

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-1 flex-col overflow-hidden",
        isDesktop ? "rtl:mr-64 ltr:ml-64" : "",
        className
      )}
      style={
        {
          "--sidebar-width": `${activeWidth}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
  className?: string
  collapsible?: boolean | "offcanvas"
  defaultCollapsed?: boolean
  variant?: "inset" | "large"
}

export const Sidebar = ({
  children,
  className,
  collapsible = false,
  defaultCollapsed = false,
  variant = "inset",
  ...props
}: SidebarProps) => {
  const {
    isSidebarExpanded,
    setIsSidebarExpanded,
    isSidebarOpen,
    setIsSidebarOpen,
    isDesktop,
  } = useSidebar()

  React.useEffect(() => {
    if (defaultCollapsed) {
      setIsSidebarExpanded(false)
    }
  }, [defaultCollapsed, setIsSidebarExpanded])

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false)
      }
    }

    if (isSidebarOpen) {
      document.addEventListener("keydown", handleEsc)
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
    }
  }, [isSidebarOpen, setIsSidebarOpen])

  const handleOverlayClick = () => {
    setIsSidebarOpen(false)
  }

  return (
    <>
      {!isDesktop && isSidebarOpen && (
        <div
          className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={handleOverlayClick}
        />
      )}
      <aside
        className={cn(
          isDesktop ? insetVariants({ variant, className }) : mobileVariants({ className }),
          isDesktop
            ? collapsible === "offcanvas"
              ? isSidebarExpanded
                ? "ltr:translate-x-0 rtl:-translate-x-0"
                : "ltr:-translate-x-full rtl:translate-x-full"
              : ""
            : isSidebarOpen
            ? "ltr:translate-x-0 rtl:-translate-x-0"
            : "ltr:-translate-x-full rtl:translate-x-full",
          isDesktop ? "transition-all duration-300 ease-in-out" : "transition-transform duration-300 ease-in-out",
          "overflow-y-auto bg-background text-foreground dark:bg-gray-950 dark:text-gray-50"
        )}
        {...props}
      >
        {children}
      </aside>
    </>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const SidebarHeader = ({
  children,
  className,
  ...props
}: SidebarHeaderProps) => {
  return (
    <div
      className={cn(
        "flex h-16 items-center px-4 py-4 lg:h-16 lg:px-4 lg:py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const SidebarContent = ({
  children,
  className,
  ...props
}: SidebarContentProps) => {
  return (
    <div
      className={cn("flex-1 overflow-auto px-4 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const SidebarFooter = ({
  children,
  className,
  ...props
}: SidebarFooterProps) => {
  return (
    <div
      className={cn("px-4 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode
  className?: string
}

export const SidebarMenu = ({
  children,
  className,
  ...props
}: SidebarMenuProps) => {
  return (
    <ul className={cn("space-y-2", className)} {...props}>
      {children}
    </ul>
  )
}

interface SidebarMenuItemProps
  extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
  className?: string
}

export const SidebarMenuItem = ({
  children,
  className,
  ...props
}: SidebarMenuItemProps) => {
  return (
    <li className={cn("", className)} {...props}>
      {children}
    </li>
  )
}

export interface SidebarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  className?: string
  variant?: "default" | "ghost" | "ghost-simple"
  size?: "default" | "sm"
}

const sidebarButtonVariants = cva(
  "inline-flex w-full items-center justify-start gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary hover:bg-primary/20 aria-selected:bg-primary/20 aria-selected:text-primary aria-selected:font-semibold",
        ghost:
          "hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent/50 aria-selected:text-accent-foreground aria-selected:font-semibold",
        "ghost-simple":
          "hover:bg-accent hover:text-accent-foreground aria-selected:text-accent-foreground aria-selected:font-semibold data-[state=open]:font-semibold",
      },
      size: {
        default: "min-h-10 px-3 py-2 text-sm",
        sm: "min-h-9 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarButtonProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <div className={cn(sidebarButtonVariants({ variant, size, className }))}>
          {props.children}
        </div>
      )
    }
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(sidebarButtonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

SidebarMenuButton.displayName = "SidebarMenuButton"