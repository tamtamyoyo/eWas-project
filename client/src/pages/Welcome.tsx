import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/theme/LanguageToggle";
import { FaChartBar, FaCalendarAlt, FaMagic, FaGlobe } from "react-icons/fa";

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: t("welcome.slide1.title", "Welcome to eWasl"),
      description: t("welcome.slide1.description", "The smart way to manage your social media presence"),
      icon: <FaGlobe className="h-12 w-12 text-primary" />
    },
    {
      title: t("welcome.slide2.title", "Advanced Analytics"),
      description: t("welcome.slide2.description", "Track your social media performance with detailed insights"),
      icon: <FaChartBar className="h-12 w-12 text-primary" />
    },
    {
      title: t("welcome.slide3.title", "Smart Scheduling"),
      description: t("welcome.slide3.description", "Schedule your posts for optimal engagement times"),
      icon: <FaCalendarAlt className="h-12 w-12 text-primary" />
    },
    {
      title: t("welcome.slide4.title", "AI-Powered Content"),
      description: t("welcome.slide4.description", "Generate content ideas and optimize your posts with AI"),
      icon: <FaMagic className="h-12 w-12 text-primary" />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-6 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.svg" 
            alt="eWasl Logo" 
            className="h-8 w-8"
          />
          <h1 className="text-2xl font-bold">{t("common.appName")}</h1>
        </div>
        <LanguageToggle />
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row px-6 py-12">
        <div className={`w-full md:w-1/2 flex flex-col justify-center ${isRtl ? 'md:order-2' : ''}`}>
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-primary">{slides[currentSlide].title}</h2>
              <p className="text-xl opacity-80">{slides[currentSlide].description}</p>
            </div>
            
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                {slides.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "w-8 bg-primary" : "w-2 bg-gray-300 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              
              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <Button asChild className="h-14 rounded-full text-base" size="lg">
                  <Link to="/login">{t("welcome.login", "Login")}</Link>
                </Button>
                <Button asChild variant="outline" className="h-14 rounded-full text-base" size="lg">
                  <Link to="/register">{t("welcome.register", "Create an Account")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`w-full md:w-1/2 flex items-center justify-center mt-12 md:mt-0 ${isRtl ? 'md:order-1' : ''}`}>
          <div className="relative h-80 w-80">
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full">
              {slides[currentSlide].icon}
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-40 w-40 bg-primary/5 rounded-full animate-ping" />
          </div>
        </div>
      </main>
      
      <footer className="py-6 px-6 text-center text-sm opacity-70">
        <p>&copy; {new Date().getFullYear()} eWasl. {t("welcome.rightsReserved", "All rights reserved.")}</p>
      </footer>
    </div>
  );
}