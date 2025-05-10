import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

// In a real app, this data would come from an API
const engagementData = [
  { name: "Facebook", value: 32, color: "#4267B2" },
  { name: "Instagram", value: 28, color: "#E1306C" },
  { name: "Twitter", value: 24, color: "#1DA1F2" },
  { name: "LinkedIn", value: 16, color: "#0077B5" },
];

export default function EngagementChart() {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('charts.engagementByPlatform')}</h3>
          <Button variant="ghost" size="icon">
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </Button>
        </div>
        
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="value"
              >
                {engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend 
                layout="vertical"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          {engagementData.map((platform) => (
            <div key={platform.name} className="flex items-center">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platform.color }}></span>
              <span className="text-xs text-neutral-600 ml-2">{platform.name}</span>
              <span className="text-xs text-neutral-900 font-medium ml-auto">{platform.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
