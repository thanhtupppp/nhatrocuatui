
import React, { useState, useMemo } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Tenant, Room } from '../types';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import { Search, Plus, Users, Phone, Shield, MapPin, Trash2, Edit3, Save, Info } from 'lucide-react';

interface TenantsViewProps {
  tenants: Tenant[];
  rooms: Room[];
}

const TenantsView: React.FC<TenantsViewProps> = ({ tenants, rooms }) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  const [form, setForm] = useState({ 
    name: '', phone: '', idCard: '', hometown: '', 
    startDate: new Date().toISOString().split('T')[0] 
  });

  const filtered = useMemo(() => {
    return tenants.filter(t => 
      t.name.toLowerCase().includes(search.toLowerCase()) || 
      t.phone.includes(search) ||
      t.idCard.includes(search)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants, search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await updateDoc(doc(db, 'tenants', editingTenant.id), form);
      } else {
        await addDoc(collection(db, 'tenants'), { ...form, createdAt: Timestamp.now() });
      }
      setIsModalOpen(false);
      setEditingTenant(null);
      setForm({ name: '', phone: '', idCard: '', hometown: '', startDate: new Date().toISOString().split('T')[0] });
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (tenant.roomId) {
      alert("Khách hàng đang thuê phòng. Vui lòng trả phòng trước khi xóa hồ sơ.");
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa hồ sơ khách hàng ${tenant.name}?`)) {
      try {
        await deleteDoc(doc(db, 'tenants', tenant.id));
      } catch (err: any) { alert(err.message); }
    }
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setForm({ 
      name: tenant.name, 
      phone: tenant.phone, 
      idCard: tenant.idCard, 
      hometown: tenant.hometown,
      startDate: tenant.startDate || new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" placeholder="Tìm tên, SĐT hoặc CCCD..." 
            className="bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 w-full text-sm font-bold focus:ring-2 ring-blue-500" 
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingTenant(null); setIsModalOpen(true); }}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          <Plus size={18}/> Đăng ký khách mới
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="Danh sách trống" 
          description="Chưa có hồ sơ khách thuê nào. Đăng ký khách mới để bắt đầu quản lý." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(t => {
            const currentRoom = rooms.find(r => r.id === t.roomId);
            return (
              <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl uppercase">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase truncate max-w-[150px]">{t.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.roomId ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        {currentRoom ? `Phòng ${currentRoom.name}` : 'Danh sách chờ'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-colors">
                    <Phone size={14}/> <span className="text-xs font-bold">{t.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Shield size={14}/> <span className="text-xs font-bold">{t.idCard}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={14}/> <span className="text-xs font-bold">{t.hometown}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => openEditModal(t)}
                    className="flex-1 bg-slate-50 text-slate-500 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all font-black text-[10px] uppercase flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16}/> Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(t)}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTenant(null); }} title={editingTenant ? "Cập nhật hồ sơ" : "Đăng ký khách mới"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Họ và tên khách</label>
            <input type="text" placeholder="Nguyễn Văn A" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 ring-blue-500"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số điện thoại</label>
              <input type="tel" placeholder="090..." required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 ring-blue-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số CCCD / CMND</label>
              <input type="text" placeholder="079..." required value={form.idCard} onChange={e => setForm({...form, idCard: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 ring-blue-500"/>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Quê quán</label>
            <input type="text" placeholder="TP. Hồ Chí Minh" value={form.hometown} onChange={e => setForm({...form, hometown: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 ring-blue-500"/>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all">
            <Save size={20}/> {editingTenant ? "Lưu thay đổi" : "Hoàn tất đăng ký"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TenantsView;
