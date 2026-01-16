import React from 'react';
import { LucideIcon } from 'lucide-react';
import Card from '../UI/Card';
import { ArrowUpRight } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  bg: string;
  color: string;
  border: string;
}

interface StatsGridProps {
  stats: Stat[];
  currentMonth: number;
}

export const StatsGrid: React.FC<StatsGridProps> = React.memo(({ stats, currentMonth }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {stats.map((stat, i) => (
        <Card key={i} className={`!p-6 border hover:-translate-y-1 ${stat.border} dark:border-slate-800 transition-transform duration-300 dark:bg-slate-900`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} dark:bg-opacity-20`}>
              <stat.icon size={24} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
              Tháng {currentMonth} <ArrowUpRight size={10} />
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</h3>
        </Card>
      ))}
    </div>
  );
});

StatsGrid.displayName = 'StatsGrid';
