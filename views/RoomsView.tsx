
import React, { useState, useMemo } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { Room, RoomStatus, Tenant, SystemSettings, Invoice } from '../types';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import {
  Search, Plus, DoorOpen, Zap, Droplets,
  Sparkles, ArrowRight, ClipboardList, CheckSquare,
  Edit3, Users, Save, X, History, Clock
} from 'lucide-react';
import Button from '../components/UI/Button';
import { generateRentalContract } from '../services/aiService';
import { formatCurrency } from '../utils/formatUtils';
import RoomCard from '../components/Rooms/RoomCard';
import BulkMeterModal from '../components/Rooms/BulkMeterModal';
import BulkInvoiceModal from '../components/Rooms/BulkInvoiceModal';

interface RoomsViewProps {
  rooms: Room[];
  tenants: Tenant[];
  settings: SystemSettings;
  invoices: Invoice[];
}

const RoomsView: React.FC<RoomsViewProps> = ({ rooms, tenants, settings, invoices }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'ALL'>('ALL');
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBulkMeterModalOpen, setIsBulkMeterModalOpen] = useState(false);
  const [isBulkInvoiceModalOpen, setIsBulkInvoiceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoomForCheckin, setSelectedRoomForCheckin] = useState<Room | null>(null);
  const [selectedRoomForInvoice, setSelectedRoomForInvoice] = useState<Room | null>(null);
  const [selectedRoomForHistory, setSelectedRoomForHistory] = useState<Room | null>(null);

  const [bulkMeterForm, setBulkMeterForm] = useState<Record<string, { newElectricity: number, newWater: number }>>({});

  // Performance Optimization: Memoize tenants by room mapping
  const tenantsByRoom = useMemo(() => {
    const map: Record<string, Tenant[]> = {};
    tenants.forEach(t => {
      if (t.roomId) {
        if (!map[t.roomId]) map[t.roomId] = [];
        map[t.roomId].push(t);
      }
    });
    return map;
  }, [tenants]);

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

  const handleSaveRoom = async (e: React.FormEvent): Promise<void> => {
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

  const handleDeleteRoom = async (room: Room): Promise<void> => {
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

  const handleCheckout = async (room: Room): Promise<void> => {
    const tenantsInRoom = tenants.filter(t => t.roomId === room.id);
    if (confirm(`Xác nhận tất cả khách (${tenantsInRoom.length} người) trả phòng ${room.name}?`)) {
      try {
        await runTransaction(db, async (transaction) => {
          const roomRef = doc(db, 'rooms', room.id);
          
          // Clear room info
          transaction.update(roomRef, { 
            status: RoomStatus.AVAILABLE, 
            tenantId: null 
          });
          
          // Clear all tenants in this room
          tenantsInRoom.forEach(t => {
            const tenantRef = doc(db, 'tenants', t.id);
            transaction.update(tenantRef, { 
              roomId: null,
              isRepresentative: false
            });
          });
        });
        
        alert("Đã hoàn tất trả phòng cho tất cả khách.");
      } catch (err: any) { alert(err.message); }
    }
  };

  const handleGenerateContract = async (tenant: Tenant): Promise<void> => {
    if (!selectedRoomForCheckin) return;
    setIsGeneratingContract(true);
    try {
      // Import and use the standardized Vietnamese contract template
      const { generateVietnameseContract } = await import('../utils/contractTemplate');
      const draft = generateVietnameseContract({
        tenant,
        room: selectedRoomForCheckin,
        settings,
        contractDuration: 12
      });
      setContractDraft(draft);
      
      // Auto-save contract to tenant
      await updateDoc(doc(db, 'tenants', tenant.id), { contractDraft: draft });
      
      setIsContractModalOpen(true);
    } catch (err) { 
      console.error('Contract generation error:', err);
      alert("Lỗi tạo hợp đồng. Vui lòng thử lại."); 
    } finally { 
      setIsGeneratingContract(false); 
    }
  };

  const handleCheckinComplete = async (tenantId: string): Promise<void> => {
    if (!selectedRoomForCheckin) return;
    try {
      const isFirstTenant = selectedRoomForCheckin.status === RoomStatus.AVAILABLE;
      
      const tenantData: any = {
        roomId: selectedRoomForCheckin.id,
        startDate: new Date().toISOString().split('T')[0]
      };

      if (isFirstTenant) {
        tenantData.isRepresentative = true;
        await updateDoc(doc(db, 'rooms', selectedRoomForCheckin.id), { 
          status: RoomStatus.OCCUPIED, 
          tenantId: tenantId 
        });
      }

      await updateDoc(doc(db, 'tenants', tenantId), tenantData);
      
      setIsCheckinModalOpen(false);
      setSelectedRoomForCheckin(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateInvoice = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedRoomForInvoice) return;
    
    // Validation
    if (invoiceForm.newElectricity < selectedRoomForInvoice.electricityMeter) {
      alert(`Số điện mới (${invoiceForm.newElectricity}) không thể nhỏ hơn số cũ (${selectedRoomForInvoice.electricityMeter})`);
      return;
    }
    if (invoiceForm.newWater < selectedRoomForInvoice.waterMeter) {
      alert(`Số nước mới (${invoiceForm.newWater}) không thể nhỏ hơn số cũ (${selectedRoomForInvoice.waterMeter})`);
      return;
    }

    const elecUsed = invoiceForm.newElectricity - selectedRoomForInvoice.electricityMeter;
    const waterUsed = invoiceForm.newWater - selectedRoomForInvoice.waterMeter;
    
    const total = selectedRoomForInvoice.price + 
                  (elecUsed * settings.electricityRate) + 
                  (waterUsed * settings.waterRate) + 
                  settings.internetFee + 
                  settings.trashFee + 
                  invoiceForm.otherFees;

    try {
      await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(collection(db, 'invoices'));
        const roomRef = doc(db, 'rooms', selectedRoomForInvoice.id);

        transaction.set(invoiceRef, {
          roomId: selectedRoomForInvoice.id,
          ...invoiceForm,
          oldElectricity: selectedRoomForInvoice.electricityMeter,
          oldWater: selectedRoomForInvoice.waterMeter,
          rentAmount: selectedRoomForInvoice.price,
          electricityRate: settings.electricityRate,
          waterRate: settings.waterRate,
          internetFee: settings.internetFee,
          trashFee: settings.trashFee,
          electricityUsage: elecUsed,
          electricityCost: elecUsed * settings.electricityRate,
          waterUsage: waterUsed,
          waterCost: waterUsed * settings.waterRate,
          total,
          paid: false,
          createdAt: Timestamp.now()
        });
        
        transaction.update(roomRef, {
          electricityMeter: invoiceForm.newElectricity,
          waterMeter: invoiceForm.newWater,
          pendingElectricityMeter: null,
          pendingWaterMeter: null
        });
      });
      
      setIsInvoiceModalOpen(false);
      alert(`Đã tạo hóa đơn cho ${selectedRoomForInvoice.name}.`);
    } catch (err: any) { alert(err.message); }
  };

  const handleOpenBulkMeters = (): void => {
    const initialData: Record<string, { newElectricity: number, newWater: number }> = {};
    rooms.filter(r => r.status === RoomStatus.OCCUPIED).forEach(r => {
      initialData[r.id] = { 
        newElectricity: r.pendingElectricityMeter || r.electricityMeter, 
        newWater: r.pendingWaterMeter || r.waterMeter 
      };
    });
    setBulkMeterForm(initialData);
    setIsBulkMeterModalOpen(true);
  };

  const handleSaveBulkMeters = async (data: Record<string, { newElectricity: number, newWater: number }>): Promise<void> => {
    try {
      // Validation
      const invalidRooms = rooms.filter(r => r.status === RoomStatus.OCCUPIED).filter(r => {
        const entry = data[r.id];
        return entry && (entry.newElectricity < r.electricityMeter || entry.newWater < r.waterMeter);
      });

      if (invalidRooms.length > 0) {
        alert(`Lỗi: Có ${invalidRooms.length} phòng nhập chỉ số mới nhỏ hơn chỉ số cũ (${invalidRooms.map(r => r.name).join(', ')}). Vui lòng kiểm tra lại.`);
        return;
      }

      await runTransaction(db, async (transaction) => {
        Object.entries(data).map(([roomId, roomData]: [string, any]) => {
          const roomRef = doc(db, 'rooms', roomId);
          transaction.update(roomRef, {
            pendingElectricityMeter: roomData.newElectricity,
            pendingWaterMeter: roomData.newWater
          });
        });
      });
      setIsBulkMeterModalOpen(false);
      alert("Đã chốt chỉ số tạm tính. Bạn có thể tiến hành lập hóa đơn loạt.");
    } catch (err: any) { alert(err.message); }
  };

  const handleBulkInvoice = async (): Promise<void> => {
    const occupiedRooms = rooms.filter(r => r.status === RoomStatus.OCCUPIED);
    if (occupiedRooms.length === 0) {
      alert("Không có phòng nào đang thuê để lập hóa đơn.");
      return;
    }

    if (!confirm(`Xác nhận lập hóa đơn cho ${occupiedRooms.length} phòng đang thuê?`)) return;

    try {
      await runTransaction(db, async (transaction) => {
        occupiedRooms.forEach((room) => {
          const newElec = room.pendingElectricityMeter ?? room.electricityMeter;
          const newWater = room.pendingWaterMeter ?? room.waterMeter;
          
          const elecUsed = Math.max(0, newElec - room.electricityMeter);
          const waterUsed = Math.max(0, newWater - room.waterMeter);
          
          const total = room.price + 
                        (elecUsed * settings.electricityRate) + 
                        (waterUsed * settings.waterRate) + 
                        settings.internetFee + 
                        settings.trashFee;

          const invoiceRef = doc(collection(db, 'invoices'));
          const roomRef = doc(db, 'rooms', room.id);

          // 1. Create Invoice
          transaction.set(invoiceRef, {
            roomId: room.id,
            month: invoiceForm.month,
            year: invoiceForm.year,
            oldElectricity: room.electricityMeter,
            newElectricity: newElec,
            electricityRate: settings.electricityRate,
            oldWater: room.waterMeter,
            newWater: newWater,
            waterRate: settings.waterRate,
            rentAmount: room.price,
            internetFee: settings.internetFee,
            trashFee: settings.trashFee,
            otherFees: 0,
            electricityUsage: elecUsed,
            electricityCost: elecUsed * settings.electricityRate,
            waterUsage: waterUsed,
            waterCost: waterUsed * settings.waterRate,
            total,
            paid: false,
            createdAt: Timestamp.now()
          });

          // 2. Update Room Meter and clear pending
          transaction.update(roomRef, {
            electricityMeter: newElec,
            waterMeter: newWater,
            pendingElectricityMeter: null,
            pendingWaterMeter: null
          });
        });
      });

      setIsBulkInvoiceModalOpen(false);
      alert(`Đã lập hóa đơn thành công cho ${occupiedRooms.length} phòng.`);
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
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer shadow-sm"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value={RoomStatus.AVAILABLE}>Phòng Trống</option>
            <option value={RoomStatus.OCCUPIED}>Đang Thuê</option>
          </select>
        </div>
        <div className="w-full md:w-auto flex flex-wrap gap-3">
          <Button 
            onClick={handleOpenBulkMeters}
            variant="secondary"
            className="!bg-amber-50 dark:!bg-amber-900/20 !border-amber-200 dark:!border-amber-800 !text-amber-700 dark:!text-amber-500 hover:!bg-amber-100 dark:hover:!bg-amber-900/30"
            icon={ClipboardList}
          >
            Chốt chỉ số
          </Button>
          <Button 
            onClick={() => setIsBulkInvoiceModalOpen(true)}
            variant="secondary"
            className="!bg-indigo-50 dark:!bg-indigo-900/20 !border-indigo-200 dark:!border-indigo-800 !text-indigo-700 dark:!text-indigo-400 hover:!bg-indigo-100 dark:hover:!bg-indigo-900/30"
            icon={CheckSquare}
          >
            Lập hóa đơn loạt
          </Button>
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
            <RoomCard 
              key={r.id}
              room={r}
              tenants={tenantsByRoom[r.id] || []}
              onEdit={(room) => {
                setEditingRoom(room); 
                setRoomForm({ name: room.name, price: room.price, depositAmount: room.depositAmount || 0, type: room.type, description: room.description || '', electricityMeter: room.electricityMeter || 0, waterMeter: room.waterMeter || 0 }); 
                setIsRoomModalOpen(true);
              }}
              onCheckin={(room) => {
                setSelectedRoomForCheckin(room); 
                setIsCheckinModalOpen(true);
              }}
              onCheckout={handleCheckout}
              onInvoice={(room) => {
                setSelectedRoomForInvoice(room); 
                setInvoiceForm({ ...invoiceForm, newElectricity: room.electricityMeter, newWater: room.waterMeter }); 
                setIsInvoiceModalOpen(true);
              }}
              onHistory={(room) => {
                setSelectedRoomForHistory(room);
                setIsHistoryModalOpen(true);
              }}
              onContract={(room) => {
                const rep = tenantsByRoom[room.id]?.find(t => t.isRepresentative || t.id === room.tenantId);
                if (rep) {
                  setSelectedRoomForCheckin(room);
                  handleGenerateContract(rep);
                } else {
                  alert('Không tìm thấy người đại diện phòng để tạo hợp đồng.');
                }
              }}
            />
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
              <input type="text" placeholder="P.101" required value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Loại phòng</label>
              <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all">
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
              <input type="number" required value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tiền cọc (đ)</label>
              <input type="number" value={roomForm.depositAmount} onChange={e => setRoomForm({...roomForm, depositAmount: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"/>
            </div>
          </div>

          {/* Meter Readings */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl space-y-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase flex items-center gap-2">
              <Zap size={14} /> Chỉ số đồng hồ (hiện tại)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 ml-1">Điện (kWh)</label>
                <input type="number" value={roomForm.electricityMeter} onChange={e => setRoomForm({...roomForm, electricityMeter: parseInt(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/30 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-500 ml-1">Nước (m³)</label>
                <input type="number" value={roomForm.waterMeter} onChange={e => setRoomForm({...roomForm, waterMeter: parseInt(e.target.value) || 0})} className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/30 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"/>
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white min-h-[80px] resize-y focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            <Edit3 size={18}/> {editingRoom ? "Lưu thay đổi" : "Tạo phòng mới"}
          </button>
        </form>
      </Modal>

      {/* Check-in Modal */}
      <Modal 
        isOpen={isCheckinModalOpen} 
        onClose={() => { setIsCheckinModalOpen(false); setSelectedRoomForCheckin(null); }} 
        title={`Check-in: ${selectedRoomForCheckin?.name}`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
             <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Đang chọn phòng</p>
             <p className="text-lg font-black text-slate-900 uppercase">{selectedRoomForCheckin?.name}</p>
             <p className="text-[10px] text-slate-500 uppercase mt-1">
               {selectedRoomForCheckin?.status === RoomStatus.AVAILABLE ? 'Phòng đang trống' : 'Phòng đã có khách, đang thêm người'}
             </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-400 ml-1">Chọn khách thuê từ danh sách chờ</p>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {tenants.filter(t => !t.roomId).length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="mx-auto text-slate-200 mb-2"/>
                  <p className="text-sm text-slate-400 font-medium">Không có khách nào đang chờ</p>
                  <p className="text-[10px] text-slate-400 mt-1">Vui lòng đăng ký khách mới trước</p>
                </div>
              ) : (
                tenants.filter(t => !t.roomId).map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleCheckinComplete(t.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-500 hover:shadow-md rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-lg flex items-center justify-center font-bold transition-colors shadow-sm">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 uppercase group-hover:text-indigo-600 transition-colors">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{t.phone}</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"/>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
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

      <BulkMeterModal 
        isOpen={isBulkMeterModalOpen}
        onClose={() => setIsBulkMeterModalOpen(false)}
        rooms={rooms}
        initialData={bulkMeterForm}
        onSave={handleSaveBulkMeters}
      />

      <BulkInvoiceModal 
        isOpen={isBulkInvoiceModalOpen}
        onClose={() => setIsBulkInvoiceModalOpen(false)}
        occupiedRoomsCount={rooms.filter(r => r.status === RoomStatus.OCCUPIED).length}
        month={invoiceForm.month}
        year={invoiceForm.year}
        onMonthChange={(m) => setInvoiceForm({...invoiceForm, month: m})}
        onYearChange={(y) => setInvoiceForm({...invoiceForm, year: y})}
        onConfirm={handleBulkInvoice}
      />

      {/* Room History Modal */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => { setIsHistoryModalOpen(false); setSelectedRoomForHistory(null); }} 
        title={`Lịch sử chỉ số: ${selectedRoomForHistory?.name}`}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {invoices.filter(inv => inv.roomId === selectedRoomForHistory?.id).length === 0 ? (
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-slate-200 mb-4"/>
              <p className="text-slate-500 font-medium">Chưa có lịch sử hóa đơn cho phòng này</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices
                .filter(inv => inv.roomId === selectedRoomForHistory?.id)
                .sort((a, b) => {
                  if (a.year !== b.year) return b.year - a.year;
                  return b.month - a.month;
                })
                .map((inv) => (
                  <div key={inv.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-white px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-black text-indigo-600 uppercase">Tháng {inv.month}/{inv.year}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${inv.paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {inv.paid ? 'Đã thu' : 'Chưa thu'}
                      </span>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      {/* Electricity Detail */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Zap size={12} className="text-amber-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Điện (kWh)</span>
                        </div>
                        <div className="flex items-baseline justify-between bg-white/50 p-2 rounded-lg border border-slate-100">
                          <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Cũ</p>
                            <p className="text-xs font-bold text-slate-600">{inv.oldElectricity}</p>
                          </div>
                          <div className="h-4 w-px bg-slate-200 self-center"></div>
                          <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Mới</p>
                            <p className="text-xs font-bold text-slate-900">{inv.newElectricity}</p>
                          </div>
                          <div className="h-4 w-px bg-slate-200 self-center"></div>
                          <div className="text-center">
                            <p className="text-[8px] text-amber-500 font-bold uppercase">Dùng</p>
                            <p className="text-xs font-black text-amber-600">
                              {inv.electricityUsage || (inv.newElectricity - inv.oldElectricity)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Water Detail */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Droplets size={12} className="text-blue-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Nước (m³)</span>
                        </div>
                        <div className="flex items-baseline justify-between bg-white/50 p-2 rounded-lg border border-slate-100">
                           <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Cũ</p>
                            <p className="text-xs font-bold text-slate-600">{inv.oldWater}</p>
                          </div>
                          <div className="h-4 w-px bg-slate-200 self-center"></div>
                          <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Mới</p>
                            <p className="text-xs font-bold text-slate-900">{inv.newWater}</p>
                          </div>
                          <div className="h-4 w-px bg-slate-200 self-center"></div>
                          <div className="text-center">
                            <p className="text-[8px] text-blue-500 font-bold uppercase">Dùng</p>
                            <p className="text-xs font-black text-blue-600">
                              {inv.waterUsage || (inv.newWater - inv.oldWater)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Contract Preview Modal */}
      <Modal 
        isOpen={isContractModalOpen} 
        onClose={() => { setIsContractModalOpen(false); setContractDraft(''); }} 
        title="Hợp đồng thuê phòng"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-h-[70vh] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible print:border-none print:p-0">
            <div className="contract-content text-sm leading-relaxed text-slate-800" style={{ fontFamily: 'Times New Roman, serif' }}>
              {/* Header */}
              <div className="text-center mb-8">
                <p className="text-base font-bold uppercase tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-base">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-lg">──────────────────</p>
                <p className="text-xl font-bold uppercase mt-6 mb-2">HỢP ĐỒNG THUÊ PHÒNG TRỌ</p>
                <p className="italic">Số: ......./HĐTP</p>
              </div>

              {/* Contract content rendered from draft */}
              <div className="whitespace-pre-wrap" style={{ textAlign: 'justify', textIndent: '2em' }} dangerouslySetInnerHTML={{ 
                __html: contractDraft
                  .replace(/^CỘNG HÒA.*HĐTP\n*/gm, '') // Remove header (we render it separately)
                  .replace(/══+/g, '<hr class="my-4 border-slate-300"/>')
                  .replace(/━+/g, '<hr class="my-2 border-slate-200"/>')
                  .replace(/──+/g, '<hr class="my-4 border-dashed border-slate-300"/>')
                  .replace(/(ĐIỀU \d+:.*)/g, '<h3 class="font-bold text-base mt-6 mb-3 text-slate-900" style="text-indent:0">$1</h3>')
                  .replace(/(BÊN [AB] \(.*?\):)/g, '<h4 class="font-bold mt-4 mb-2 text-slate-800" style="text-indent:0">$1</h4>')
                  .replace(/^(Họ và tên:|Số CCCD|Ngày sinh:|Quê quán:|Điện thoại:|Nghề nghiệp:|Địa chỉ:)/gm, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />
            </div>
          </div>
          <div className="flex justify-end gap-4 print:hidden">
            <button 
              onClick={() => window.print()} 
              className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              🖨 In hợp đồng
            </button>
            <button 
              onClick={async () => {
                if (selectedRoomForCheckin) {
                  const rep = tenantsByRoom[selectedRoomForCheckin.id]?.find(t => t.isRepresentative || t.id === selectedRoomForCheckin.tenantId);
                  if (rep) {
                    await updateDoc(doc(db, 'tenants', rep.id), { contractDraft });
                    alert('Hợp đồng đã được lưu!');
                    setIsContractModalOpen(false);
                    setContractDraft('');
                  }
                }
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
            >
              💾 Lưu hợp đồng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomsView;
