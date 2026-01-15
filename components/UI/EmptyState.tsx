
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon size={40} className="text-slate-200" />
      </div>
      <h3 className="text-lg font-black text-slate-400 uppercase tracking-tighter mb-2">{title}</h3>
      <p className="text-sm text-slate-400 font-medium px-8">{description}</p>
    </div>
  );
};

export default EmptyState;
