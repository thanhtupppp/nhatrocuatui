
import React, { useState, useMemo } from 'react';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Invoice, Room, Tenant, SystemSettings } from '../types';
import { Receipt, CheckCircle, Trash2, Printer, Search, Zap, Droplets, Wallet, Calendar, DoorOpen, Copy } from 'lucide-react';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { formatCurrency } from '../utils/formatUtils';
import { VietQR } from '../components/UI/VietQR';
import { SUPPORTED_BANKS } from '../constants/banks';

interface InvoicesViewProps {
  invoices: Invoice[];
  rooms: Room[];
  tenants: Tenant[];
  settings: SystemSettings;
}

const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, rooms, tenants, settings }) => {
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

       <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" placeholder="Tìm theo số phòng, tên khách hoặc kỳ hóa đơn..." 
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-6 py-3 text-sm font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Card className="!p-4 bg-indigo-50 dark:bg-indigo-900/20 !border-indigo-100 dark:!border-indigo-500/20 flex items-center gap-3">
             <Wallet size={20} className="text-indigo-600 dark:text-indigo-400"/>
             <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase">
               Chưa thu: {formatCurrency(invoices.filter(i => !i.paid).reduce((a,c) => a+c.total, 0))}
             </span>
          </Card>
       </div>

       {filteredInvoices.length === 0 ? (
         <EmptyState 
           icon={Receipt} 
           title="Không tìm thấy hóa đơn" 
           description="Hệ thống chưa ghi nhận hóa đơn nào khớp với tìm kiếm của bạn." 
         />
       ) : (
         <div className="grid grid-cols-1 gap-4 pb-20">
            {filteredInvoices.map(invoice => {
              const room = rooms.find(r => r.id === invoice.roomId);
              const tenant = tenants.find(t => t.id === room?.tenantId);
              
              return (
                <Card key={invoice.id} className="!p-6 flex flex-col md:flex-row items-center gap-6 group hover:shadow-lg transition-all dark:bg-slate-800 dark:border-slate-700">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 ${invoice.paid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                    <span className="text-[9px] font-bold uppercase opacity-70">Tháng</span>
                    <span className="text-xl font-black leading-none">{invoice.month}</span>
                  </div>
                  
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase">{room?.name || 'Phòng đã xóa'}</h4>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit mx-auto md:mx-0 ${invoice.paid ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                        {invoice.paid ? 'Đã thu' : 'Chờ thanh toán'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                      Chủ hộ: {tenant?.name || 'Hồ sơ đã xóa'}
                    </p>
                  </div>

                  <div className="text-center md:text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Thành tiền</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(invoice.total)}</h3>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto justify-center">
                    <Button 
                      onClick={() => { setSelectedInvoice(invoice); setIsPrintModalOpen(true); }}
                      variant="secondary"
                      className="!p-3 rounded-lg"
                      title="In hóa đơn"
                    >
                      <Printer size={20} />
                    </Button>
                    <Button 
                      onClick={async () => await updateDoc(doc(db, 'invoices', invoice.id), { paid: !invoice.paid })} 
                      className={`!p-3 rounded-lg ${invoice.paid ? '!bg-emerald-500 hover:!bg-emerald-600 text-white' : '!bg-white dark:!bg-slate-800 border dark:border-slate-700 text-slate-400 hover:!bg-indigo-50 dark:hover:!bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                      title={invoice.paid ? "Đánh dấu chưa thu" : "Đánh dấu đã thu"}
                    >
                      <CheckCircle size={20} />
                    </Button>
                    <Button 
                      onClick={async () => { if(confirm("Xóa hóa đơn này vĩnh viễn?")) await deleteDoc(doc(db, 'invoices', invoice.id)) }}
                      variant="ghost"
                      className="!p-3 rounded-lg hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-900/20"
                      title="Xóa hóa đơn"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </Card>
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
                    <div className="flex justify-between text-xs font-bold text-slate-600"><span>Internet & Rác:</span><span>{((selectedInvoice.internetFee || 0) + (selectedInvoice.trashFee || 0)).toLocaleString()} đ</span></div>
                    {(selectedInvoice.otherFees || 0) > 0 && (
                      <div className="flex justify-between text-xs font-bold text-slate-600"><span>Phụ phí phát sinh:</span><span>{(selectedInvoice.otherFees || 0).toLocaleString()} đ</span></div>
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

             {/* VietQR Payment Integration */}
             {!selectedInvoice.paid && settings.bankId && settings.bankAccount && (
               <div className="flex flex-col gap-6 bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-100">
                 <div className="flex flex-col md:flex-row gap-8 items-center">
                   <div className="flex-1 space-y-6">
                     <div>
                       <h4 className="text-xl font-black text-slate-800 mb-2">Thanh toán nhanh</h4>
                       <p className="text-sm text-slate-500 leading-relaxed">
                         Quét mã VietQR để thanh toán tự động hoặc chuyển khoản thủ công theo thông tin bên dưới.
                       </p>
                     </div>
                     
                     <div className="space-y-3">
                       <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                         <div className="flex justify-between items-center group">
                           <div className="space-y-0.5">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Số tài khoản</p>
                             <p className="text-sm font-black text-slate-900">{settings.bankAccount}</p>
                           </div>
                           <button 
                             onClick={() => { navigator.clipboard.writeText(settings.bankAccount); alert("Đã sao chép số tài khoản!"); }}
                             className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                             title="Sao chép"
                           >
                             <Copy size={16} />
                           </button>
                         </div>
                         
                         <div className="border-t border-dashed border-slate-100 pt-3 flex justify-between items-center group">
                           <div className="space-y-0.5">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nội dung chuyển khoản</p>
                             <p className="text-sm font-black text-indigo-600">
                               {`${settings.qrPrefix || 'TT TIEN PHONG'} ${rooms.find(r => r.id === selectedInvoice.roomId)?.name} THANG ${selectedInvoice.month}/${selectedInvoice.year}`}
                             </p>
                           </div>
                           <button 
                             onClick={() => { 
                               const content = `${settings.qrPrefix || 'TT TIEN PHONG'} ${rooms.find(r => r.id === selectedInvoice.roomId)?.name} THANG ${selectedInvoice.month}/${selectedInvoice.year}`;
                               navigator.clipboard.writeText(content); 
                               alert("Đã sao chép nội dung chuyển khoản!");
                             }}
                             className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                             title="Sao chép"
                           >
                             <Copy size={16} />
                           </button>
                         </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-4 text-xs font-bold">
                         <div className="flex items-center gap-2">
                           <span className="text-slate-400 uppercase">Ngân hàng:</span> 
                           <span className="text-slate-700">
                             {SUPPORTED_BANKS.find(b => b.id === settings.bankId)?.name || settings.bankId} ({settings.bankId})
                           </span>
                         </div>
                         <div className="flex items-center gap-2"><span className="text-slate-400 uppercase">Chủ hộ:</span> <span className="text-slate-700">{settings.bankOwner}</span></div>
                       </div>
                     </div>
                   </div>

                   <VietQR 
                     bankId={settings.bankId}
                     accountNo={settings.bankAccount}
                     accountName={settings.bankOwner}
                     amount={selectedInvoice.total}
                     description={`${settings.qrPrefix || 'TT TIEN PHONG'} ${rooms.find(r => r.id === selectedInvoice.roomId)?.name} THANG ${selectedInvoice.month}/${selectedInvoice.year}`}
                     className="!p-0 !bg-transparent !border-none !shadow-none"
                   />
                 </div>
               </div>
             )}
             
             <div className="flex gap-4 no-print">
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