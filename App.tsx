
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { Room, Tenant, Invoice, Expense, SystemSettings, ViewType } from './types';

// Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import LoginView from './components/Auth/LoginView';

// Views
import DashboardView from './views/DashboardView';
import RoomsView from './views/RoomsView';
import TenantsView from './views/TenantsView';
import InvoicesView from './views/InvoicesView';
import ExpensesView from './views/ExpensesView';
import SettingsView from './views/SettingsView';
import TenantPortalView from './views/TenantPortalView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('dashboard');
  const [isTenantMode, setIsTenantMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    electricityRate: 3500,
    waterRate: 15000,
    internetFee: 100000,
    trashFee: 20000,
    bankId: 'MB',
    bankAccount: '',
    bankOwner: '',
    houseRules: ''
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubAuth;
  }, []);

  const defaultSettings: SystemSettings = {
    electricityRate: 3500,
    waterRate: 15000,
    internetFee: 100000,
    trashFee: 20000,
    bankId: 'MB',
    bankAccount: '',
    bankOwner: '',
    houseRules: '1. Giữ gìn vệ sinh chung.\n2. Không làm ồn sau 23h.\n3. Thanh toán tiền phòng đúng hạn.'
  };

  useEffect(() => {
    // Data fetch logic (Public for settings to generate QR)
    const unsubS = onSnapshot(doc(db, 'settings', 'global'), (d) => {
      if (d.exists()) {
        // Merge with defaults to ensure all fields exist
        setSettings({ ...defaultSettings, ...d.data() } as SystemSettings);
      }
    });
    const unsubR = onSnapshot(collection(db, 'rooms'), (s) => setRooms(s.docs.map(d => ({ id: d.id, ...d.data() } as Room))));
    const unsubT = onSnapshot(collection(db, 'tenants'), (s) => setTenants(s.docs.map(d => ({ id: d.id, ...d.data() } as Tenant))));
    const unsubI = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), (s) => setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() } as Invoice))));
    const unsubE = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (s) => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() } as Expense))));

    return () => { unsubS(); unsubR(); unsubT(); unsubI(); unsubE(); };
  }, [user]);

  if (loading) return (
    <div className="cia-bg h-screen w-full flex flex-col items-center justify-center font-mono text-blue-500">
      <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin mb-4" />
      <p className="tracking-[0.4em] uppercase text-[10px]">Syncing Core Systems...</p>
    </div>
  );

  // If Tenant Mode is active, show the Portal regardless of Admin Login
  if (isTenantMode) {
    return <TenantPortalView rooms={rooms} tenants={tenants} invoices={invoices} settings={settings} onBackToAdmin={() => setIsTenantMode(false)} />;
  }

  if (!user) return <LoginView onEnterTenantMode={() => setIsTenantMode(true)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      <Sidebar currentView={view} setView={(v) => { setView(v); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header view={view} userEmail={user.email} onMenuClick={() => setIsSidebarOpen(true)} invoices={invoices} />

        <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full overflow-y-auto custom-scrollbar print:p-0">
          {view === 'dashboard' && <DashboardView rooms={rooms} invoices={invoices} expenses={expenses} setView={setView} />}
          {view === 'rooms' && <RoomsView rooms={rooms} tenants={tenants} settings={settings} />}
          {view === 'tenants' && <TenantsView tenants={tenants} rooms={rooms} />}
          {view === 'invoices' && <InvoicesView invoices={invoices} rooms={rooms} tenants={tenants} settings={settings} />}
          {view === 'expenses' && <ExpensesView expenses={expenses} />}
          {view === 'settings' && <SettingsView key={settings.electricityRate} settings={settings} />}
        </main>
      </div>
    </div>
  );
};

export default App;
