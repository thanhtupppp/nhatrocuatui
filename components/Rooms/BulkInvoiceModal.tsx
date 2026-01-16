
import React from 'react';
import { CheckSquare } from 'lucide-react';
import Modal from '../UI/Modal';

interface BulkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  occupiedRoomsCount: number;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onConfirm: () => Promise<void>;
}

const BulkInvoiceModal: React.FC<BulkInvoiceModalProps> = ({
  isOpen,
  onClose,
  occupiedRoomsCount,
  month,
  year,
  onMonthChange,
  onYearChange,
  onConfirm
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lập hóa đơn hàng loạt">
      <div className="space-y-6">
        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
           <CheckSquare size={48} className="mx-auto text-indigo-600 mb-4 opacity-20"/>
           <h4 className="text-xl font-black text-slate-900 mb-2">Xác nhận lập hóa đơn loạt?</h4>
           <p className="text-sm text-slate-500 leading-relaxed">
             Hệ thống sẽ tạo hóa đơn cho **{occupiedRoomsCount} phòng** đang thuê. 
             Vui lòng đảm bảo các chỉ số điện nước đã được cập nhật trước khi thực hiện.
           </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Kỳ tháng</label>
            <input type="number" value={month} onChange={e => onMonthChange(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold"/>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Năm</label>
            <input type="number" value={year} onChange={e => onYearChange(parseInt(e.target.value) || 2024)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold"/>
          </div>
        </div>

        <div className="flex gap-3">
           <button onClick={onClose} className="flex-1 px-6 py-4 border border-slate-200 text-slate-400 rounded-xl font-bold uppercase transition-all hover:bg-slate-50">Hủy</button>
           <button onClick={onConfirm} className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700">Lập {occupiedRoomsCount} hóa đơn</button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkInvoiceModal;
