
import React, { useState, useEffect } from 'react';
import { Zap, Droplets, Save } from 'lucide-react';
import { Room, RoomStatus } from '../../types';
import Modal from '../UI/Modal';

interface BulkMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  initialData: Record<string, { newElectricity: number, newWater: number }>;
  onSave: (data: Record<string, { newElectricity: number, newWater: number }>) => Promise<void>;
}

const BulkMeterModal: React.FC<BulkMeterModalProps> = ({ 
  isOpen, 
  onClose, 
  rooms, 
  initialData, 
  onSave 
}) => {
  const [form, setForm] = useState(initialData);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  const occupiedRooms = rooms.filter(r => r.status === RoomStatus.OCCUPIED);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Chốt chỉ số hàng loạt"
      maxWidth="max-w-7xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400">
            <div className="col-span-2">Phòng</div>
            <div className="col-span-10 grid grid-cols-2 gap-4 border-l border-slate-200 pl-4">
              <span>Chỉ số Điện (kWh)</span>
              <span>Chỉ số Nước (m³)</span>
            </div>
          </div>
          
          {occupiedRooms.map(r => (
            <div key={r.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-stretch md:items-center px-4 md:px-6 py-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-300 transition-all hover:shadow-md group">
              <div className="md:col-span-2">
                 <p className="md:hidden text-[10px] font-black uppercase text-slate-400 mb-1">Căn hộ</p>
                 <div className="font-black text-slate-900 text-xl">{r.name}</div>
              </div>
              
              <div className="md:col-span-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 md:border-l md:border-slate-100 md:pl-4">
                {/* Electricity Section */}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] gap-4 pl-4 border-l-4 border-amber-400">
                   <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Điện cũ</span>
                      <span className="text-base font-black text-slate-500 font-mono tracking-tighter">{r.electricityMeter}</span>
                   </div>
                   <div className="relative">
                      <input 
                        type="number" 
                        placeholder="Số điện mới"
                        value={form[r.id]?.newElectricity || 0}
                        onChange={e => setForm({
                          ...form,
                          [r.id]: { ...form[r.id], newElectricity: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-amber-50/50 border-2 border-amber-100 focus:border-amber-500 rounded-2xl pl-4 pr-10 py-4 text-xl font-black text-amber-900 focus:ring-8 ring-amber-500/10 outline-none transition-all placeholder:text-amber-200"
                      />
                      <Zap size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400" />
                   </div>
                </div>

                {/* Water Section */}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] gap-4 pl-4 border-l-4 border-blue-400">
                   <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Nước cũ</span>
                      <span className="text-base font-black text-slate-500 font-mono tracking-tighter">{r.waterMeter}</span>
                   </div>
                   <div className="relative">
                      <input 
                        type="number" 
                        placeholder="Số nước mới"
                        value={form[r.id]?.newWater || 0}
                        onChange={e => setForm({
                          ...form,
                          [r.id]: { ...form[r.id], newWater: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full bg-blue-50/50 border-2 border-blue-100 focus:border-blue-500 rounded-2xl pl-4 pr-10 py-4 text-xl font-black text-blue-900 focus:ring-8 ring-blue-500/10 outline-none transition-all placeholder:text-blue-200"
                      />
                      <Droplets size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" />
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase flex items-center justify-center gap-3 shadow-xl">
           <Save size={20}/> Lưu tất cả chỉ số
        </button>
      </form>
    </Modal>
  );
};

export default BulkMeterModal;
