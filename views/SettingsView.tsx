import React, { useState, useMemo } from 'react';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SystemSettings } from '../types';
import { 
  Settings as SettingsIcon, 
  Save, 
  Zap, 
  Droplets, 
  Wifi, 
  Trash2, 
  CreditCard, 
  User, 
  FileText,
  Calculator
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { InputGroup } from '../components/UI/InputGroup';
import { useToast } from '../components/UI/Toast';
import { VietQR } from '../components/UI/VietQR';
import { SUPPORTED_BANKS } from '../constants/banks';

interface SettingsViewProps {
  settings: SystemSettings;
}

interface FormData {
  electricityRate: string;
  waterRate: string;
  internetFee: string;
  trashFee: string;
  bankId: string;
  bankAccount: string;
  bankOwner: string;
  houseRules: string;
  qrPrefix: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings }) => {
  const [form, setForm] = useState<FormData>(() => ({
    electricityRate: settings.electricityRate?.toString() || '',
    waterRate: settings.waterRate?.toString() || '',
    internetFee: settings.internetFee?.toString() || '',
    trashFee: settings.trashFee?.toString() || '',
    bankId: settings.bankId || '',
    bankAccount: settings.bankAccount || '',
    bankOwner: settings.bankOwner || '',
    houseRules: settings.houseRules || '',
    qrPrefix: settings.qrPrefix || 'TT TIEN PHONG'
  }));
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Memoized rates - single source of truth for numeric values
  const rates = useMemo(() => ({
    electricity: Number(form.electricityRate) || 0,
    water: Number(form.waterRate) || 0,
    internet: Number(form.internetFee) || 0,
    trash: Number(form.trashFee) || 0,
  }), [form.electricityRate, form.waterRate, form.internetFee, form.trashFee]);

  // Preview calculation with memoized rates
  const preview = useMemo(() => ({
    electric: rates.electricity * 50,    // 50 kWh example
    water: rates.water * 5,              // 5 m³ example
    services: rates.internet + rates.trash,
    total: (rates.electricity * 50) + (rates.water * 5) + rates.internet + rates.trash
  }), [rates]);

  // Validation
  const validateForm = (): boolean => {
    if (rates.electricity <= 0) {
      showToast('Giá điện phải lớn hơn 0', 'warning');
      return false;
    }
    if (rates.electricity > 10000) {
      showToast('Giá điện không hợp lý (>10.000đ/kWh)', 'warning');
      return false;
    }
    if (rates.water < 0) {
      showToast('Giá nước không được âm', 'warning');
      return false;
    }
    if (rates.water > 50000) {
      showToast('Giá nước không hợp lý (>50.000đ/m³)', 'warning');
      return false;
    }
    if (rates.internet < 0 || rates.trash < 0) {
      showToast('Phí dịch vụ không được âm', 'warning');
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before saving
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const dataToSave: SystemSettings & { updatedAt: any; updatedBy: string | null } = {
        electricityRate: rates.electricity,
        waterRate: rates.water,
        internetFee: rates.internet,
        trashFee: rates.trash,
        bankId: form.bankId,
        bankAccount: form.bankAccount,
        bankOwner: form.bankOwner,
        houseRules: form.houseRules,
        qrPrefix: form.qrPrefix,
        // Versioning / Audit trail
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || null
      };
      
      await setDoc(doc(db, 'settings', 'global'), dataToSave);
      showToast('Cấu hình đã được lưu thành công!', 'success');
    } catch (err: any) { 
      showToast(`Lỗi: ${err.message}`, 'error');
    }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-slate-900 p-3 rounded-xl text-white shadow-lg shadow-slate-900/20">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cấu hình hệ thống</h2>
          <p className="text-sm text-slate-500">Thiết lập đơn giá điện nước và thông tin thanh toán</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Service Rates */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap size={20} className="text-amber-500"/> Đơn giá dịch vụ
            </h3>
            <Card className="space-y-4">
              <InputGroup 
                label="Giá điện / kWh" 
                icon={Zap} 
                suffix="đ" 
                value={form.electricityRate} 
                onChange={(e) => setForm({...form, electricityRate: e.target.value})}
                placeholder="VD: 3500"
              />
              <InputGroup 
                label="Giá nước / m3" 
                icon={Droplets} 
                suffix="đ" 
                value={form.waterRate} 
                onChange={(e) => setForm({...form, waterRate: e.target.value})}
                placeholder="VD: 15000"
              />
              <InputGroup 
                label="Internet / phòng" 
                icon={Wifi} 
                suffix="đ" 
                value={form.internetFee} 
                onChange={(e) => setForm({...form, internetFee: e.target.value})}
                placeholder="VD: 100000"
              />
              <InputGroup 
                label="Rác / phòng" 
                icon={Trash2} 
                suffix="đ" 
                value={form.trashFee} 
                onChange={(e) => setForm({...form, trashFee: e.target.value})}
                placeholder="VD: 20000"
              />
            </Card>

            {/* Live Preview */}
            <Card className="!bg-gradient-to-br !from-indigo-50 !to-violet-50 !border-indigo-100">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={18} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-900">Ví dụ tính tiền (1 phòng)</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Điện 50 kWh:</span>
                  <span className="font-bold">{preview.electric.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Nước 5 m³:</span>
                  <span className="font-bold">{preview.water.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Internet + Rác:</span>
                  <span className="font-bold">{preview.services.toLocaleString()} đ</span>
                </div>
                <div className="pt-3 mt-3 border-t border-indigo-200 flex justify-between">
                  <span className="font-bold text-indigo-900">Tổng dịch vụ:</span>
                  <span className="font-black text-lg text-indigo-600">{preview.total.toLocaleString()} đ</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={20} className="text-indigo-500"/> Thông tin thanh toán
            </h3>
            <Card className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
                  <CreditCard size={10} /> Ngân hàng (Hỗ trợ VietQR)
                </label>
                <div className="relative">
                  <select 
                    value={form.bankId} 
                    onChange={(e) => setForm({...form, bankId: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 ring-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {SUPPORTED_BANKS.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} ({bank.id})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <SettingsIcon size={14} className="rotate-90" />
                  </div>
                </div>
              </div>
              <InputGroup 
                type="text" 
                label="Số tài khoản" 
                icon={CreditCard} 
                value={form.bankAccount} 
                onChange={(e) => setForm({...form, bankAccount: e.target.value})}
                placeholder="VD: 0123456789"
              />
              <InputGroup 
                type="text" 
                label="Chủ tài khoản" 
                icon={User} 
                value={form.bankOwner} 
                onChange={(e) => setForm({...form, bankOwner: e.target.value.toUpperCase()})}
                placeholder="VD: NGUYEN VAN A"
              />
              <InputGroup 
                type="text" 
                label="Tiền tố nội dung (VietQR)" 
                icon={FileText} 
                value={form.qrPrefix} 
                onChange={(e) => setForm({...form, qrPrefix: e.target.value.toUpperCase()})}
                placeholder="VD: TT TIEN PHONG"
              />
            </Card>

            {/* Live QR Preview */}
            {form.bankId && form.bankAccount && (
              <div className="animate-in zoom-in-95 duration-300">
                <VietQR 
                  bankId={form.bankId}
                  accountNo={form.bankAccount}
                  accountName={form.bankOwner || 'CHỦ TÀI KHOẢN'}
                  amount={50000}
                  description="MA QR THU NGHIEM"
                  compact={true}
                  className="!border-indigo-100 !bg-indigo-50/30"
                />
                <p className="text-[10px] text-center text-slate-400 mt-3 font-medium italic">
                  * Đây là mã QR thử nghiệm với số tiền 50.000đ
                </p>
              </div>
            )}

            {/* Info Banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-1">💡 Lưu ý</p>
              <p className="text-xs leading-relaxed opacity-80">
                Cấu hình này áp dụng cho <strong>toàn bộ hệ thống</strong>. 
                Khi tạo hóa đơn mới, hệ thống sẽ tự động lấy đơn giá từ đây.
              </p>
            </div>
          </div>
        </div>

        {/* House Rules */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-slate-500"/> Nội quy nhà trọ
          </h3>
          <Card className="!p-0 overflow-hidden">
            <textarea 
              className="w-full bg-white p-6 min-h-[200px] outline-none text-sm font-medium leading-relaxed resize-y"
              value={form.houseRules}
              onChange={(e) => setForm({...form, houseRules: e.target.value})}
              placeholder="Nhập nội quy nhà trọ..."
            ></textarea>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
               <span className="text-xs text-slate-400 font-bold uppercase">Markdown Supported</span>
            </div>
          </Card>
        </div>

        <div className="sticky bottom-4 z-20 flex justify-end">
          <Button 
            type="submit" 
            isLoading={isSaving}
            icon={Save}
            className="!px-10 !py-4 text-base shadow-2xl shadow-indigo-500/30"
          >
            Lưu cấu hình
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
