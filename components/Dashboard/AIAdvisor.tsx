import React, { useState } from 'react';
import { Sparkles, Loader, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';
import Button from '../UI/Button';
import { AIAdviceResponse } from '../../services/aiService';

interface AIAdvisorProps {
  onGetAdvice: () => Promise<AIAdviceResponse | null>;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = React.memo(({ onGetAdvice }) => {
  const [analysis, setAnalysis] = useState<AIAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    setLoading(true);
    try {
      const result = await onGetAdvice();
      setAnalysis(result);
    } catch (error) {
      console.error('AI Service Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-rose-400';
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl relative border border-slate-200 dark:border-slate-800">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Sparkles size={80} />
      </div>

      <div className="p-6 relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 mb-2 border border-indigo-100 dark:border-indigo-500/30">
              <Sparkles size={12} /> AI Advisor Pro
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Trợ lý Chiến lược</h3>
          </div>
          {analysis && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 font-bold uppercase">Health Score</span>
              <span className={`text-3xl font-black ${getScoreColor(analysis.healthScore)}`}>
                {analysis.healthScore}/100
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[240px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader className="animate-spin text-indigo-500" size={32} />
              <p className="text-sm font-medium animate-pulse">Đang phân tích dữ liệu tài chính...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed font-medium">
                  {analysis.summary}
                </p>
              </div>

              {/* Risks & Opportunities Grid */}
              <div className="grid gap-3">
                {analysis.risks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase flex items-center gap-2">
                      <AlertTriangle size={12} /> Cảnh báo rủi ro
                    </p>
                    {analysis.risks.map((risk, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-rose-50 dark:bg-rose-500/5 p-2 rounded-lg border border-rose-100 dark:border-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors">
                        <span className="mt-0.5 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                        {risk}
                      </div>
                    ))}
                  </div>
                )}

                {analysis.opportunities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-2">
                      <TrendingUp size={12} /> Cơ hội tăng trưởng
                    </p>
                    {analysis.opportunities.map((opp, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-500/5 p-2 rounded-lg border border-emerald-100 dark:border-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-colors">
                        <span className="mt-0.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                        {opp}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-600">
                <ShieldCheck size={32} />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Chưa có dữ liệu phân tích</p>
              <p className="text-slate-500 text-xs max-w-[200px]">
                Nhấn nút bên dưới để AI quét toàn bộ chỉ số kinh doanh của bạn
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <Button
            onClick={handleGetAdvice}
            disabled={loading}
            className="w-full !bg-indigo-600 !text-white hover:!bg-indigo-500 !font-bold !shadow-lg shadow-indigo-900/20 border-none"
          >
            {loading ? 'Đang xử lý...' : analysis ? 'Phân tích lại' : 'Bắt đầu phân tích'}
          </Button>
        </div>
      </div>
    </div>
  );
});

AIAdvisor.displayName = 'AIAdvisor';
