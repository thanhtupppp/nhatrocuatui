
import React, { useState, useMemo } from 'react';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Invoice, Room, Tenant, SystemSettings } from '../types';
/* Added missing DoorOpen import */
import { Receipt, CheckCircle, Trash2, Printer, Search, Zap, Droplets, Wallet, Calendar, DoorOpen } from 'lucide-react';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';

interface InvoicesViewProps {
  invoices: Invoice[];
  rooms: Room[];
  tenants: Tenant[];
  settings: SystemSettings;
}

const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, rooms, tenants }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const room = rooms.find(r => r.id === inv.roomId);
      const tenant = tenants.find(t => t.id === room?.tenantId);
      const searchStr = `${room?.name} ${tenant?.name} ${inv.month}/${inv.year}`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    });
  }, [invoices, rooms, tenants, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" placeholder="Tìm theo số phòng, tên khách hoặc kỳ hóa đơn..." 
              className="bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 w-full text-sm font-bold focus:ring-2 ring-blue-500" 
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-blue-50 px-6 py-4 rounded-2xl flex items-center gap-3">
             <Wallet size={20} className="text-blue-600"/>
             <span className="text-xs font-black text-blue-800 uppercase">
               Chưa thu: {invoices.filter(i => !i.paid).reduce((a,c) => a+c.total, 0).toLocaleString()} đ
             </span>
          </div>
       </div>

       {filteredInvoices.length === 0 ? (
         <EmptyState 
           icon={Receipt} 
           title="Không tìm thấy hóa đơn" 
           description="Hệ thống chưa ghi nhận hóa đơn nào khớp với tìm kiếm của bạn." 
         />
       ) : (
         <div className="grid grid-cols-1 gap-6">
            {filteredInvoices.map(invoice => {
              const room = rooms.find(r => r.id === invoice.roomId);
              const tenant = tenants.find(t => t.id === room?.tenantId);
              
              return (
                <div key={invoice.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:shadow-xl transition-all">
                  <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center shrink-0 ${invoice.paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <span className="text-[10px] font-black uppercase">Tháng</span>
                    <span className="text-2xl font-black leading-none">{invoice.month}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-xl font-black text-slate-900 uppercase">{room?.name || 'Phòng đã xóa'}</h4>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${invoice.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {invoice.paid ? 'Đã thu' : 'Chờ thanh toán'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Chủ hộ: {tenant?.name || 'Hồ sơ đã xóa'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Thành tiền</p>
                    <h3 className="text-2xl font-black text-slate-900">{invoice.total.toLocaleString()} đ</h3>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedInvoice(invoice); setIsPrintModalOpen(true); }}
                      className="p-4 rounded-2xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      <Printer size={24} />
                    </button>
                    <button 
                      onClick={async () => await updateDoc(doc(db, 'invoices', invoice.id), { paid: !invoice.paid })} 
                      className={`p-4 rounded-2xl transition-all shadow-md ${invoice.paid ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                      <CheckCircle size={24} />
                    </button>
                    <button 
                      onClick={async () => { if(confirm("Xóa hóa đơn này vĩnh viễn?")) await deleteDoc(doc(db, 'invoices', invoice.id)) }}
                      className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              );
            })}
         </div>
       )}

       <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Hóa đơn tiền phòng" maxWidth="max-w-xl">
         {selectedInvoice && (
           <div className="space-y-8 print:p-0">
             <div className="border-b-2 border-slate-100 pb-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black uppercase text-slate-900">{rooms.find(r => r.id === selectedInvoice.roomId)?.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1">Hóa đơn điện tử #INV-{selectedInvoice.id.slice(0,6).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-xs mb-1">
                      <Calendar size={14}/> Kỳ: {selectedInvoice.month}/{selectedInvoice.year}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(selectedInvoice.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3"><DoorOpen size={18} className="text-slate-400"/> <span className="text-sm font-bold text-slate-700">Tiền thuê phòng</span></div>
                    <span className="font-black text-slate-900">{selectedInvoice.rentAmount.toLocaleString()} đ</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-50 rounded-2xl space-y-2">
                       <div className="flex items-center gap-2 text-amber-600 mb-1"><Zap size={16}/> <span className="text-[10px] font-black uppercase">Điện năng</span></div>
                       <div className="flex justify-between text-[10px] font-bold text-amber-800 opacity-60"><span>Chỉ số: {selectedInvoice.oldElectricity} - {selectedInvoice.newElectricity}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-amber-900">Tiêu thụ: {selectedInvoice.newElectricity - selectedInvoice.oldElectricity} kWh</span> <span className="font-black text-amber-900">{((selectedInvoice.newElectricity - selectedInvoice.oldElectricity) * selectedInvoice.electricityRate).toLocaleString()} đ</span></div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl space-y-2">
                       <div className="flex items-center gap-2 text-blue-600 mb-1"><Droplets size={16}/> <span className="text-[10px] font-black uppercase">Nước sinh hoạt</span></div>
                       <div className="flex justify-between text-[10px] font-bold text-blue-800 opacity-60"><span>Chỉ số: {selectedInvoice.oldWater} - {selectedInvoice.newWater}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-blue-900">Khối: {selectedInvoice.newWater - selectedInvoice.oldWater} m³</span> <span className="font-black text-blue-900">{((selectedInvoice.newWater - selectedInvoice.oldWater) * selectedInvoice.waterRate).toLocaleString()} đ</span></div>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600"><span>Internet & Rác:</span><span>{(selectedInvoice.internetFee + selectedInvoice.trashFee).toLocaleString()} đ</span></div>
                    {selectedInvoice.otherFees > 0 && (
                      <div className="flex justify-between text-xs font-bold text-slate-600"><span>Phụ phí phát sinh:</span><span>{selectedInvoice.otherFees.toLocaleString()} đ</span></div>
                    )}
                  </div>
                </div>
             </div>

             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Tổng cộng cần thu</span>
                  <h2 className="text-4xl font-black text-blue-400 mt-1">{selectedInvoice.total.toLocaleString()} <span className="text-lg">đ</span></h2>
                </div>
                <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border-2 ${selectedInvoice.paid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-amber-500/20 border-amber-500 text-amber-400'}`}>
                  {selectedInvoice.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </div>
             </div>
             
             <div className="flex gap-4 print:hidden">
               <button onClick={() => window.print()} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 transition-all"><Printer size={20}/> In hóa đơn (P.Lien)</button>
               <button onClick={() => setIsPrintModalOpen(false)} className="px-8 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase">Đóng</button>
             </div>
           </div>
         )}
       </Modal>
    </div>
  );
};

export default InvoicesView;