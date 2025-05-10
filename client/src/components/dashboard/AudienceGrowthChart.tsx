import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// In a real app, this data would come from an API
const generateChartData = (days: number) => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      date: date.toISOString().slice(0, 10),
      instagram: Math.floor(5000 + Math.random() * 500 * i / 10),
      twitter: Math.floor(3500 + Math.random() * 300 * i / 10),
      facebook: Math.floor(7000 + Math.random() * 400 * i / 10),
    });
  }
  
  return data;
};

export default function AudienceGrowthChart() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("30");
  const data = generateChartData(parseInt(timeRange));
  
  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('charts.audienceGrowth')}</h3>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px] text-sm border border-neutral-100 rounded-lg">
                <SelectValue placeholder={t('charts.selectTimePeriod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{t('charts.last30Days')}</SelectItem>
                <SelectItem value="90">{t('charts.last90Days')}</SelectItem>
                <SelectItem value="365">{t('charts.lastYear')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [new Intl.NumberFormat().format(value), '']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="instagram" 
                stroke="#3050F8" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="twitter" 
                stroke="#FF9500" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="facebook" 
                stroke="#34C759" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
