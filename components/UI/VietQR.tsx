import React from 'react';
import { QrCode, Download, ExternalLink } from 'lucide-react';

interface VietQRProps {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
  className?: string;
  compact?: boolean;
}

/**
 * VietQR Component
 * Generates a payment QR code using img.vietqr.io
 */
export const VietQR: React.FC<VietQRProps> = ({
  bankId,
  accountNo,
  accountName,
  amount,
  description,
  className = '',
  compact = false
}) => {
  // Normalize parameters
  const normalizedDescription = encodeURIComponent(description.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const normalizedAccountName = encodeURIComponent(accountName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  
  // Construct VietQR URL
  // Template: compact2 (shows bank logo and account info) or qr_only
  const template = compact ? 'qr_only' : 'compact2';
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${normalizedDescription}&accountName=${normalizedAccountName}`;

  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      <div className="mb-4 text-center">
        <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center gap-2">
          <QrCode size={18} className="text-indigo-600" /> Quét mã thanh toán
        </h4>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Hỗ trợ mọi ứng dụng ngân hàng</p>
      </div>

      <div className="relative group overflow-hidden rounded-xl border-4 border-slate-50 shadow-inner">
        <img 
          src={qrUrl} 
          alt="VietQR Payment" 
          className="w-full max-w-[320px] aspect-square object-contain"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors pointer-events-none" />
      </div>

      <div className="mt-4 flex gap-2 w-full">
        <a 
          href={qrUrl} 
          download={`VietQR_${accountNo}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
        >
          <Download size={14} /> Tải ảnh
        </a>
        <button 
          onClick={() => window.open(qrUrl, '_blank')}
          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
          title="Mở ảnh lớn"
        >
          <ExternalLink size={14} />
        </button>
      </div>
      
      {!compact && (
        <div className="mt-4 pt-4 border-t border-slate-100 w-full text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by VietQR</p>
        </div>
      )}
    </div>
  );
};
