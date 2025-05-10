import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FaCheck, FaTimes } from "react-icons/fa";
import { BsLightningCharge } from "react-icons/bs";
import { useAuth } from "@/hooks/useAuth";

// Import icons from react-icons
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal } from "react-icons/fa";

export default function SubscribePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Calculate yearly pricing with discount
  const calculateYearlyPrice = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% discount
    return yearlyPrice.toFixed(0);
  };

  // Plans data structure
  const plans = [
    {
      id: "starter",
      name: "بيسيك",
      label: "BASIC",
      description: "لجميع الأفراد والمبتدئين الذين يرغبون في البدء بوسائل التواصل الاجتماعي.",
      monthlyPrice: 19,
      features: [
        { name: "الوصول إلى جميع الميزات", included: true },
        { name: "1000 عملية بحث شهريًا", included: true },
        { name: "بدون أرصدة API", included: false },
        { name: "10 حصص مراقبة", included: true },
        { name: "60 دقيقة فاصل المراقبة", included: true },
        { name: "خصم 20% على الطلبات المستقبلية", included: true },
        { name: "تقييم النطاق", included: true, tag: "قريبًا" },
        { name: "مراقبة IP", included: true, tag: "قريبًا" },
        { name: "مراقبة الروابط الخلفية", included: true, tag: "قريبًا" },
      ],
    },
    {
      id: "business",
      name: "بروفيشنال",
      label: "PROFESSIONAL",
      popular: true,
      description: "لمديري وسائل التواصل الاجتماعي المحترفين والمستثمرين ذوي المحفظة الكبيرة.",
      monthlyPrice: 49,
      features: [
        { name: "الوصول إلى جميع الميزات", included: true },
        { name: "1000 عملية بحث شهريًا", included: true },
        { name: "10 حصص مراقبة", included: true },
        { name: "30 ألف رصيد API شهريًا", included: true },
        { name: "60 دقيقة فاصل المراقبة", included: true },
        { name: "خصم 20% على الطلبات المستقبلية", included: true },
        { name: "تقييم النطاق", included: true, tag: "قريبًا" },
        { name: "مراقبة IP", included: true, tag: "قريبًا" },
        { name: "مراقبة الروابط الخلفية", included: true, tag: "قريبًا" },
      ],
    },
    {
      id: "agency",
      name: "أدفانسد",
      label: "ADVANCED",
      description: "لجميع الأفراد والمبتدئين الذين يرغبون في البدء بوسائل التواصل الاجتماعي.",
      monthlyPrice: 99,
      features: [
        { name: "الوصول إلى جميع الميزات", included: true },
        { name: "1000 عملية بحث شهريًا", included: true },
        { name: "10 حصص مراقبة", included: true },
        { name: "30 ألف رصيد API شهريًا", included: true },
        { name: "60 دقيقة فاصل المراقبة", included: true },
        { name: "خصم 20% على الطلبات المستقبلية", included: true },
        { name: "تقييم النطاق", included: true, tag: "قريبًا" },
        { name: "مراقبة IP", included: true, tag: "قريبًا" },
        { name: "مراقبة الروابط الخلفية", included: true, tag: "قريبًا" },
      ],
    },
  ];

  const handleFreeTrial = (planId: string) => {
    // In a real app, this would initiate the checkout process with Stripe
    // For now, we'll just redirect to dashboard
    console.log(`Start free trial for plan: ${planId}`);
    
    // Using window.location for simple redirection
    window.location.href = "/dashboard";
  };

  return (
    <div className="container py-10 max-w-7xl" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FFDC26 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            اختر خطتك
          </h1>
          <p className="text-muted-foreground max-w-[700px] mx-auto">
            حدد الخطة المثالية لاحتياجات إدارة وسائل التواصل الاجتماعي الخاصة بك
          </p>
        </div>

        <div className="flex justify-center mt-6 mb-8 rtl">
          <div className="bg-black text-white rounded-lg overflow-hidden flex">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`px-10 py-3 text-center ${billingCycle === "monthly" ? "bg-black" : "bg-white text-black"}`}
            >
              شهري
            </button>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`px-10 py-3 relative ${billingCycle === "yearly" ? "bg-white text-black" : "bg-black"}`}
            >
              سنوي
              <span className="absolute -top-3 -right-3 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                توفير 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col relative overflow-hidden ${
                plan.popular
                  ? "bg-[#000B33] text-white md:scale-105"
                  : "bg-white"
              }`}
              style={{ borderRadius: "9px", border: plan.popular ? "none" : "1px solid #E5E7EB" }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 left-0 bg-blue-600 py-1 text-center text-xs font-medium text-white">
                  مميز
                </div>
              )}
              <CardHeader>
                <div className="flex items-start">
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 font-semibold ${plan.popular ? "bg-white text-[#000B33]" : "bg-gray-100"}`}
                  >
                    {plan.label}
                  </Badge>
                </div>
                <CardDescription className={`mt-4 ${plan.popular ? "text-white/80" : ""}`}>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div dir="rtl" className="mt-2 flex items-baseline text-5xl font-extrabold">
                  ${billingCycle === "monthly" ? plan.monthlyPrice : calculateYearlyPrice(plan.monthlyPrice)}
                  <span className="mr-1 text-xl font-medium opacity-80">
                    {billingCycle === "monthly" ? "/شهر" : "/سنة"}
                  </span>
                </div>
                <p dir="rtl" className={`mt-1 text-sm ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                  لكل عضو، لكل فترة
                </p>
                <hr className={`my-4 opacity-30 ${plan.popular ? "border-white" : "border-gray-300"}`} />
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start rtl">
                      <div className="flex-shrink-0 ml-3">
                        {feature.included ? (
                          <div className={`flex items-center justify-center w-5 h-5 rounded-full ${plan.popular ? "bg-white text-[#000B33]" : "bg-green-500 text-white"}`}>
                            <FaCheck className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white">
                            <FaTimes className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className={`text-sm ${plan.popular ? "text-white/90" : "text-muted-foreground"}`}>
                        {feature.name}
                        {feature.tag && (
                          <span className={`mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${plan.popular ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"}`}>
                            {feature.tag}
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-0">
                <Button
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? "bg-[#F9D783] hover:bg-[#F9D783]/90 text-black"
                      : "bg-black text-white hover:bg-black/90"
                  }`}
                  onClick={() => handleFreeTrial(plan.id)}
                >
                  <BsLightningCharge className="ml-2 h-4 w-4" />
                  ابدأ التجربة المجانية لمدة 14 يوم
                </Button>
                <p className={`text-xs text-center ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                  لا تحتاج إلى بطاقة ائتمان
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <h3 className="text-xl font-medium mb-4">طرق الدفع</h3>
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <FaCcVisa className="h-10 w-10 text-blue-600" />
            <FaCcMastercard className="h-10 w-10 text-red-500" />
            <FaCcAmex className="h-10 w-10 text-blue-500" />
            <FaCcPaypal className="h-10 w-10 text-blue-800" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            نقبل فيزا، أمريكان إكسبريس، ماستركارد و باي بال
          </p>
        </div>
      </motion.div>
    </div>
  );
}