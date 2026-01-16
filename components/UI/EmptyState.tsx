
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon size={40} className="text-slate-200 dark:text-slate-600" />
      </div>
      <h3 className="text-lg font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-2">{title}</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium px-8">{description}</p>
    </div>
  );
};

export default EmptyState;
