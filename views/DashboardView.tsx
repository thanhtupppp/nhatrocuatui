
import React, { useMemo, useState } from 'react';
import { Room, Invoice, Expense, Tenant, ViewType } from '../types';
import { TrendingUp, Wallet, Coins, DoorOpen, ChevronRight, Sparkles, Lightbulb, Activity } from 'lucide-react';
import { getAIAdvice } from '../services/geminiService';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface DashboardViewProps {
  rooms: Room[];
  invoices: Invoice[];
  expenses: Expense[];
  tenants: Tenant[];
  setView: (view: ViewType) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ rooms, invoices, expenses, tenants, setView }) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const occupancyRate = rooms.length > 0 ? (rooms.filter(r => r.status === 'OCCUPIED').length / rooms.length * 100) : 0;
  const currentRevenue = invoices.filter(i => i.month === currentMonth && i.paid).reduce((a, c) => a + c.total, 0);

  const stats = useMemo(() => {
    const revenue = currentRevenue;
    const expense = expenses.filter(e => e.date.startsWith(`${currentYear}-${currentMonth.toString().padStart(2, '0')}`)).reduce((a, c) => a + c.amount, 0);
    
    return [
      { label: 'Doanh thu tháng này', value: revenue.toLocaleString() + ' đ', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Chi phí vận hành', value: expense.toLocaleString() + ' đ', icon: Wallet, color: 'text-red-600', bg: 'bg-red-50' },
      { label: 'Lợi nhuận ròng', value: (revenue - expense).toLocaleString() + ' đ', icon: Coins, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Tỷ lệ lấp đầy', value: occupancyRate.toFixed(0) + '%', icon: DoorOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];
  }, [invoices, expenses, rooms, currentMonth, currentYear, occupancyRate, currentRevenue]);

  const handleGetAdvice = async () => {
    setIsAdviceLoading(true);
    try {
      const advice = await getAIAdvice(occupancyRate, currentRevenue);
      setAiAdvice(advice);
    } catch (err) {
      setAiAdvice("Hệ thống tư vấn đang bận. Vui lòng thử lại sau.");
    } finally {
      setIsAdviceLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { month: d.getMonth() + 1, year: d.getFullYear(), label: `Tháng ${d.getMonth() + 1}` };
    }).reverse();

    return months.map(m => {
      const rev = invoices.filter(inv => inv.month === m.month && inv.year === m.year && inv.paid).reduce((a, b) => a + b.total, 0);
      const exp = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === m.month && d.getFullYear() === m.year;
      }).reduce((a, b) => a + b.amount, 0);
      return { name: m.label, revenue: rev, expense: exp };
    });
  }, [invoices, expenses]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}><stat.icon size={24} /></div>
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-wider">{stat.label}</p>
            <h3 className="text-xl font-black text-slate-900 leading-none">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-3"><Activity size={20} className="text-blue-600"/> Tình hình kinh doanh 6 tháng</h3>
            <div className="flex gap-4 text-[10px] font-black uppercase">
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-600 rounded-full"></span> Doanh thu</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Chi phí</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSze: '12px', fontWeight: 800 }}
                  formatter={(v: number) => [v.toLocaleString() + ' đ']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between h-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={80}/></div>
            <div className="relative z-10">
              <h4 className="text-xl font-black uppercase mb-4 flex items-center gap-2">AI Advisor <Sparkles size={20} className="text-blue-400"/></h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">Hệ thống phân tích dữ liệu phòng trọ và đưa ra chiến lược kinh doanh thông minh.</p>
              
              {aiAdvice ? (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex gap-3 mb-3 text-blue-400"><Lightbulb size={18}/> <span className="text-[10px] font-black uppercase">Đề xuất tối ưu</span></div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium italic">"{aiAdvice}"</p>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8 flex items-center justify-center h-32 text-center">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">Nhấn nút bên dưới để nhận phân tích dữ liệu</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleGetAdvice} 
              disabled={isAdviceLoading}
              className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isAdviceLoading ? 'Đang phân tích...' : 'Xem tư vấn kinh doanh'} <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Table or Summary */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 uppercase mb-8 flex items-center gap-3"><DoorOpen size={20} className="text-blue-600"/> Trạng thái lấp đầy phòng</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           {rooms.map(room => (
             <div key={room.id} className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all hover:shadow-md ${room.status === 'OCCUPIED' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                <p className={`text-[10px] font-black uppercase ${room.status === 'OCCUPIED' ? 'text-blue-600' : 'text-slate-400'}`}>{room.name}</p>
                <div className={`w-2 h-2 rounded-full ${room.status === 'OCCUPIED' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
