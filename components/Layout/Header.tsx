
import React from 'react';
import { ViewType } from '../../types';
import { Menu } from 'lucide-react';

interface HeaderProps {
  view: ViewType;
  userEmail: string | null;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, userEmail, onMenuClick }) => {
  // Added missing 'tenant-portal' title to satisfy Record<ViewType, string>
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
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 md:p-8 flex justify-between items-center sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-3 bg-slate-100 rounded-xl text-slate-600 xl:hidden hover:bg-slate-200 transition-all"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter truncate max-w-[150px] md:max-w-none">
          {titles[view]}
        </h1>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-[9px] font-black uppercase text-slate-400">Admin</p>
          <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{userEmail}</p>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg uppercase text-sm">
          {userEmail?.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default Header;
