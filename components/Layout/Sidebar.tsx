
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
  X,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'rooms', label: 'Phòng trọ', icon: DoorOpen },
    { id: 'tenants', label: 'Khách thuê', icon: Users },
    { id: 'invoices', label: 'Hóa đơn', icon: Receipt },
    { id: 'expenses', label: 'Sổ chi tiêu', icon: Wallet },
    { id: 'settings', label: 'Cấu hình', icon: SettingsIcon },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-out shadow-2xl xl:shadow-none
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    xl:translate-x-0 xl:static xl:h-screen print:hidden
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-6 flex items-center justify-between h-20 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <DoorOpen size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight">NhaTro<span className="text-indigo-600">Admin</span></h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Management v2</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="xl:hidden text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-6 px-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Menu Chính</p>
          </div>
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm group ${
                currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} className={`transition-colors ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {item.label}
              {currentView === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all text-sm font-medium">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
