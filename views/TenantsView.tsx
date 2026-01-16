
import React, { useState, useMemo } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Tenant, Room } from '../types';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import { ImageUpload } from '../components/UI/ImageUpload';
import { Search, Plus, Users, Phone, Shield, MapPin, Trash2, Edit3, Save, Calendar, User, Heart, Mail, Eye, Briefcase, Car, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

interface TenantsViewProps {
  tenants: Tenant[];
  rooms: Room[];
}

interface TenantForm {
  name: string;
  phone: string;
  email: string;
  idCard: string;
  idCardFrontImage: string;
  idCardBackImage: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | '';
  hometown: string;
  currentAddress: string;
  occupation: string;
  licensePlate: string;
  vehicleType: string;
  emergencyContact: string;
  emergencyName: string;
  startDate: string;
  notes: string;
}

const emptyForm: TenantForm = {
  name: '',
  phone: '',
  email: '',
  idCard: '',
  idCardFrontImage: '',
  idCardBackImage: '',
  dateOfBirth: '',
  gender: '',
  hometown: '',
  currentAddress: '',
  occupation: '',
  licensePlate: '',
  vehicleType: '',
  emergencyContact: '',
  emergencyName: '',
  startDate: new Date().toISOString().split('T')[0],
  notes: ''
};

const TenantsView: React.FC<TenantsViewProps> = ({ tenants, rooms }) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantForm>(emptyForm);

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
      const dataToSave = {
        ...form,
        gender: form.gender || undefined
      };
      
      if (editingTenant) {
        await updateDoc(doc(db, 'tenants', editingTenant.id), dataToSave);
      } else {
        await addDoc(collection(db, 'tenants'), { ...dataToSave, createdAt: Timestamp.now() });
      }
      setIsModalOpen(false);
      setEditingTenant(null);
      setForm(emptyForm);
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
      email: tenant.email || '',
      idCard: tenant.idCard,
      idCardFrontImage: tenant.idCardFrontImage || '',
      idCardBackImage: tenant.idCardBackImage || '',
      dateOfBirth: tenant.dateOfBirth || '',
      gender: tenant.gender || '',
      hometown: tenant.hometown,
      currentAddress: tenant.currentAddress || '',
      occupation: tenant.occupation || '',
      licensePlate: tenant.licensePlate || '',
      vehicleType: tenant.vehicleType || '',
      emergencyContact: tenant.emergencyContact || '',
      emergencyName: tenant.emergencyName || '',
      startDate: tenant.startDate || new Date().toISOString().split('T')[0],
      notes: tenant.notes || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative flex-1 md:w-64 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" placeholder="Tìm tên, SĐT hoặc CCCD..." 
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-6 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => { setEditingTenant(null); setForm(emptyForm); setIsModalOpen(true); }}
          className="w-full md:w-auto"
          icon={Plus}
        >
          Đăng ký khách mới
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="Danh sách trống" 
          description="Chưa có hồ sơ khách thuê nào. Đăng ký khách mới để bắt đầu quản lý." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filtered.map(t => {
            const currentRoom = rooms.find(r => r.id === t.roomId);
            return (
              <Card key={t.id} className="!p-6 flex flex-col group relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl uppercase shadow-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 uppercase truncate max-w-[150px] group-hover:text-indigo-600 transition-colors">{t.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${t.roomId ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {currentRoom ? `Phòng ${currentRoom.name}` : 'Danh sách chờ'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-slate-500 hover:text-indigo-600 transition-colors">
                    <Phone size={16}/> <span className="text-sm font-medium">{t.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Shield size={16}/> <span className="text-sm font-medium">{t.idCard}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={16}/> <span className="text-sm font-medium">{t.hometown}</span>
                  </div>
                  {t.idCardFrontImage && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Đã có ảnh CCCD
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-2">
                  <Button 
                    onClick={() => setViewingTenant(t)}
                    variant="ghost"
                    className="!py-2.5 rounded-lg text-xs"
                  >
                    <Eye size={16}/>
                  </Button>
                  <Button 
                    onClick={() => openEditModal(t)}
                    variant="secondary"
                    className="flex-1 !py-2.5 rounded-lg text-xs"
                    icon={Edit3}
                  >
                    Sửa
                  </Button>
                  <Button 
                    onClick={() => handleDelete(t)}
                    variant="ghost"
                    className="!py-2.5 rounded-lg hover:!bg-rose-50 hover:!text-rose-600"
                  >
                    <Trash2 size={18}/>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTenant(null); }} title={editingTenant ? "Cập nhật hồ sơ" : "Đăng ký khách mới"}>
        <form onSubmit={handleSave} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> Thông tin cơ bản
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Họ và tên khách *</label>
              <input type="text" placeholder="Nguyễn Văn A" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số điện thoại *</label>
                <input type="tel" placeholder="090..." required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</label>
                <input type="email" placeholder="email@..." value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày sinh</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Giới tính</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as 'male' | 'female' | ''})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500">
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
            </div>
          </div>

          {/* CCCD Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Shield size={16} className="text-indigo-500" /> Thông tin CCCD
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số CCCD / CMND *</label>
              <input type="text" placeholder="079..." required value={form.idCard} onChange={e => setForm({...form, idCard: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageUpload
                label="Ảnh mặt trước CCCD"
                value={form.idCardFrontImage}
                onChange={(base64) => setForm({...form, idCardFrontImage: base64})}
                onClear={() => setForm({...form, idCardFrontImage: ''})}
              />
              <ImageUpload
                label="Ảnh mặt sau CCCD"
                value={form.idCardBackImage}
                onChange={(base64) => setForm({...form, idCardBackImage: base64})}
                onClear={() => setForm({...form, idCardBackImage: ''})}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-500" /> Địa chỉ
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Quê quán</label>
              <input type="text" placeholder="TP. Hồ Chí Minh" value={form.hometown} onChange={e => setForm({...form, hometown: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Địa chỉ thường trú</label>
              <input type="text" placeholder="123 Nguyễn Văn Linh, Q.7" value={form.currentAddress} onChange={e => setForm({...form, currentAddress: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nghề nghiệp</label>
              <input type="text" placeholder="Nhân viên văn phòng..." value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
            </div>
          </div>

          {/* Vehicle Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Car size={16} className="text-indigo-500" /> Thông tin phương tiện
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Loại xe</label>
                <input type="text" placeholder="Honda Vision..." value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Biển số xe</label>
                <input type="text" placeholder="59-X1 12345..." value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Heart size={16} className="text-rose-500" /> Liên hệ khẩn cấp
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tên người thân</label>
                <input type="text" placeholder="Nguyễn Văn B" value={form.emergencyName} onChange={e => setForm({...form, emergencyName: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">SĐT người thân</label>
                <input type="tel" placeholder="090..." value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
              </div>
            </div>
          </div>

          {/* Rental Info */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> Thông tin thuê
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày bắt đầu thuê</label>
              <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ghi chú</label>
              <textarea placeholder="Ví dụ: Khách ở sạch sẽ, hay đi làm về muộn..." rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-indigo-500 resize-none"/>
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all">
            <Save size={20}/> {editingTenant ? "Lưu thay đổi" : "Hoàn tất đăng ký"}
          </button>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={!!viewingTenant} onClose={() => setViewingTenant(null)} title="Chi tiết khách thuê">
        {viewingTenant && (
          <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 pb-4">
            {/* Header */}
            <div className="flex items-center gap-5 p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-indigo-50">
                {viewingTenant.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900 truncate uppercase tracking-tight">{viewingTenant.name}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-full">
                    {viewingTenant.gender === 'male' ? 'Nam' : viewingTenant.gender === 'female' ? 'Nữ' : 'Chưa xác định'}
                  </span>
                  {rooms.find(r => r.id === viewingTenant.roomId) && (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">
                      Phòng {rooms.find(r => r.id === viewingTenant.roomId)?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-1">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><Phone size={12} className="text-indigo-400"/> Số điện thoại</p>
                <p className="text-sm font-bold text-slate-700">{viewingTenant.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><Mail size={12} className="text-indigo-400"/> Email</p>
                <p className="text-sm font-bold text-slate-700">{viewingTenant.email || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><Shield size={12} className="text-indigo-400"/> Số CCCD / CMND</p>
                <p className="text-sm font-bold text-slate-700 line-clamp-1">{viewingTenant.idCard}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400"/> Ngày sinh</p>
                <p className="text-sm font-bold text-slate-700">{viewingTenant.dateOfBirth || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><Briefcase size={12} className="text-indigo-400"/> Nghề nghiệp</p>
                <p className="text-sm font-bold text-slate-700">{viewingTenant.occupation || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400"/> Ngày bắt đầu thuê</p>
                <p className="text-sm font-bold text-slate-700">{viewingTenant.startDate ? formatDate(viewingTenant.startDate) : 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><MapPin size={12} className="text-indigo-400"/> Quê quán</p>
                <p className="text-sm font-bold text-slate-700">{viewingTenant.hometown || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1 pt-3 border-t border-slate-200/50">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5"><MapPin size={12} className="text-indigo-400"/> Địa chỉ thường trú</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">{viewingTenant.currentAddress || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Vehicle Info */}
            {(viewingTenant.vehicleType || viewingTenant.licensePlate) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl shadow-sm">
                <div className="space-y-1">
                  <p className="text-[10px] text-indigo-400 font-black uppercase flex items-center gap-1.5"><Car size={12}/> Loại xe</p>
                  <p className="text-sm font-bold text-indigo-900">{viewingTenant.vehicleType || 'Chưa cập nhật'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-indigo-400 font-black uppercase flex items-center gap-1.5"><Car size={12}/> Biển số xe</p>
                  <p className="text-sm font-bold text-indigo-900 uppercase">{viewingTenant.licensePlate || 'Chưa cập nhật'}</p>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {(viewingTenant.emergencyName || viewingTenant.emergencyContact) && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm">
                <p className="text-[10px] text-rose-400 font-black uppercase flex items-center gap-1.5 mb-2"><Heart size={12}/> Liên hệ khẩn cấp</p>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-rose-900">{viewingTenant.emergencyName || 'Chưa cập nhật'}</p>
                  <p className="text-sm font-bold text-rose-600">{viewingTenant.emergencyContact}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {viewingTenant.notes && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
                <p className="text-[10px] text-amber-500 font-black uppercase flex items-center gap-1.5 mb-2"><FileText size={12}/> Ghi chú</p>
                <p className="text-sm font-medium text-amber-800 leading-relaxed whitespace-pre-wrap">{viewingTenant.notes}</p>
              </div>
            )}

            {/* CCCD Images - Enhanced Size */}
            {(viewingTenant.idCardFrontImage || viewingTenant.idCardBackImage) && (
              <div className="space-y-4 pt-2">
                <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1.5 px-1"><Shield size={12} className="text-indigo-400"/> Hình ảnh CCCD</p>
                <div className="grid grid-cols-1 gap-4">
                  {viewingTenant.idCardFrontImage && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-black uppercase text-center">--- Mặt trước ---</p>
                      <div className="relative group overflow-hidden rounded-2xl border-2 border-slate-100 shadow-lg">
                        <img src={viewingTenant.idCardFrontImage} alt="CCCD Front" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"/>
                      </div>
                    </div>
                  )}
                  {viewingTenant.idCardBackImage && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-black uppercase text-center pt-2">--- Mặt sau ---</p>
                      <div className="relative group overflow-hidden rounded-2xl border-2 border-slate-100 shadow-lg">
                        <img src={viewingTenant.idCardBackImage} alt="CCCD Back" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"/>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TenantsView;
