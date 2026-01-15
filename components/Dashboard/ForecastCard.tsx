import React from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, Target } from 'lucide-react';
import Card from '../UI/Card';

interface ForecastCardProps {
  predictedRevenue: number;
  predictedExpense: number;
  revenueGrowthPercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export const ForecastCard: React.FC<ForecastCardProps> = React.memo(({
  predictedRevenue,
  predictedExpense,
  revenueGrowthPercent,
  trend,
  confidence
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400';
  const trendBg = trend === 'up' ? 'bg-emerald-500/10' : trend === 'down' ? 'bg-rose-500/10' : 'bg-slate-500/10';

  const predictedProfit = predictedRevenue - predictedExpense;

  return (
    <Card className="!p-6 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 rounded-xl text-violet-600">
              <Target size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Dự báo tháng tới</h4>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles size={10} /> AI Prediction
              </p>
            </div>
          </div>
          
          {/* Confidence Badge */}
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Độ tin cậy</span>
            <p className={`text-lg font-black ${confidence > 70 ? 'text-emerald-600' : confidence > 40 ? 'text-yellow-600' : 'text-slate-400'}`}>
              {confidence}%
            </p>
          </div>
        </div>

        {/* Main Prediction */}
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 mb-4 border border-white/50 shadow-sm">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-1">Doanh thu dự kiến</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
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
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3 border border-white/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Chi phí dự kiến</p>
            <p className="text-sm font-bold text-slate-700">{predictedExpense.toLocaleString()} đ</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3 border border-white/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Lợi nhuận dự kiến</p>
            <p className={`text-sm font-bold ${predictedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {predictedProfit.toLocaleString()} đ
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
});

ForecastCard.displayName = 'ForecastCard';
