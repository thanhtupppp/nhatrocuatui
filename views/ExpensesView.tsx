import React, { useState, useMemo } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types';
import { Wallet, Search, Plus, Edit3, Trash2, TrendingUp, FileText, Save } from 'lucide-react';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

interface ExpensesViewProps {
  expenses: Expense[];
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses }) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<Omit<Expense, 'id' | 'createdAt'>>({
    title: '', amount: 0, category: 'Khác', date: new Date().toISOString().split('T')[0], description: ''
  });

  const filtered = useMemo(() => {
    return expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) await updateDoc(doc(db, 'expenses', editingExpense.id), form);
      else await addDoc(collection(db, 'expenses'), { ...form, createdAt: Timestamp.now() });
      setIsModalOpen(false);
      setEditingExpense(null);
      setForm({ title: '', amount: 0, category: 'Khác', date: new Date().toISOString().split('T')[0], description: '' });
    } catch (err: any) { alert(err.message); }
  };

  const currentMonthTotal = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" placeholder="Tìm kiếm khoản chi..." 
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-6 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Card className="!p-4 bg-rose-50 !border-rose-100 flex items-center gap-3">
            <TrendingUp size={20} className="text-rose-600"/>
            <span className="text-xs font-bold text-rose-800 uppercase">
              Tổng chi tháng này: {currentMonthTotal.toLocaleString()} đ
            </span>
        </Card>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="w-full md:w-auto">
          Ghi chép chi tiêu
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon={Wallet} 
          title="Sổ chi tiêu trống" 
          description="Ghi lại các khoản chi phí vận hành để quản lý tài chính hiệu quả hơn." 
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
                  <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-md">
                    {new Date(expense.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">{expense.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{expense.description || expense.category}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-xl font-black text-rose-600">{expense.amount.toLocaleString()} đ</span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => { setEditingExpense(expense); setForm({ ...expense }); setIsModalOpen(true); }}
                    variant="ghost"
                    className="!p-2 hover:!bg-blue-50 hover:!text-blue-600 h-auto"
                  >
                    <Edit3 size={18} />
                  </Button>
                  <Button 
                    onClick={async () => { if(confirm("Xóa khoản chi này?")) await deleteDoc(doc(db, 'expenses', expense.id)) }}
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingExpense(null); }} title={editingExpense ? "Cập nhật khoản chi" : "Ghi chép khoản chi mới"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tên khoản chi</label>
            <input type="text" required placeholder="Ví dụ: Sửa bóng đèn" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-blue-500"/>
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
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày chi</label>
              <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-blue-500"/>
            </div>
          </div>
           <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Danh mục</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-blue-500">
              <option value="Sửa chữa">Sửa chữa</option>
              <option value="Tiện ích">Tiện ích</option>
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
