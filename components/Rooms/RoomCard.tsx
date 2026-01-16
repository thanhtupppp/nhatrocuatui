
import React from 'react';
import { 
  Zap, Droplets, Edit3, UserPlus, FileText, 
  Receipt, Trash2, LogOut, History 
} from 'lucide-react';
import { Room, RoomStatus, Tenant } from '../../types';
import Button from '../UI/Button';
import { formatCurrency } from '../../utils/formatUtils';

interface RoomCardProps {
  room: Room;
  tenants: Tenant[];
  onEdit: (room: Room) => void;
  onCheckin: (room: Room) => void;
  onCheckout: (room: Room) => void;
  onInvoice: (room: Room) => void;
  onHistory: (room: Room) => void;
  onContract: (room: Room) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  tenants, 
  onEdit, 
  onCheckin, 
  onCheckout, 
  onInvoice,
  onHistory,
  onContract
}) => {
  const representative = tenants.find(t => t.isRepresentative || t.id === room.tenantId);
  const members = tenants.filter(t => t.id !== representative?.id);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className={`h-1.5 w-full ${room.status === RoomStatus.AVAILABLE ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{room.name}</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                room.status === RoomStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${room.status === RoomStatus.AVAILABLE ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                {room.status === RoomStatus.AVAILABLE ? 'Trống' : `${tenants.length} người - Đang thuê`}
              </span>
              {(room.pendingElectricityMeter || room.pendingWaterMeter) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600">
                   Đã chốt số
                </span>
              )}
            </div>
          </div>
          <button onClick={() => onEdit(room)} className="text-slate-300 hover:text-indigo-600 transition-colors bg-transparent p-1">
            <Edit3 size={16} />
          </button>
        </div>

        {/* Tenants List */}
        {!representative && room.status === RoomStatus.OCCUPIED && (
          <div className="p-3 bg-rose-50 rounded-xl mb-4 border border-rose-100 italic text-[10px] text-rose-500">
            Thiếu thông tin người thuê
          </div>
        )}

        {representative && (
          <div className="mb-4 space-y-2">
             <div className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-[10px] font-bold">
                  {representative.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-900 truncate uppercase">{representative.name}</p>
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-tighter">Đại diện</p>
                </div>
             </div>
             {members.length > 0 && (
               <div className="flex -space-x-2 px-1 overflow-hidden">
                  {members.slice(0, 3).map(m => (
                    <div key={m.id} title={m.name} className="w-6 h-6 bg-slate-100 text-slate-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold uppercase transition-transform hover:scale-110 hover:z-10 cursor-help">
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {members.length > 3 && (
                    <div className="w-6 h-6 bg-slate-200 text-slate-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold">
                      +{members.length - 3}
                    </div>
                  )}
               </div>
             )}
          </div>
        )}

        {/* Meter Info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-amber-500"/>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Điện</span>
            </div>
            <p className="text-sm font-bold text-slate-900 font-mono">{room.electricityMeter}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Droplets size={14} className="text-blue-500"/>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nước</span>
            </div>
            <p className="text-sm font-bold text-slate-900 font-mono">{room.waterMeter}</p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(room.price)}</p>
            <p className="text-[10px] text-slate-400 font-medium">vnđ/tháng</p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => onCheckin(room)} 
              className={`!p-2.5 !h-auto !min-h-0 rounded-lg ${room.status === RoomStatus.AVAILABLE ? '!bg-emerald-600 hover:!bg-emerald-700' : '!bg-indigo-100 !text-indigo-600 hover:!bg-indigo-200 shadow-none'}`}
              title={room.status === RoomStatus.AVAILABLE ? "Check-in khách mới" : "Thêm người vào phòng"}
            >
              <UserPlus size={18}/>
            </Button>
            
            {room.status === RoomStatus.OCCUPIED && (
              <>
                <Button
                  onClick={() => onInvoice(room)}
                  className="!p-2.5 !h-auto !min-h-0 !bg-amber-500 hover:!bg-amber-600 rounded-lg"
                  title="Chốt tiền & Lập hóa đơn"
                >
                  <Receipt size={18}/>
                </Button>
                <Button
                  onClick={() => onHistory(room)}
                  className="!p-2.5 !h-auto !min-h-0 !bg-slate-100 !text-slate-600 hover:!bg-slate-200 rounded-lg shadow-none"
                  title="Xem lịch sử chỉ số"
                >
                  <History size={18}/>
                </Button>
                <Button
                  onClick={() => onContract(room)}
                  className="!p-2.5 !h-auto !min-h-0 !bg-indigo-100 !text-indigo-600 hover:!bg-indigo-200 rounded-lg shadow-none"
                  title="Soạn hợp đồng"
                >
                  <FileText size={18}/>
                </Button>
                <Button
                  onClick={() => onCheckout(room)}
                  className="!p-2.5 !h-auto !min-h-0 !bg-slate-100 !text-slate-400 hover:!bg-rose-50 hover:!text-rose-500 rounded-lg shadow-none"
                  title="Trả phòng"
                >
                  <LogOut size={18}/>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
