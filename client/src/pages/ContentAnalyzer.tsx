import ContentAnalyzerComponent from "@/components/content/ContentAnalyzer";
import { useTranslation } from "react-i18next";

export default function ContentAnalyzer() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 md:p-12 mb-8">
          <h1 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-bold mb-2">
            {t("contentAnalyzer.pageTitle")}
          </h1>
          <p className="text-lg mb-6">
            {t("contentAnalyzer.description")}
          </p>
          <ContentAnalyzerComponent />
        </div>
      </div>
    </div>
  );
}