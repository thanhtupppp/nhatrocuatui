import React from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, Target, AlertTriangle, Info, Zap } from 'lucide-react';
import Card from '../UI/Card';

interface ForecastCardProps {
  predictedRevenue: number;
  predictedExpense: number;
  revenueGrowthPercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  analysis?: {
    phase: 'growth' | 'stable' | 'decline' | 'volatile' | 'risk';
    quality: 'healthy' | 'warning' | 'critical';
    volatility: number;
    explanation: string;
  };
}

export const ForecastCard: React.FC<ForecastCardProps> = React.memo(({
  predictedRevenue,
  predictedExpense,
  revenueGrowthPercent,
  trend,
  confidence,
  analysis
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400';
  const trendBg = trend === 'up' ? 'bg-emerald-500/10' : trend === 'down' ? 'bg-rose-500/10' : 'bg-slate-500/10';

  const predictedProfit = predictedRevenue - predictedExpense;

  // Analysis Visuals
  const getPhaseConfig = (phase: string) => {
    switch(phase) {
      case 'growth': return { label: 'TĂNG TRƯỞNG', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: TrendingUp };
      case 'stable': return { label: 'ỔN ĐỊNH', color: 'text-blue-700', bg: 'bg-blue-100', icon: Minus };
      case 'decline': return { label: 'SUY GIẢM', color: 'text-orange-700', bg: 'bg-orange-100', icon: TrendingDown };
      case 'volatile': return { label: 'BIẾN ĐỘNG', color: 'text-amber-700', bg: 'bg-amber-100', icon: Zap };
      case 'risk': return { label: 'RỦI RO CAO', color: 'text-rose-700', bg: 'bg-rose-100', icon: AlertTriangle };
      default: return { label: '', color: '', bg: '', icon: Info };
    }
  };

  const phaseConfig = analysis ? getPhaseConfig(analysis.phase) : null;
  const PhaseIcon = phaseConfig?.icon || Info;

  return (
  return (
    <Card className="!p-6 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-violet-100 dark:border-slate-700 relative overflow-hidden flex flex-col h-full">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-xl" />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400">
              <Target size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Dự báo tháng tới</h4>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles size={10} /> AI Prediction
              </p>
            </div>
          </div>
          
          {/* Confidence Badge */}
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Độ tin cậy</span>
            <p className={`text-lg font-black ${confidence > 70 ? 'text-emerald-600 dark:text-emerald-500' : confidence > 40 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400'}`}>
              {confidence}%
            </p>
          </div>
        </div>

        {/* Main Prediction */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-xl p-4 mb-4 border border-white/50 dark:border-white/5 shadow-sm relative overflow-hidden">
            {/* Phase Badge (If available) */}
            {phaseConfig && (
              <div className={`absolute top-0 right-0 px-2.5 py-1 ${phaseConfig.bg} dark:bg-opacity-20 rounded-bl-xl`}>
                 <div className={`flex items-center gap-1.5 ${phaseConfig.color} dark:brightness-110`}>
                    <PhaseIcon size={10} strokeWidth={3} />
                    <span className="text-[9px] font-black tracking-wider">{phaseConfig.label}</span>
                 </div>
              </div>
            )}

          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-1">Doanh thu dự kiến</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {predictedRevenue.toLocaleString()} đ
              </p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trendBg} ${trendColor} font-bold text-sm`}>
              <TrendIcon size={14} />
              {revenueGrowthPercent > 0 ? '+' : ''}{revenueGrowthPercent}%
            </div>
          </div>
        </div>

        {/* Sub metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-white/50 dark:border-white/5 relative">
            {/* Warning for Expense Growth */}
            {analysis?.quality === 'warning' && (
                <div className="absolute top-1 right-1 text-amber-500 tooltip" title="Chi phí tăng nhanh hơn doanh thu">
                    <AlertTriangle size={12} />
                </div>
            )}
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Chi phí dự kiến</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{predictedExpense.toLocaleString()} đ</p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-white/50 dark:border-white/5">
             <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Lợi nhuận dự kiến</p>
             <p className={`text-sm font-bold ${predictedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
               {predictedProfit.toLocaleString()} đ
             </p>
          </div>
        </div>

        {/* AI Explanation Text */}
        {analysis?.explanation && (
            <div className="mt-auto bg-violet-500/5 dark:bg-violet-500/10 rounded-lg p-3 border border-violet-500/10 dark:border-violet-500/20">
                <div className="flex gap-2">
                    <Info size={14} className="text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
                        {analysis.explanation}
                    </p>
                </div>
            </div>
        )}

      </div>
    </Card>
  );
});

ForecastCard.displayName = 'ForecastCard';
