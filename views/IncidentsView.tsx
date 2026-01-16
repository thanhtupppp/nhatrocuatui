
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Incident, Room } from '../types';
import { 
  ShieldAlert, Clock, Wrench, CheckCircle2, 
  Search, Filter, ChevronDown
} from 'lucide-react';
import EmptyState from '../components/UI/EmptyState';

interface IncidentsViewProps {
  rooms: Room[];
}

const IncidentsView: React.FC<IncidentsViewProps> = ({ rooms }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  useEffect(() => {
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident)));
    });
    return unsubscribe;
  }, []);

  const handleUpdateStatus = async (incidentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'incidents', incidentId), { status: newStatus });
    } catch (err) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.name || 'N/A';
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inc.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getRoomName(inc.roomId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'RESOLVED':
        return { label: 'Đã xử lý', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 };
      case 'IN_PROGRESS':
        return { label: 'Đang xử lý', bg: 'bg-blue-100', text: 'text-blue-700', icon: Wrench };
      default:
        return { label: 'Chờ xử lý', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32}/>
            Quản lý Sự cố
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Theo dõi và xử lý yêu cầu từ cư dân</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tiêu đề, khách thuê, phòng..." 
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3 rounded-xl text-sm font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer shadow-sm"
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="ALL" className="dark:bg-slate-800">Tất cả trạng thái</option>
          <option value="PENDING" className="dark:bg-slate-800">Chờ xử lý</option>
          <option value="IN_PROGRESS" className="dark:bg-slate-800">Đang xử lý</option>
          <option value="RESOLVED" className="dark:bg-slate-800">Đã xử lý</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{incidents.filter(i => i.status === 'PENDING').length}</p>
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Chờ xử lý</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{incidents.filter(i => i.status === 'IN_PROGRESS').length}</p>
          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Đang xử lý</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{incidents.filter(i => i.status === 'RESOLVED').length}</p>
          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Đã hoàn thành</p>
        </div>
      </div>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <EmptyState 
          icon={ShieldAlert} 
          title="Không có sự cố nào" 
          description="Tất cả đang ổn hoặc thử thay đổi bộ lọc." 
        />
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map(inc => {
            const statusConfig = getStatusConfig(inc.status);
            return (
              <div key={inc.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                        Phòng {getRoomName(inc.roomId)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(inc.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{inc.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{inc.description}</p>
                    <p className="text-xs text-slate-400">Báo cáo bởi: <span className="font-bold text-slate-600 dark:text-slate-300">{inc.tenantName}</span></p>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.bg} dark:bg-opacity-20 ${statusConfig.text} dark:text-opacity-80`}>
                      <statusConfig.icon size={14}/>
                      <span className="text-xs font-black uppercase">{statusConfig.label}</span>
                    </div>
                    
                    <select 
                      value={inc.status}
                      onChange={(e) => handleUpdateStatus(inc.id, e.target.value)}
                      className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="PENDING" className="dark:bg-slate-700">Chờ xử lý</option>
                      <option value="IN_PROGRESS" className="dark:bg-slate-700">Đang xử lý</option>
                      <option value="RESOLVED" className="dark:bg-slate-700">Đã xử lý</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncidentsView;
