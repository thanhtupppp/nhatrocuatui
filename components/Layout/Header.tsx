import React, { useState } from 'react';
import { ViewType, Invoice } from '../../types';
import { Menu, Bell, X, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../utils/formatUtils';

interface HeaderProps {
  view: ViewType;
  userEmail: string | null;
  onMenuClick: () => void;
  invoices: Invoice[];
}

const Header: React.FC<HeaderProps> = ({ view, userEmail, onMenuClick, invoices }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = useNotifications(invoices);

  const titles: Record<ViewType, string> = {
    dashboard: 'Báo cáo',
    rooms: 'Phòng trọ',
    tenants: 'Khách thuê',
    invoices: 'Hóa đơn',
    expenses: 'Chi phí',
    settings: 'Cài đặt',
    'ai-assistant': 'AI Advisor',
    'tenant-portal': 'Cổng khách thuê'
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 flex justify-between items-center sticky top-0 z-30 print:hidden transition-all duration-300">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2.5 md:p-3 bg-white border border-slate-200 rounded-xl text-slate-500 xl:hidden hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none">
            {titles[view]}
          </h1>
          <p className="hidden sm:block text-[10px] md:text-xs font-medium text-slate-400 mt-1">Quản lý hệ thống nhà trọ</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {/* Simple Notification System */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl transition-all relative ${
              notifications.length > 0 
                ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">Thông báo ({notifications.length})</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-400">Không có thông báo mới nào</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map(n => (
                        <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex gap-3">
                            <div className={`mt-0.5 ${n.type === 'error' ? 'text-rose-500' : 'text-amber-500'}`}>
                              <AlertCircle size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">{formatDate(n.date)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Admin</p>
          <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{userEmail}</p>
        </div>
        
        <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 text-base md:text-lg uppercase ring-3 md:ring-4 ring-white shrink-0">
          {userEmail?.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default Header;
