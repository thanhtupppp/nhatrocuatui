
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SystemSettings } from '../types';
import { Settings as SettingsIcon, Zap, Droplets, Wifi, Trash, Save, CreditCard, ScrollText } from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings: initialSettings }) => {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      alert("Đã cập nhật cấu hình hệ thống!");
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8 pb-12">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Đơn giá dịch vụ */}
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl"><SettingsIcon size={32} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase leading-none">Cấu hình giá</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Dùng để tính hóa đơn tự động</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><Zap size={14}/> Điện (kWh)</label>
              <input type="number" value={settings.electricityRate} onChange={e => setSettings({...settings, electricityRate: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-900 focus:ring-2 ring-blue-500"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><Droplets size={14}/> Nước (m³)</label>
              <input type="number" value={settings.waterRate} onChange={e => setSettings({...settings, waterRate: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-900 focus:ring-2 ring-blue-500"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><Wifi size={14}/> Internet</label>
              <input type="number" value={settings.internetFee} onChange={e => setSettings({...settings, internetFee: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-900 focus:ring-2 ring-blue-500"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 ml-1"><Trash size={14}/> Phí rác</label>
              <input type="number" value={settings.trashFee} onChange={e => setSettings({...settings, trashFee: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-900 focus:ring-2 ring-blue-500"/>
            </div>
          </div>
        </div>

        {/* Thanh toán VietQR */}
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><CreditCard size={32} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase leading-none">Thanh toán VietQR</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Thông tin nhận tiền từ khách thuê</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ngân hàng (VD: VCB, MB...)</label>
              <input type="text" value={settings.bankId} onChange={e => setSettings({...settings, bankId: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-900" placeholder="MB"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Số tài khoản</label>
              <input type="text" value={settings.bankAccount} onChange={e => setSettings({...settings, bankAccount: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-900"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Chủ tài khoản (Không dấu)</label>
              <input type="text" value={settings.bankOwner} onChange={e => setSettings({...settings, bankOwner: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black text-slate-900" placeholder="NGUYEN VAN A"/>
            </div>
          </div>
        </div>

        {/* Nội quy nhà trọ */}
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl"><ScrollText size={32} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase leading-none">Nội quy nhà trọ</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Hiển thị cho khách thuê xem</p>
            </div>
          </div>
          
          <textarea 
            rows={5} 
            value={settings.houseRules} 
            onChange={e => setSettings({...settings, houseRules: e.target.value})} 
            className="w-full bg-slate-50 border-none rounded-[2rem] px-8 py-6 font-medium text-slate-700 focus:ring-2 ring-amber-500"
            placeholder="Nhập nội quy tại đây..."
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all sticky bottom-8"
        >
          {saving ? 'Đang lưu cấu hình...' : <><Save size={24} /> Lưu toàn bộ thay đổi</>}
        </button>
      </form>
    </div>
  );
};

export default SettingsView;
