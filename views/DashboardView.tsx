import React, { useMemo, useCallback } from 'react';
import { Room, Invoice, Expense, ViewType } from '../types';
import { TrendingUp, Wallet, Coins, DoorOpen } from 'lucide-react';
import { getAIAdvice, AIAdviceResponse } from '../services/aiService';
import { formatCurrency } from '../utils/formatUtils';

// Custom Hooks
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useChartData } from '../hooks/useChartData';
import { useRevenueForecast } from '../hooks/useRevenueForecast';

// Sub-components
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { RevenueChart } from '../components/Dashboard/RevenueChart';
import { AIAdvisor } from '../components/Dashboard/AIAdvisor';
import { RoomOverview } from '../components/Dashboard/RoomOverview';
import { ForecastCard } from '../components/Dashboard/ForecastCard';
import { ExportButton } from '../components/Dashboard/ExportButton';

interface DashboardViewProps {
  rooms: Room[];
  invoices: Invoice[];
  expenses: Expense[];
  setView: (view: ViewType) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  rooms, 
  invoices, 
  expenses, 
  setView 
}) => {
  // Use custom hooks for data processing
  const { month, occupancyRate, revenue, expense, profit, profitMargin, prevRevenue } = useDashboardStats(rooms, invoices, expenses);
  const chartData = useChartData(invoices, expenses);
  const forecast = useRevenueForecast(chartData);

  // Prepare stats for StatsGrid - memoized to prevent unnecessary re-renders
  const stats = useMemo(() => [
    { 
      label: 'Doanh thu tháng này', 
      value: formatCurrency(revenue), 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-100' 
    },
    { 
      label: 'Chi phí vận hành', 
      value: formatCurrency(expense), 
      icon: Wallet, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      border: 'border-rose-100' 
    },
    { 
      label: 'Lợi nhuận ròng', 
      value: formatCurrency(profit), 
      icon: Coins, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      border: 'border-indigo-100' 
    },
    { 
      label: 'Tỷ lệ lấp đầy', 
      value: `${occupancyRate}%`, 
      icon: DoorOpen, 
      color: 'text-cyan-600', 
      bg: 'bg-cyan-50', 
      border: 'border-cyan-100' 
    },
  ], [revenue, expense, profit, occupancyRate]);

  // AI Advice handler - memoized to prevent creating new function on every render
  const handleGetAdvice = useCallback(async (): Promise<AIAdviceResponse | null> => {
    const context = {
      occupancyRate,
      revenue,
      expense,
      profit,
      profitMargin,
      prevRevenue,
      totalRooms: rooms.length
    };
    const advice = await getAIAdvice(context);
    return advice;
  }, [occupancyRate, revenue, expense, profit, profitMargin, prevRevenue, rooms.length]);

  // Prepare export data
  const exportData = useMemo(() => {
    return chartData.map(d => ({
      month: d.name,
      revenue: d.revenue,
      expense: d.expense,
      profit: d.revenue - d.expense
    }));
  }, [chartData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tổng quan</h1>
          <p className="text-sm text-slate-400 font-medium">Theo dõi hiệu quả kinh doanh nhà trọ</p>
        </div>
        <ExportButton data={exportData} />
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} currentMonth={month} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart - 2 columns */}
        <RevenueChart data={chartData} />

        {/* AI Advisor - 1 column */}
        <AIAdvisor onGetAdvice={handleGetAdvice} />
      </div>

      {/* Forecast & Room Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Forecast Card */}
        <ForecastCard 
          predictedRevenue={forecast.predictedRevenue}
          predictedExpense={forecast.predictedExpense}
          revenueGrowthPercent={forecast.revenueGrowthPercent}
          trend={forecast.trend}
          confidence={forecast.confidence}
        />

        {/* Room Overview - 2 columns */}
        <div className="lg:col-span-2">
          <RoomOverview rooms={rooms} />
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
