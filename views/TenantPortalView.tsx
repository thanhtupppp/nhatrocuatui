
import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Room, Tenant, Invoice, SystemSettings } from '../types';
import { 
  UserSearch, DoorOpen, Receipt, FileText, 
  ShieldAlert, LogOut, ArrowLeft, QrCode, 
  CheckCircle2, AlertTriangle, ScrollText, Send,
  ChevronDown, ChevronUp, Zap, Droplets, Wifi, Home
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
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);

  // Fetch incidents for the active room
  useEffect(() => {
    if (!activeRoom) return;
    const q = query(
      collection(db, 'incidents'), 
      where('roomId', '==', activeRoom.id)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side to avoid composite index requirement
      data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setIncidents(data);
    }, (error) => {
      console.error('Incident listener error:', error);
    });
    return unsubscribe;
  }, [activeRoom]);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-500">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <UserSearch size={40} className="text-white -rotate-3" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Tra cứu khách thuê</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-2 tracking-widest">Dành cho cư dân nhà trọ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số phòng (Ví dụ: P.101)</label>
              <input 
                type="text" required value={loginForm.roomName} 
                onChange={e => setLoginForm({...loginForm, roomName: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold dark:text-white focus:ring-2 ring-blue-500" 
                placeholder="Số phòng của bạn"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số CCCD / CMND</label>
              <input 
                type="text" required value={loginForm.idCard} 
                onChange={e => setLoginForm({...loginForm, idCard: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold dark:text-white focus:ring-2 ring-blue-500" 
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20 transition-colors duration-500">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white p-8 md:p-12 rounded-b-[3rem] shadow-2xl">
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
        <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-xl flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar border dark:border-slate-800">
          {[
            { id: 'invoices', label: 'Hóa đơn', icon: Receipt },
            { id: 'contract', label: 'Hợp đồng', icon: FileText },
            { id: 'rules', label: 'Nội quy', icon: ScrollText },
            { id: 'incident', label: 'Sự cố', icon: ShieldAlert },
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <tab.icon size={18}/> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-10 px-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            {/* Consumption History Mini-Chart */}
            {invoices.filter(i => i.roomId === activeRoom.id).length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Lịch sử tiêu thụ (6 tháng gần nhất)</h4>
                <div className="grid grid-cols-2 gap-6">
                  {/* Electricity Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Zap size={14}/>
                      <span className="text-xs font-black uppercase">Điện (kWh)</span>
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {invoices
                        .filter(i => i.roomId === activeRoom.id)
                        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
                        .slice(-6)
                        .map((inv, idx, arr) => {
                          const usage = inv.electricityUsage || (inv.newElectricity - inv.oldElectricity);
                          const maxUsage = Math.max(...arr.map(i => i.electricityUsage || (i.newElectricity - i.oldElectricity)));
                          const height = maxUsage > 0 ? (usage / maxUsage) * 100 : 0;
                          return (
                            <div key={inv.id} className="flex-1 flex flex-col items-center gap-1" title={`T${inv.month}: ${usage} kWh`}>
                              <div className="w-full bg-amber-100 rounded-t-lg flex justify-center items-end" style={{ height: `${Math.max(height, 10)}%` }}>
                                <span className="text-[8px] font-black text-amber-700">{usage}</span>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400">T{inv.month}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  {/* Water Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Droplets size={14}/>
                      <span className="text-xs font-black uppercase">Nước (m³)</span>
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {invoices
                        .filter(i => i.roomId === activeRoom.id)
                        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
                        .slice(-6)
                        .map((inv, idx, arr) => {
                          const usage = inv.waterUsage || (inv.newWater - inv.oldWater);
                          const maxUsage = Math.max(...arr.map(i => i.waterUsage || (i.newWater - i.oldWater)));
                          const height = maxUsage > 0 ? (usage / maxUsage) * 100 : 0;
                          return (
                            <div key={inv.id} className="flex-1 flex flex-col items-center gap-1" title={`T${inv.month}: ${usage} m³`}>
                              <div className="w-full bg-blue-100 rounded-t-lg flex justify-center items-end" style={{ height: `${Math.max(height, 10)}%` }}>
                                <span className="text-[8px] font-black text-blue-700">{usage}</span>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400">T{inv.month}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-sm font-black uppercase text-slate-400 ml-4 tracking-widest flex items-center gap-2"><Receipt size={16}/> Lịch sử hóa đơn</h3>
            {invoices.filter(i => i.roomId === activeRoom.id).length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold italic">Chưa có dữ liệu hóa đơn...</div>
            ) : (
              invoices.filter(i => i.roomId === activeRoom.id).map(inv => {
                const isExpanded = expandedInvoiceId === inv.id;
                const elecUsage = inv.electricityUsage || (inv.newElectricity - inv.oldElectricity);
                const waterUsage = inv.waterUsage || (inv.newWater - inv.oldWater);
                const elecCost = inv.electricityCost || (elecUsage * inv.electricityRate);
                const waterCost = inv.waterCost || (waterUsage * inv.waterRate);
                
                return (
                  <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                    {/* Main Invoice Row */}
                    <div 
                      className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer"
                      onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${inv.paid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                          <span className="text-[10px] font-black uppercase">Tháng</span>
                          <span className="text-xl font-black">{inv.month}</span>
                        </div>
                        <div>
                           <h4 className="text-2xl font-black text-slate-900 dark:text-white">{inv.total.toLocaleString()} đ</h4>
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${inv.paid ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                             {inv.paid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                           </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {!inv.paid && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); setIsQRModalOpen(true); }}
                            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-xl hover:bg-black transition-all"
                          >
                            <QrCode size={20}/> Thanh toán
                          </button>
                        )}
                        <button className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors">
                          {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Detail Section */}
                    {isExpanded && (
                      <div className="px-8 pb-8 pt-0 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 mt-4">Chi tiết hóa đơn</p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <Home size={16} className="text-indigo-500"/>
                              <span className="font-bold text-slate-700 dark:text-slate-300">Tiền phòng</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">{inv.rentAmount.toLocaleString()} đ</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <Zap size={16} className="text-amber-500"/>
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Điện</span>
                                <span className="text-[10px] text-slate-400 font-bold ml-2">({inv.oldElectricity} → {inv.newElectricity} = {elecUsage} kWh)</span>
                              </div>
                            </div>
                            <span className="font-black text-amber-600 dark:text-amber-400">{elecCost.toLocaleString()} đ</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl">
                            <div className="flex items-center gap-3">
                               <Droplets size={16} className="text-blue-500"/>
                               <div>
                                 <span className="font-bold text-slate-700 dark:text-slate-300">Nước</span>
                                 <span className="text-[10px] text-slate-400 font-bold ml-2">({inv.oldWater} → {inv.newWater} = {waterUsage} m³)</span>
                               </div>
                            </div>
                            <span className="font-black text-blue-600 dark:text-blue-400">{waterCost.toLocaleString()} đ</span>
                          </div>
                          {(inv.internetFee > 0 || inv.trashFee > 0) && (
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <Wifi size={16} className="text-slate-500"/>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Wifi + Rác</span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white">{(inv.internetFee + inv.trashFee).toLocaleString()} đ</span>
                            </div>
                          )}
                          {inv.otherFees > 0 && (
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <Receipt size={16} className="text-slate-500"/>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Phí khác</span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white">{inv.otherFees.toLocaleString()} đ</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-3"><FileText size={24} className="text-blue-600"/> Hợp đồng điện tử</h3>
            
            {activeTenant.contractDraft ? (
              <>
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 max-h-[60vh] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                  <div className="contract-content text-sm leading-relaxed text-slate-800" style={{ fontFamily: 'Times New Roman, serif' }}>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <p className="text-base font-bold uppercase tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="font-bold text-base">Độc lập - Tự do - Hạnh phúc</p>
                      <p className="text-lg">──────────────────</p>
                      <p className="text-xl font-bold uppercase mt-6 mb-2">HỢP ĐỒNG THUÊ PHÒNG TRỌ</p>
                      <p className="italic">Số: ......./HĐTP</p>
                    </div>

                    {/* Contract content */}
                    <div className="whitespace-pre-wrap" style={{ textAlign: 'justify' }} dangerouslySetInnerHTML={{ 
                      __html: activeTenant.contractDraft
                        .replace(/^CỘNG HÒA.*HĐTP\n*/gm, '')
                        .replace(/══+/g, '<hr class="my-4 border-slate-300"/>')
                        .replace(/━+/g, '<hr class="my-2 border-slate-200"/>')
                        .replace(/──+/g, '<hr class="my-4 border-dashed border-slate-300"/>')
                        .replace(/(ĐIỀU \d+:.*)/g, '<h3 class="font-bold text-base mt-6 mb-3 text-slate-900">$1</h3>')
                        .replace(/(BÊN [AB] \(.*?\):)/g, '<h4 class="font-bold mt-4 mb-2 text-slate-800">$1</h4>')
                        .replace(/^(Họ và tên:|Số CCCD|Ngày sinh:|Quê quán:|Điện thoại:|Nghề nghiệp:|Địa chỉ:)/gm, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                </div>
                <button onClick={() => window.print()} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all print:hidden">
                  <FileText size={20}/> In / Tải hợp đồng PDF
                </button>
              </>
            ) : (
              <div className="bg-slate-50 p-12 rounded-[2rem] border border-dashed border-slate-300 text-center">
                <FileText size={48} className="mx-auto text-slate-300 mb-4"/>
                <p className="text-lg font-bold text-slate-500">Hợp đồng chưa được tạo</p>
                <p className="text-sm text-slate-400 mt-2">Vui lòng liên hệ chủ trọ để được cấp hợp đồng điện tử.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-3"><ScrollText size={24} className="text-amber-600"/> Nội quy nhà trọ</h3>
            <div className="bg-amber-50/30 dark:bg-amber-900/10 p-10 rounded-[2rem] border border-amber-100 dark:border-amber-900/20">
               <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-loose font-medium">{settings.houseRules}</div>
            </div>
            <div className="flex items-center gap-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <CheckCircle2 size={24} className="text-blue-600 shrink-0"/>
              <p className="text-xs font-bold text-blue-800 italic">Vui lòng tuân thủ nội quy để đảm bảo môi trường sống chung văn minh, sạch đẹp.</p>
            </div>
          </div>
        )}

        {activeTab === 'incident' && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl"><ShieldAlert size={32}/></div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Báo cáo sự cố</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Hư hỏng điện nước, cơ sở vật chất...</p>
              </div>
            </div>
            <form onSubmit={handleReportIncident} className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vấn đề gặp phải</label>
                 <input 
                   type="text" required value={incidentForm.title} placeholder="Ví dụ: Vòi nước bị rò rỉ"
                   onChange={e => setIncidentForm({...incidentForm, title: e.target.value})} 
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-bold dark:text-white" 
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mô tả chi tiết</label>
                 <textarea 
                   rows={4} required value={incidentForm.description} placeholder="Mô tả cụ thể sự cố để chúng tôi xử lý nhanh hơn..."
                   onChange={e => setIncidentForm({...incidentForm, description: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] px-6 py-6 font-bold dark:text-white" 
                 />
               </div>
               <button 
                 disabled={isSubmitting} type="submit" 
                 className="w-full bg-slate-900 dark:bg-slate-700 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {isSubmitting ? 'Đang gửi...' : <><Send size={24}/> Gửi báo cáo cho Admin</>}
               </button>
            </form>

            {/* Incident History */}
            {incidents.length > 0 && (
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch sử sự cố đã báo cáo</h4>
                {incidents.map((inc) => (
                  <div key={inc.id} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{inc.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{inc.description}</p>
                      <p className="text-[10px] text-slate-400 mt-2">Ngày gửi: {new Date(inc.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full whitespace-nowrap ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                      inc.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    }`}>
                      {inc.status === 'RESOLVED' ? 'Đã xử lý' : inc.status === 'IN_PROGRESS' ? 'Đang xử lý' : 'Chờ xử lý'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VietQR Modal */}
      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Thanh toán VietQR" maxWidth="max-w-md">
        {selectedInvoice && (
          <div className="space-y-8 text-center">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
               <img src={getVietQRUrl(selectedInvoice)} alt="VietQR" className="w-full h-auto rounded-2xl shadow-lg border-4 border-white dark:border-slate-600" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tổng số tiền</p>
              <h3 className="text-4xl font-black text-slate-900">{selectedInvoice.total.toLocaleString()} đ</h3>
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-3 px-6 rounded-full w-fit mx-auto mt-4">
                <AlertTriangle size={18}/> <span className="text-[10px] font-black uppercase">Quét QR bằng mọi ứng dụng ngân hàng</span>
              </div>
            </div>
            <button onClick={() => setIsQRModalOpen(false)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Đã hiểu, đóng cửa sổ</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TenantPortalView;
