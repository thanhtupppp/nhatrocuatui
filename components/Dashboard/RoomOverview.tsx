import React from 'react';
import { Room } from '../../types';
import { RoomStatus } from '../../constants/enums';
import { Home, CheckCircle, AlertCircle } from 'lucide-react';

interface RoomOverviewProps {
  rooms: Room[];
}

export const RoomOverview: React.FC<RoomOverviewProps> = React.memo(({ rooms }) => {
  const occupiedRooms = rooms.filter(r => r.status === RoomStatus.OCCUPIED);
  const availableRooms = rooms.filter(r => r.status === RoomStatus.AVAILABLE);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border border-indigo-100 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-600/30">
          <Home size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tổng quan phòng trọ</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tình trạng hiện tại</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Đang thuê</span>
          </div>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{occupiedRooms.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Còn trống</span>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{availableRooms.length}</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Tổng số phòng: <span className="font-bold text-slate-600 dark:text-slate-300">{rooms.length}</span>
        </p>
      </div>
    </div>
  );
});

RoomOverview.displayName = 'RoomOverview';
