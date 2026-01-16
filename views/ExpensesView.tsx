
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { 
  Wallet, Search, Plus, Edit3, Trash2, 
  TrendingUp, FileText, Save 
} from 'lucide-react';

// Components & Services
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { saveExpense, removeExpense } from '../services/expenseService';

// Utils
import { getCurrentPeriod, getPreviousPeriod, formatPeriod } from '../utils/dateUtils';
import { formatCurrency, toNum } from '../utils/financialUtils';

interface ExpensesViewProps {
  expenses: Expense[];
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses }) => {
  const current = getCurrentPeriod();
  const def = getPreviousPeriod(current.month, current.year);
  const [selectedMonth, setSelectedMonth] = useState(def.month);
  const [selectedYear, setSelectedYear] = useState(def.year);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [form, setForm] = useState<Partial<Expense>>({
    title: '', 
    amount: 0, 
    category: 'Khác', 
    date: new Date().toISOString().split('T')[0], 
    month: current.month,
    year: current.year,
    description: ''
  });

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
      const eMonth = e.month || (new Date(e.date).getMonth() + 1);
      const eYear = e.year || new Date(e.date).getFullYear();
      const matchesPeriod = Number(eMonth) === selectedMonth && Number(eYear) === selectedYear;
      return matchesSearch && matchesPeriod;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, search, selectedMonth, selectedYear]);

  const totalPeriod = useMemo(() => 
    filtered.reduce((sum, e) => sum + toNum(e.amount), 0), 
  [filtered]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setForm({
      title: '', amount: 0, category: 'Khác', 
      date: new Date().toISOString().split('T')[0], 
      month: selectedMonth, year: selectedYear, description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({ ...expense });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveExpense(form, editingExpense?.id);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khoản chi này?")) return;
    try {
      await removeExpense(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" placeholder="Tìm kiếm khoản chi..." 
              className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-6 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm shrink-0">
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(Number(e.target.value))}
               className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
             >
               {Array.from({ length: 12 }, (_, i) => (
                 <option key={i + 1} value={i + 1}>Kỳ T{i + 1}</option>
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
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <Card className="!p-4 bg-rose-50 !border-rose-100 flex items-center gap-3 shrink-0">
              <TrendingUp size={20} className="text-rose-600"/>
              <span className="text-xs font-bold text-rose-800 uppercase">
                Tổng chi {formatPeriod(selectedMonth, selectedYear)}: {formatCurrency(totalPeriod)}
              </span>
          </Card>
          <Button onClick={handleOpenAdd} icon={Plus} className="flex-1 md:flex-none">
            Ghi chép chi tiêu
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      {filtered.length === 0 ? (
        <EmptyState 
          icon={Wallet} 
          title={`Không có chi phí ${formatPeriod(selectedMonth, selectedYear)}`}
          description="Bạn chưa ghi nhận khoản chi phí vận hành nào cho kỳ hạch toán này."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filtered.map(expense => (
            <Card key={expense.id} className="!p-6 flex flex-col justify-between group hover:shadow-lg transition-all border-l-4 !border-l-rose-500">
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                    <FileText size={20} />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-slate-400 uppercase">
                      Kỳ {formatPeriod(expense.month || (new Date(expense.date).getMonth() + 1), expense.year || new Date(expense.date).getFullYear())}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">
                      Ngày chi: {new Date(expense.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">{expense.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{expense.description || expense.category}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-xl font-black text-rose-600">{formatCurrency(expense.amount)}</span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleOpenEdit(expense)}
                    variant="ghost"
                    className="!p-2 hover:!bg-blue-50 hover:!text-blue-600 h-auto"
                  >
                    <Edit3 size={18} />
                  </Button>
                  <Button 
                    onClick={() => handleDelete(expense.id)}
                    variant="ghost"
                    className="!p-2 hover:!bg-rose-50 hover:!text-rose-600 h-auto"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Entry Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingExpense ? "Cập nhật khoản chi" : "Ghi chép khoản chi mới"}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Kỳ hạch toán (Dành cho thống kê lời lãi)</label>
            <div className="grid grid-cols-2 gap-4">
               <select value={form.month} onChange={e => setForm({...form, month: Number(e.target.value)})} className="bg-slate-50 border-none rounded-xl px-4 py-3 font-bold">
                 {Array.from({ length: 12 }, (_, i) => (
                   <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                 ))}
               </select>
               <select value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} className="bg-slate-50 border-none rounded-xl px-4 py-3 font-bold">
                 {[2023, 2024, 2025, 2026].map(y => (
                   <option key={y} value={y}>Năm {y}</option>
                 ))}
               </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tên khoản chi</label>
            <input type="text" required placeholder="Ví dụ: Điện Tổng Khu - T12" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-blue-500"/>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mô tả chi tiết</label>
            <input type="text" placeholder="Ghi chú thêm..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-blue-500"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số tiền</label>
              <input type="number" required value={form.amount} onChange={e => setForm({...form, amount: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-rose-600 focus:ring-2 ring-blue-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày thực chi</label>
              <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-blue-500"/>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Danh mục</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-blue-500">
              <option value="Điện">Điện (Hóa đơn tổng)</option>
              <option value="Nước">Nước (Hóa đơn tổng)</option>
              <option value="Wifi + Rác">Wifi + Rác</option>
              <option value="Chi Phí Mặt Bằng">Chi Phí Mặt Bằng</option>
              <option value="Sửa chữa">Sửa chữa</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <Button type="submit" className="w-full !bg-rose-600 hover:!bg-rose-700 !shadow-lg">
            <Save size={18} className="mr-2"/> Lưu khoản chi
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesView;
