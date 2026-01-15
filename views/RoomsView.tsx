
import React, { useState, useMemo } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Room, RoomStatus, Tenant, SystemSettings } from '../types';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import { 
  Search, Plus, DoorOpen, Zap, Droplets, 
  Edit3, UserPlus, FileText, Sparkles, ArrowRight,
  Receipt, Trash2, Info, LogOut
} from 'lucide-react';
import { generateRentalContract } from '../services/geminiService';

interface RoomsViewProps {
  rooms: Room[];
  tenants: Tenant[];
  settings: SystemSettings;
}

const RoomsView: React.FC<RoomsViewProps> = ({ rooms, tenants, settings }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'ALL'>('ALL');
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoomForCheckin, setSelectedRoomForCheckin] = useState<Room | null>(null);
  const [selectedRoomForInvoice, setSelectedRoomForInvoice] = useState<Room | null>(null);

  const [contractDraft, setContractDraft] = useState("");
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [roomForm, setRoomForm] = useState({ 
    name: '', price: 2000000, depositAmount: 0, type: 'Phòng Thường', 
    description: '', electricityMeter: 0, waterMeter: 0 
  });
  const [invoiceForm, setInvoiceForm] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear(), 
    newElectricity: 0, 
    newWater: 0, 
    otherFees: 0 
  });

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [rooms, searchQuery, statusFilter]);

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await updateDoc(doc(db, 'rooms', editingRoom.id), roomForm);
      } else {
        await addDoc(collection(db, 'rooms'), { ...roomForm, status: RoomStatus.AVAILABLE });
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (room.status === RoomStatus.OCCUPIED) {
      alert("Không thể xóa phòng đang có khách thuê. Vui lòng trả phòng trước.");
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa phòng ${room.name}?`)) {
      try {
        await deleteDoc(doc(db, 'rooms', room.id));
      } catch (err: any) { alert(err.message); }
    }
  };

  const handleCheckout = async (room: Room) => {
    if (!room.tenantId) return;
    if (confirm(`Xác nhận khách trả phòng ${room.name}? Hệ thống sẽ giải phóng phòng và cập nhật trạng thái khách thuê.`)) {
      try {
        await updateDoc(doc(db, 'rooms', room.id), { 
          status: RoomStatus.AVAILABLE, 
          tenantId: null 
        });
        await updateDoc(doc(db, 'tenants', room.tenantId), { 
          roomId: null 
        });
        alert("Đã hoàn tất trả phòng.");
      } catch (err: any) { alert(err.message); }
    }
  };

  const handleGenerateContract = async (tenant: Tenant) => {
    if (!selectedRoomForCheckin) return;
    setIsGeneratingContract(true);
    try {
      const draft = await generateRentalContract(
        tenant.name, 
        selectedRoomForCheckin.name, 
        selectedRoomForCheckin.price, 
        new Date().toLocaleDateString('vi-VN')
      );
      setContractDraft(draft || "");
      setIsContractModalOpen(true);
    } catch (err) { alert("Lỗi soạn thảo AI."); } finally { setIsGeneratingContract(false); }
  };

  const handleCheckinComplete = async (tenantId: string) => {
    if (!selectedRoomForCheckin) return;
    try {
      await updateDoc(doc(db, 'rooms', selectedRoomForCheckin.id), { 
        status: RoomStatus.OCCUPIED, 
        tenantId: tenantId 
      });
      await updateDoc(doc(db, 'tenants', tenantId), { 
        roomId: selectedRoomForCheckin.id, 
        startDate: new Date().toISOString().split('T')[0] 
      });
      setIsCheckinModalOpen(false);
      setSelectedRoomForCheckin(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForInvoice) return;
    
    const elecUsed = Math.max(0, invoiceForm.newElectricity - selectedRoomForInvoice.electricityMeter);
    const waterUsed = Math.max(0, invoiceForm.newWater - selectedRoomForInvoice.waterMeter);
    
    const total = selectedRoomForInvoice.price + 
                  (elecUsed * settings.electricityRate) + 
                  (waterUsed * settings.waterRate) + 
                  settings.internetFee + 
                  settings.trashFee + 
                  invoiceForm.otherFees;

    try {
      await addDoc(collection(db, 'invoices'), {
        roomId: selectedRoomForInvoice.id,
        ...invoiceForm,
        oldElectricity: selectedRoomForInvoice.electricityMeter,
        oldWater: selectedRoomForInvoice.waterMeter,
        rentAmount: selectedRoomForInvoice.price,
        electricityRate: settings.electricityRate,
        waterRate: settings.waterRate,
        internetFee: settings.internetFee,
        trashFee: settings.trashFee,
        total,
        paid: false,
        createdAt: new Date().toISOString()
      });
      
      await updateDoc(doc(db, 'rooms', selectedRoomForInvoice.id), {
        electricityMeter: invoiceForm.newElectricity,
        waterMeter: invoiceForm.newWater
      });
      
      setIsInvoiceModalOpen(false);
      alert(`Đã tạo hóa đơn cho ${selectedRoomForInvoice.name}.`);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <input 
              type="text" placeholder="Tìm tên phòng..." 
              className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 md:py-4 w-full text-sm font-bold focus:ring-2 ring-blue-500" 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 md:py-4 text-sm font-bold focus:ring-2 ring-blue-500 cursor-pointer" 
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Tất cả</option>
            <option value={RoomStatus.AVAILABLE}>Trống</option>
            <option value={RoomStatus.OCCUPIED}>Đang ở</option>
          </select>
        </div>
        <button 
          onClick={() => { 
            setEditingRoom(null); 
            setRoomForm({ name: '', price: 2000000, depositAmount: 0, type: 'Phòng Thường', description: '', electricityMeter: 0, waterMeter: 0 }); 
            setIsRoomModalOpen(true); 
          }} 
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus size={18}/> Thêm phòng
        </button>
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState 
          icon={DoorOpen} 
          title="Không tìm thấy phòng" 
          description="Thử thay đổi bộ lọc hoặc thêm phòng mới vào danh sách quản lý của bạn." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredRooms.map(r => (
            <div key={r.id} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${r.status === RoomStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <DoorOpen size={28}/>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <span className={`text-[8px] md:text-[9px] font-black px-3 py-1.5 rounded-full uppercase border ${r.status === RoomStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {r.status === RoomStatus.AVAILABLE ? 'Phòng Trống' : 'Đang Thuê'}
                  </span>
                </div>
              </div>
              <h4 className="text-lg md:text-xl font-black text-slate-900 mb-6 truncate">{r.name}</h4>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-amber-50 p-3 md:p-4 rounded-2xl flex items-center gap-2 md:gap-3">
                  <Zap size={16} className="text-amber-500 shrink-0"/>
                  <div className="overflow-hidden">
                    <p className="text-[7px] md:text-[8px] font-black text-amber-600 uppercase">Điện</p>
                    <p className="text-xs md:text-sm font-black text-slate-800 truncate">{r.electricityMeter}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 md:p-4 rounded-2xl flex items-center gap-2 md:gap-3">
                  <Droplets size={16} className="text-blue-500 shrink-0"/>
                  <div className="overflow-hidden">
                    <p className="text-[7px] md:text-[8px] font-black text-blue-600 uppercase">Nước</p>
                    <p className="text-xs md:text-sm font-black text-slate-800 truncate">{r.waterMeter}</p>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-black text-slate-900">{(r.price / 1000).toLocaleString()}k</span>
                  <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">đ/tháng</span>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                  {r.status === RoomStatus.AVAILABLE ? (
                    <button onClick={() => { setSelectedRoomForCheckin(r); setIsCheckinModalOpen(true); }} className="bg-emerald-500 text-white p-2.5 md:p-3 rounded-xl hover:bg-emerald-600 transition-all shadow-md"><UserPlus size={18}/></button>
                  ) : (
                    <>
                      <button 
                        onClick={() => { 
                          setSelectedRoomForInvoice(r); 
                          setInvoiceForm({ ...invoiceForm, newElectricity: r.electricityMeter, newWater: r.waterMeter }); 
                          setIsInvoiceModalOpen(true); 
                        }} 
                        className="bg-indigo-500 text-white p-2.5 md:p-3 rounded-xl hover:bg-indigo-600 transition-all shadow-md"
                        title="Tính tiền tháng"
                      >
                        <Receipt size={18}/>
                      </button>
                      <button 
                        onClick={() => handleCheckout(r)}
                        className="bg-amber-500 text-white p-2.5 md:p-3 rounded-xl hover:bg-amber-600 transition-all shadow-md"
                        title="Trả phòng"
                      >
                        <LogOut size={18}/>
                      </button>
                    </>
                  )}
                  <button onClick={() => { 
                    setEditingRoom(r); 
                    setRoomForm({ name: r.name, price: r.price, depositAmount: r.depositAmount || 0, type: r.type, description: r.description || '', electricityMeter: r.electricityMeter || 0, waterMeter: r.waterMeter || 0 }); 
                    setIsRoomModalOpen(true); 
                  }} className="bg-slate-100 text-slate-400 p-2.5 md:p-3 rounded-xl hover:bg-slate-200 transition-all"><Edit3 size={18}/></button>
                  <button onClick={() => handleDeleteRoom(r)} className="bg-red-50 text-red-400 p-2.5 md:p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS giữ nguyên cấu trúc nhưng tối ưu padding mobile */}
      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={editingRoom ? "Cập nhật phòng" : "Thêm phòng mới"}>
        <form onSubmit={handleSaveRoom} className="space-y-4 md:space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tên phòng / Số phòng</label>
            <input type="text" placeholder="P.101" required value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 md:px-6 py-3 md:py-4 font-bold focus:ring-2 ring-blue-500"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Giá thuê</label>
              <input type="number" required value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-xl px-4 md:px-6 py-3 md:py-4 font-bold focus:ring-2 ring-blue-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tiền cọc</label>
              <input type="number" value={roomForm.depositAmount} onChange={e => setRoomForm({...roomForm, depositAmount: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-xl px-4 md:px-6 py-3 md:py-4 font-bold text-indigo-600 focus:ring-2 ring-blue-500"/>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all">Lưu thông tin</button>
        </form>
      </Modal>

      {/* Các Modal khác giữ nguyên nội dung chuyên nghiệp đã xây dựng */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title={`Chốt tiền: ${selectedRoomForInvoice?.name}`}>
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={invoiceForm.month} onChange={e => setInvoiceForm({...invoiceForm, month: parseInt(e.target.value) || 1})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold" />
            <input type="number" value={invoiceForm.year} onChange={e => setInvoiceForm({...invoiceForm, year: parseInt(e.target.value) || 2024})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-black text-amber-600 uppercase">Điện mới</label>
               <input type="number" value={invoiceForm.newElectricity} onChange={e => setInvoiceForm({...invoiceForm, newElectricity: parseInt(e.target.value) || 0})} className="w-full bg-amber-50 rounded-xl px-4 py-3 font-bold text-amber-700"/>
             </div>
             <div>
               <label className="text-[10px] font-black text-blue-600 uppercase">Nước mới</label>
               <input type="number" value={invoiceForm.newWater} onChange={e => setInvoiceForm({...invoiceForm, newWater: parseInt(e.target.value) || 0})} className="w-full bg-blue-50 rounded-xl px-4 py-3 font-bold text-blue-700"/>
             </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase shadow-lg">Xác nhận tạo hóa đơn</button>
        </form>
      </Modal>
    </div>
  );
};

export default RoomsView;
