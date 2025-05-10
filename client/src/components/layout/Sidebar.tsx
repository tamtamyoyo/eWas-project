import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  FaChartPie, 
  FaPenToSquare, 
  FaCalendar, 
  FaChartLine, 
  FaLink, 
  FaUser, 
  FaCreditCard, 
  FaCircleQuestion
} from "react-icons/fa6";

type SidebarItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
};

function SidebarItem({ href, icon, children, active, onClick }: SidebarItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <motion.div
        className={cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent cursor-pointer",
          active 
            ? "bg-accent text-accent-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <span className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md",
          active 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground group-hover:text-foreground"
        )}>
          {icon}
        </span>
        <span>{children}</span>
        {active && (
          <motion.div
            className="mr-auto h-1.5 w-1.5 rounded-full bg-primary"
            layoutId="activeIndicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

// Define animation variants for menu items
const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1 
    } 
  }
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Return null if on mobile as we use the MobileSidebar component from TopNav
  if (isMobile) {
    return null;
  }

  return (
    <motion.aside 
      className="hidden md:flex md:flex-col w-[280px] bg-background border-r h-full overflow-hidden"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
    >
      {/* Logo Header */}
      <motion.div 
        className="flex items-center h-16 border-b px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <motion.div
          className="flex items-center gap-2"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <img src="/ewasl-logo.png" alt="eWasl.com" className="h-8 w-auto" />
          <span className="font-bold text-2xl">eWasl</span>
        </motion.div>
      </motion.div>
      
      {/* User profile summary */}
      <AnimatePresence>
        {user && (
          <motion.div 
            className="p-4 border-b"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.01 }}
            >
              <motion.div 
                className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary font-medium"
                whileHover={{ scale: 1.05 }}
              >
                {user.fullName ? user.fullName.charAt(0) : (user.username ? user.username.charAt(0) : 'U')}
              </motion.div>
              <div>
                <motion.h3 className="font-medium">{user.fullName || user.username || t('common.user')}</motion.h3>
                <motion.p className="text-xs text-muted-foreground">{t(`plans.${user.currentPlan || 'free'}`, 'خطة مجانية')}</motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Menu items */}
      <nav className="flex-1 p-4">
        <motion.p 
          className="text-xs font-medium text-muted-foreground mb-3 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          القائمة الرئيسية
        </motion.p>

        <motion.div 
          className="space-y-4"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={menuItemVariants}>
            <SidebarItem href="/" icon={<FaChartPie size={16} />} active={location === "/"}>
              {t('sidebar.dashboard', 'لوحة التحكم')}
            </SidebarItem>
          </motion.div>
          <motion.div variants={menuItemVariants}>
            <SidebarItem href="/compose" icon={<FaPenToSquare size={16} />} active={location === "/compose"}>
              {t('sidebar.compose', 'إنشاء محتوى')}
            </SidebarItem>
          </motion.div>
          <motion.div variants={menuItemVariants}>
            <SidebarItem href="/scheduled" icon={<FaCalendar size={16} />} active={location === "/scheduled"}>
              {t('sidebar.scheduled', 'المنشورات المجدولة')}
            </SidebarItem>
          </motion.div>
          <motion.div variants={menuItemVariants}>
            <SidebarItem href="/analytics" icon={<FaChartLine size={16} />} active={location === "/analytics"}>
              {t('sidebar.analytics', 'التحليلات')}
            </SidebarItem>
          </motion.div>
          <motion.div variants={menuItemVariants}>
            <SidebarItem href="/connect" icon={<FaLink size={16} />} active={location === "/connect"}>
              {t('sidebar.connect', 'ربط الحسابات')}
            </SidebarItem>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <motion.h4 
            className="text-xs font-medium text-muted-foreground mb-3 px-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {t('sidebar.settingsHeader', 'الإعدادات')}
          </motion.h4>
          <motion.div 
            className="space-y-4"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 0.6 }}
          >
            <motion.div variants={menuItemVariants}>
              <SidebarItem href="/settings" icon={<FaUser size={16} />} active={location === "/settings"}>
                {t('sidebar.account', 'الحساب')}
              </SidebarItem>
            </motion.div>
            <motion.div variants={menuItemVariants}>
              <SidebarItem href="/subscribe" icon={<FaCreditCard size={16} />} active={location === "/subscribe"}>
                {t('sidebar.subscription', 'الاشتراك')}
              </SidebarItem>
            </motion.div>
            <motion.div variants={menuItemVariants}>
              <SidebarItem href="/help" icon={<FaCircleQuestion size={16} />} active={location === "/help"}>
                {t('sidebar.help', 'المساعدة')}
              </SidebarItem>
            </motion.div>
          </motion.div>
        </motion.div>
      </nav>
    </motion.aside>
  );
}
