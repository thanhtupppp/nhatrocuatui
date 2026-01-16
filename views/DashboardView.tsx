import React, { useState, useMemo, useCallback } from 'react';
import { Room, Invoice, Expense, ViewType } from '../types';
import { TrendingUp, Wallet, Coins, DoorOpen } from 'lucide-react';
import { getAIAdvice, AIAdviceResponse } from '../services/aiService';
import { formatCurrency } from '../utils/financialUtils';
import { getCurrentPeriod, getPreviousPeriod } from '../utils/dateUtils';

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
  const current = getCurrentPeriod();
  const def = getPreviousPeriod(current.month, current.year);
  const [selectedMonth, setSelectedMonth] = useState(def.month);
  const [selectedYear, setSelectedYear] = useState(def.year);

  // Use custom hooks for data processing
  const { 
    month, occupancyRate, totalBilled, collectedRevenue, 
    expense, profit, profitMargin, prevRevenue,
    totalElectricityUsage, totalElectricityCost, totalWaterUsage, totalWaterCost,
    utilityElectricityBill, utilityWaterBill
  } = useDashboardStats(rooms, invoices, expenses, selectedMonth, selectedYear);
  
  // Calculate previous period stats (needed for AI analysis)
  const prevPeriod = useMemo(() => getPreviousPeriod(selectedMonth, selectedYear), [selectedMonth, selectedYear]);
  const prevStats = useDashboardStats(rooms, invoices, expenses, prevPeriod.month, prevPeriod.year);
  
  const chartData = useChartData(invoices, expenses);
  const forecast = useRevenueForecast(chartData);

  // Prepare stats for StatsGrid - memoized to prevent unnecessary re-renders
  const stats = useMemo(() => [
    { 
      label: 'Tổng doanh số (Đã lập)', 
      value: formatCurrency(totalBilled), 
      icon: TrendingUp, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      border: 'border-indigo-100' 
    },
    { 
      label: 'Thực tế đã thu', 
      value: formatCurrency(collectedRevenue), 
      icon: Coins, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-100' 
    },
    { 
      label: 'Tổng chi phí', 
      value: formatCurrency(expense), 
      icon: Wallet, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      border: 'border-rose-100' 
    },
    { 
      label: 'Lợi nhuận ròng', 
      value: formatCurrency(profit), 
      icon: TrendingUp, 
      color: profit >= 0 ? 'text-blue-600' : 'text-rose-600', 
      bg: profit >= 0 ? 'bg-blue-50' : 'bg-rose-50', 
      border: profit >= 0 ? 'border-blue-100' : 'border-rose-100' 
    },
    { 
      label: 'Tỷ lệ lấp đầy', 
      value: `${occupancyRate}%`, 
      icon: DoorOpen, 
      color: 'text-cyan-600', 
      bg: 'bg-cyan-50', 
      border: 'border-cyan-100' 
    },
  ], [totalBilled, collectedRevenue, expense, profit, occupancyRate]);

  // AI Advice handler - memoized to prevent creating new function on every render
  const handleGetAdvice = useCallback(async (): Promise<AIAdviceResponse | null> => {
    // Calculate trends (growth rates)
    const calculateGrowth = (oldVal: number, newVal: number): number => {
      if (oldVal === 0) return newVal > 0 ? 100 : 0;
      return ((newVal - oldVal) / oldVal) * 100;
    };
    
    // Build comprehensive AI context using pre-calculated stats
    const context = {
      currentPeriod: {
        month: selectedMonth,
        year: selectedYear,
        occupancyRate,
        totalBilled,
        collectedRevenue,
        expense,
        profit,
        profitMargin,
        totalRooms: rooms.length,
        occupiedRooms: Math.round(rooms.length * occupancyRate / 100),
        electricityRevenue: totalElectricityCost,
        electricityExpense: utilityElectricityBill,
        waterRevenue: totalWaterCost,
        waterExpense: utilityWaterBill
      },
      previousPeriod: {
        month: prevPeriod.month,
        year: prevPeriod.year,
        occupancyRate: prevStats.occupancyRate,
        collectedRevenue: prevStats.collectedRevenue,
        expense: prevStats.expense,
        profit: prevStats.profit,
        profitMargin: prevStats.profitMargin
      },
      trends: {
        revenueGrowth: calculateGrowth(prevStats.collectedRevenue, collectedRevenue),
        expenseGrowth: calculateGrowth(prevStats.expense, expense),
        profitGrowth: calculateGrowth(prevStats.profit, profit),
        occupancyChange: occupancyRate - prevStats.occupancyRate,
        collectionEfficiency: totalBilled > 0 ? (collectedRevenue / totalBilled) * 100 : 0
      }
    };
    
    const advice = await getAIAdvice(context);
    return advice;
  }, [
    selectedMonth, 
    selectedYear, 
    occupancyRate, 
    totalBilled, 
    collectedRevenue, 
    expense, 
    profit, 
    profitMargin,
    totalElectricityCost,
    utilityElectricityBill,
    totalWaterCost,
    utilityWaterBill,
    rooms.length,
    prevPeriod,
    prevStats
  ]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tổng quan</h1>
          <p className="text-sm text-slate-400 font-medium">Theo dõi hiệu quả kinh doanh nhà trọ</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(Number(e.target.value))}
               className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
             >
               {Array.from({ length: 12 }, (_, i) => (
                 <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
               ))}
             </select>
             <div className="w-px h-4 bg-slate-200 mx-1"></div>
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(Number(e.target.value))}
               className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
             >
               {[2023, 2024, 2025, 2026].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
          </div>
          <ExportButton data={exportData} />
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} currentMonth={selectedMonth} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart - 2 columns */}
        <RevenueChart data={chartData} />

        {/* AI Advisor - 1 column */}
        <AIAdvisor onGetAdvice={handleGetAdvice} />
      </div>

      {/* Utilities Report Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-900">Đối soát Điện & Nước</h2>
            <p className="text-sm text-slate-400 font-medium">So sánh tiêu thụ thực tế của khách hàng vs Hóa đơn nhà cung cấp</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
            Tháng {selectedMonth} / {selectedYear}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold">
          {/* Electricity column */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <span className="text-amber-900 uppercase text-xs tracking-widest font-black">Điện tiêu thụ</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-slate-900">{totalElectricityUsage.toLocaleString()}</span>
              <span className="text-slate-400">kWh</span>
            </div>
            <div className="pt-4 border-t border-amber-100 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
                <span>Thu khách:</span>
                <span className="text-emerald-600">+{formatCurrency(totalElectricityCost)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
                <span>Chi bill:</span>
                <span className="text-rose-600">-{formatCurrency(utilityElectricityBill)}</span>
              </div>
              <div className="pt-2 border-t border-amber-100 flex justify-between items-center font-black">
                <span className="text-[10px] text-slate-400 uppercase">Chênh lệch:</span>
                <span className={totalElectricityCost - utilityElectricityBill >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {formatCurrency(totalElectricityCost - utilityElectricityBill)}
                </span>
              </div>
            </div>
          </div>

          {/* Water column */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <span className="text-blue-900 uppercase text-xs tracking-widest font-black">Nước tiêu thụ</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-slate-900">{totalWaterUsage.toLocaleString()}</span>
              <span className="text-slate-400">m³</span>
            </div>
            <div className="pt-4 border-t border-blue-100 space-y-2">
               <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
                <span>Thu khách:</span>
                <span className="text-emerald-600">+{formatCurrency(totalWaterCost)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tighter">
                <span>Chi bill:</span>
                <span className="text-rose-600">-{formatCurrency(utilityWaterBill)}</span>
              </div>
              <div className="pt-2 border-t border-blue-100 flex justify-between items-center font-black">
                <span className="text-[10px] text-slate-400 uppercase">Chênh lệch:</span>
                <span className={totalWaterCost - utilityWaterBill >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {formatCurrency(totalWaterCost - utilityWaterBill)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="bg-white self-start p-1.5 rounded-md shadow-sm border border-slate-200">
             <Coins size={14} className="text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700">Mẹo đối soát:</span> Hãy so sánh tổng <span className="text-amber-600 font-black">{totalElectricityUsage} kWh</span> này với chỉ số trên công tơ điện tổng của nhà trọ. Nếu số kWh trên công tơ tổng cao hơn nhiều so với tổng của các phòng, có thể đang có hiện tượng rò rỉ điện hoặc thiết bị công cộng tiêu thụ quá mức.
          </p>
        </div>
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
          analysis={forecast.analysis}
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
