
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { ViewType } from '../../types';
import { 
  LayoutDashboard, 
  DoorOpen, 
  Users, 
  Receipt, 
  Wallet, 
  Settings as SettingsIcon, 
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Báo cáo', icon: LayoutDashboard },
    { id: 'rooms', label: 'Phòng trọ', icon: DoorOpen },
    { id: 'tenants', label: 'Khách thuê', icon: Users },
    { id: 'invoices', label: 'Hóa đơn', icon: Receipt },
    { id: 'expenses', label: 'Chi phí', icon: Wallet },
    { id: 'settings', label: 'Cấu hình', icon: SettingsIcon },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    xl:translate-x-0 xl:static xl:h-screen print:hidden
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl rotate-3"><DoorOpen size={24} /></div>
            <div>
              <span className="text-lg font-black block leading-none">NhaTroAdmin</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">v2.1 Pro</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="xl:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-3 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all font-bold text-sm ${currentView === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all text-xs font-black uppercase">
            <LogOut size={18} /> Thoát hệ thống
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
