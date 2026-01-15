
import React, { useState, useMemo } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types';
import Modal from '../components/UI/Modal';
import { Wallet, Search, Filter, Calendar, Tag, Plus, Edit3, Trash2, PieChart, ArrowRight, Save } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses }) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<Omit<Expense, 'id' | 'createdAt'>>({
    title: '', amount: 0, category: 'Khác', date: new Date().toISOString().split('T')[0], description: ''
  });

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || e.category === categoryFilter;
      const matchesStart = !dateStart || e.date >= dateStart;
      const matchesEnd = !dateEnd || e.date <= dateEnd;
      return matchesSearch && matchesCat && matchesStart && matchesEnd;
    });
  }, [expenses, search, categoryFilter, dateStart, dateEnd]);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><Wallet size={24} /></div>
            <div>
              <h4 className="text-lg font-black text-slate-800 uppercase">Sổ chi tiêu</h4>
              <p className="text-xs font-bold text-slate-400 uppercase">Tổng lọc: {filtered.reduce((a,c) => a+c.amount, 0).toLocaleString()} đ</p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-3">
            <Plus size={18}/> Thêm khoản chi
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
           <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input type="text" placeholder="Tìm..." className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 w-full text-sm font-bold" value={search} onChange={(e) => setSearch(e.target.value)}/></div>
           <select className="bg-slate-50 border-none rounded-xl px-4 py-3 w-full text-sm font-bold" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
             <option value="ALL">Tất cả danh mục</option>
             <option value="Sửa chữa">Sửa chữa</option>
             <option value="Tiện ích">Tiện ích</option>
             <option value="Khác">Khác</option>
           </select>
           <input type="date" className="bg-slate-50 border-none rounded-xl px-4 py-3 w-full text-sm font-bold" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
           <input type="date" className="bg-slate-50 border-none rounded-xl px-4 py-3 w-full text-sm font-bold" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200"><PieChart size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-xs font-black uppercase text-slate-300">Trống trải...</p></div>
        ) : (
          filtered.map(exp => (
            <div key={exp.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-600`}>
                <Tag size={20}/>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-lg font-black text-slate-900 uppercase">{exp.title}</h4>
                <div className="flex justify-center md:justify-start gap-4 text-[10px] font-bold text-slate-400 uppercase mt-1">
                  <span>{new Date(exp.date).toLocaleDateString('vi-VN')}</span>
                  <span>{exp.category}</span>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-red-600">-{exp.amount.toLocaleString()} đ</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingExpense(exp); setForm({ ...exp }); setIsModalOpen(true); }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"><Edit3 size={18}/></button>
                <button onClick={async () => { if(confirm("Xóa?")) await deleteDoc(doc(db, 'expenses', exp.id)) }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense ? "Sửa khoản chi" : "Thêm khoản chi"}>
        <form onSubmit={handleSave} className="space-y-6">
          <input type="text" placeholder="Tên khoản chi" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold"/>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Số tiền" required value={form.amount} onChange={e => setForm({...form, amount: parseInt(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-red-600"/>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold">
              <option value="Sửa chữa">Sửa chữa</option>
              <option value="Tiện ích">Tiện ích</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold"/>
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-2"><Save size={20}/> Lưu thông tin chi phí</button>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesView;
