import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import Card from '../UI/Card';
import { Activity } from 'lucide-react';

interface ChartDataPoint {
  name: string;
  revenue: number;
  expense: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
}

export const RevenueChart: React.FC<RevenueChartProps> = React.memo(({ data }) => {
  // Render guard: Chỉ render Recharts khi component đã mounted & có layout
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // DashboardView có animation duration-500, nên cần delay > 500ms
    // để đảm bảo layout đã ổn định hoàn toàn trước khi đo size
    const timer = setTimeout(() => {
      // Double check với requestAnimationFrame để chắc chắn paint xong
      window.requestAnimationFrame(() => setIsMounted(true));
    }, 600);
    return () => clearTimeout(timer);
  }, []);


  return (
    <Card className="lg:col-span-2 !p-8 min-w-0 min-h-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Activity size={20} className="text-indigo-600 dark:text-indigo-400"/> 
            Hiệu quả kinh doanh
          </h3>
          <p className="text-sm text-slate-400 font-medium">Theo dõi dòng tiền 6 tháng gần nhất</p>
        </div>
        <div className="flex gap-4 text-xs font-bold">
          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> Doanh thu
          </span>
          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Chi phí
          </span>
        </div>
      </div>
      
      <div className="w-full">
        {isMounted ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: 'var(--chart-text)'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: 'var(--chart-text)'}} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                  fontSize: '12px', 
                  fontWeight: 600,
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  color: 'var(--chart-tooltip-text)'
                }}
                formatter={(v: number) => [v.toLocaleString() + ' đ']}
                labelStyle={{ color: 'var(--chart-text)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-[300px] bg-slate-50/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
        )}
      </div>
    </Card>
  );
});

RevenueChart.displayName = 'RevenueChart';
