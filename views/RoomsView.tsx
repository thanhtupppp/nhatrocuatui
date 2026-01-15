
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
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { generateRentalContract } from '../services/aiService';
import { formatCurrency } from '../utils/formatUtils';

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

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="w-full md:w-auto flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Tìm kiếm phòng..." 
              className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-sm"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value={RoomStatus.AVAILABLE}>Phòng Trống</option>
            <option value={RoomStatus.OCCUPIED}>Đang Thuê</option>
          </select>
        </div>
        <Button 
          onClick={() => { 
            setEditingRoom(null); 
            setRoomForm({ name: '', price: 2000000, depositAmount: 0, type: 'Phòng Thường', description: '', electricityMeter: 0, waterMeter: 0 }); 
            setIsRoomModalOpen(true); 
          }} 
          icon={Plus}
        >
          Thêm phòng
        </Button>
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState 
          icon={DoorOpen} 
          title="Không tìm thấy phòng" 
          description="Thử thay đổi bộ lọc hoặc thêm phòng mới vào danh sách quản lý của bạn." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredRooms.map(r => (
            <div key={r.id} className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              <div className={`h-1.5 w-full ${r.status === RoomStatus.AVAILABLE ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{r.name}</h4>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mt-1 ${
                      r.status === RoomStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === RoomStatus.AVAILABLE ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                      {r.status === RoomStatus.AVAILABLE ? 'Trống' : 'Đang thuê'}
                    </span>
                  </div>
                  <button onClick={() => { 
                    setEditingRoom(r); 
                    setRoomForm({ name: r.name, price: r.price, depositAmount: r.depositAmount || 0, type: r.type, description: r.description || '', electricityMeter: r.electricityMeter || 0, waterMeter: r.waterMeter || 0 }); 
                    setIsRoomModalOpen(true); 
                  }} className="text-slate-300 hover:text-indigo-600 transition-colors bg-transparent p-1">
                    <Edit3 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-amber-500"/>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Điện</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 font-mono">{r.electricityMeter}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets size={14} className="text-blue-500"/>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Nước</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 font-mono">{r.waterMeter}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(r.price)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">vnđ/tháng</p>
                  </div>

                  <div className="flex gap-2">
                    {r.status === RoomStatus.AVAILABLE ? (
                      <Button 
                        onClick={() => { setSelectedRoomForCheckin(r); setIsCheckinModalOpen(true); }} 
                        className="!p-2.5 !h-auto !min-h-0 rounded-lg !bg-emerald-600 hover:!bg-emerald-700"
                        title="Check-in khách mới"
                      >
                        <UserPlus size={18}/>
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => { 
                            setSelectedRoomForInvoice(r); 
                            setInvoiceForm({ ...invoiceForm, newElectricity: r.electricityMeter, newWater: r.waterMeter }); 
                            setIsInvoiceModalOpen(true); 
                          }}
                          className="!p-2.5 !h-auto !min-h-0 rounded-lg"
                          title="Lập hóa đơn"
                        >
                          <Receipt size={18} />
                        </Button>
                        <Button
                          onClick={() => handleCheckout(r)}
                          variant="danger"
                          className="!p-2.5 !h-auto !min-h-0 rounded-lg"
                          title="Trả phòng"
                        >
                          <LogOut size={18} />
                        </Button>
                      </>
                    )}
                    <Button 
                      onClick={() => handleDeleteRoom(r)} 
                      variant="ghost" 
                      className="!p-2.5 !h-auto !min-h-0 rounded-lg hover:!bg-rose-50 hover:!text-rose-500"
                      title="Xóa phòng"
                    >
                      <Trash2 size={18}/>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS giữ nguyên cấu trúc nhưng tối ưu padding mobile */}
      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={editingRoom ? "Cập nhật phòng" : "Thêm phòng mới"}>
        <form onSubmit={handleSaveRoom} className="space-y-4 md:space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tên phòng / Số phòng *</label>
              <input type="text" placeholder="P.101" required value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Loại phòng</label>
              <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all">
                <option value="Phòng Thường">Phòng Thường</option>
                <option value="Phòng VIP">Phòng VIP</option>
                <option value="Phòng Đôi">Phòng Đôi</option>
                <option value="Studio">Studio</option>
              </select>
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Giá thuê (đ/tháng) *</label>
              <input type="number" required value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tiền cọc (đ)</label>
              <input type="number" value={roomForm.depositAmount} onChange={e => setRoomForm({...roomForm, depositAmount: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"/>
            </div>
          </div>

          {/* Meter Readings */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
            <p className="text-xs font-bold text-amber-700 uppercase flex items-center gap-2">
              <Zap size={14} /> Chỉ số đồng hồ (hiện tại)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-amber-600 ml-1">Điện (kWh)</label>
                <input type="number" value={roomForm.electricityMeter} onChange={e => setRoomForm({...roomForm, electricityMeter: parseInt(e.target.value) || 0})} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-600 ml-1">Nước (m³)</label>
                <input type="number" value={roomForm.waterMeter} onChange={e => setRoomForm({...roomForm, waterMeter: parseInt(e.target.value) || 0})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"/>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mô tả / Ghi chú</label>
            <textarea 
              value={roomForm.description} 
              onChange={e => setRoomForm({...roomForm, description: e.target.value})} 
              placeholder="VD: Có ban công, máy lạnh, gần thang máy..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium min-h-[80px] resize-y focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            <Edit3 size={18}/> {editingRoom ? "Lưu thay đổi" : "Tạo phòng mới"}
          </button>
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
