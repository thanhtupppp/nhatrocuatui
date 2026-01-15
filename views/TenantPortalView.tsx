
import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Room, Tenant, Invoice, SystemSettings } from '../types';
import { 
  UserSearch, DoorOpen, Receipt, FileText, 
  ShieldAlert, LogOut, ArrowLeft, QrCode, 
  CheckCircle2, AlertTriangle, ScrollText, Send
} from 'lucide-react';
import Modal from '../components/UI/Modal';

interface TenantPortalViewProps {
  rooms: Room[];
  tenants: Tenant[];
  invoices: Invoice[];
  settings: SystemSettings;
  onBackToAdmin: () => void;
}

const TenantPortalView: React.FC<TenantPortalViewProps> = ({ rooms, tenants, invoices, settings, onBackToAdmin }) => {
  const [loginForm, setLoginForm] = useState({ roomName: '', idCard: '' });
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'contract' | 'rules' | 'incident'>('invoices');
  
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find(r => r.name.toLowerCase() === loginForm.roomName.toLowerCase());
    const tenant = tenants.find(t => t.idCard === loginForm.idCard && t.roomId === room?.id);
    
    if (room && tenant) {
      setActiveTenant(tenant);
      setActiveRoom(room);
    } else {
      alert("Thông tin không chính xác. Vui lòng kiểm tra lại Số phòng và CCCD.");
    }
  };

  const getVietQRUrl = (invoice: Invoice) => {
    const info = encodeURIComponent(`Thanh toan phong ${activeRoom?.name} thang ${invoice.month}`);
    return `https://img.vietqr.io/image/${settings.bankId}-${settings.bankAccount}-compact2.png?amount=${invoice.total}&addInfo=${info}&accountName=${encodeURIComponent(settings.bankOwner)}`;
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !activeTenant) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'incidents'), {
        roomId: activeRoom.id,
        tenantName: activeTenant.name,
        ...incidentForm,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      alert("Đã gửi báo cáo sự cố thành công!");
      setIncidentForm({ title: '', description: '' });
      setActiveTab('invoices');
    } catch (err) { alert("Lỗi gửi báo cáo."); } finally { setIsSubmitting(false); }
  };

  if (!activeTenant || !activeRoom) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl space-y-8 animate-in zoom-in-95">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <UserSearch size={40} className="text-white -rotate-3" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase">Tra cứu khách thuê</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-2 tracking-widest">Dành cho cư dân nhà trọ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số phòng (Ví dụ: P.101)</label>
              <input 
                type="text" required value={loginForm.roomName} 
                onChange={e => setLoginForm({...loginForm, roomName: e.target.value})} 
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 ring-blue-500" 
                placeholder="Số phòng của bạn"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số CCCD / CMND</label>
              <input 
                type="text" required value={loginForm.idCard} 
                onChange={e => setLoginForm({...loginForm, idCard: e.target.value})} 
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 ring-blue-500" 
                placeholder="Nhập CCCD để định danh"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl">
              Đăng nhập Portal
            </button>
          </form>

          <button onClick={onBackToAdmin} className="w-full text-[10px] text-slate-400 font-black uppercase flex items-center justify-center gap-2">
            <ArrowLeft size={14}/> Quay lại trang quản trị
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-b-[3rem] shadow-2xl">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black">{activeRoom.name.charAt(0)}</div>
               <div>
                 <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Xin chào, cư dân</p>
                 <h2 className="text-2xl font-black uppercase leading-tight">{activeTenant.name}</h2>
                 <p className="text-sm font-bold opacity-60">Phòng {activeRoom.name}</p>
               </div>
            </div>
            <button onClick={() => { setActiveTenant(null); setActiveRoom(null); }} className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-red-500/20 hover:text-red-400 transition-all">
              <LogOut size={16}/> Đăng xuất
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto -mt-8 px-4">
        <div className="bg-white p-2 rounded-[2rem] shadow-xl flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
          {[
            { id: 'invoices', label: 'Hóa đơn', icon: Receipt },
            { id: 'contract', label: 'Hợp đồng', icon: FileText },
            { id: 'rules', label: 'Nội quy', icon: ScrollText },
            { id: 'incident', label: 'Sự cố', icon: ShieldAlert },
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <tab.icon size={18}/> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-10 px-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 ml-4 tracking-widest flex items-center gap-2"><Receipt size={16}/> Lịch sử hóa đơn</h3>
            {invoices.filter(i => i.roomId === activeRoom.id).length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold italic">Chưa có dữ liệu hóa đơn...</div>
            ) : (
              invoices.filter(i => i.roomId === activeRoom.id).map(inv => (
                <div key={inv.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${inv.paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <span className="text-[10px] font-black uppercase">Tháng</span>
                      <span className="text-xl font-black">{inv.month}</span>
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900">{inv.total.toLocaleString()} đ</h4>
                       <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${inv.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {inv.paid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                       </span>
                    </div>
                  </div>
                  {!inv.paid && (
                    <button 
                      onClick={() => { setSelectedInvoice(inv); setIsQRModalOpen(true); }}
                      className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all"
                    >
                      <QrCode size={20}/> Thanh toán QR
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3"><FileText size={24} className="text-blue-600"/> Hợp đồng điện tử</h3>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 font-serif leading-relaxed text-slate-700 h-[60vh] overflow-y-auto whitespace-pre-wrap">
              {activeTenant.contractDraft || "Hợp đồng đang được cập nhật..."}
            </div>
            <button onClick={() => window.print()} className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3">
              <QrCode size={20}/> Tải xuống PDF
            </button>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3"><ScrollText size={24} className="text-amber-600"/> Nội quy nhà trọ</h3>
            <div className="bg-amber-50/30 p-10 rounded-[2rem] border border-amber-100">
               <div className="whitespace-pre-wrap text-slate-700 leading-loose font-medium">{settings.houseRules}</div>
            </div>
            <div className="flex items-center gap-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <CheckCircle2 size={24} className="text-blue-600 shrink-0"/>
              <p className="text-xs font-bold text-blue-800 italic">Vui lòng tuân thủ nội quy để đảm bảo môi trường sống chung văn minh, sạch đẹp.</p>
            </div>
          </div>
        )}

        {activeTab === 'incident' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-red-50 text-red-600 rounded-3xl"><ShieldAlert size={32}/></div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase">Báo cáo sự cố</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Hư hỏng điện nước, cơ sở vật chất...</p>
              </div>
            </div>
            <form onSubmit={handleReportIncident} className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vấn đề gặp phải</label>
                 <input 
                   type="text" required value={incidentForm.title} placeholder="Ví dụ: Vòi nước bị rò rỉ"
                   onChange={e => setIncidentForm({...incidentForm, title: e.target.value})} 
                   className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold" 
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mô tả chi tiết</label>
                 <textarea 
                   rows={4} required value={incidentForm.description} placeholder="Mô tả cụ thể sự cố để chúng tôi xử lý nhanh hơn..."
                   onChange={e => setIncidentForm({...incidentForm, description: e.target.value})} 
                   className="w-full bg-slate-50 border-none rounded-[2rem] px-6 py-6 font-bold" 
                 />
               </div>
               <button 
                 disabled={isSubmitting} type="submit" 
                 className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {isSubmitting ? 'Đang gửi...' : <><Send size={24}/> Gửi báo cáo cho Admin</>}
               </button>
            </form>
          </div>
        )}
      </div>

      {/* VietQR Modal */}
      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Thanh toán VietQR" maxWidth="max-w-md">
        {selectedInvoice && (
          <div className="space-y-8 text-center">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
               <img src={getVietQRUrl(selectedInvoice)} alt="VietQR" className="w-full h-auto rounded-2xl shadow-lg border-4 border-white" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tổng số tiền</p>
              <h3 className="text-4xl font-black text-slate-900">{selectedInvoice.total.toLocaleString()} đ</h3>
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-3 px-6 rounded-full w-fit mx-auto mt-4">
                <AlertTriangle size={18}/> <span className="text-[10px] font-black uppercase">Quét QR bằng mọi ứng dụng ngân hàng</span>
              </div>
            </div>
            <button onClick={() => setIsQRModalOpen(false)} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs">Đã hiểu, đóng cửa sổ</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TenantPortalView;
