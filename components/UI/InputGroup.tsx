import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputGroupProps {
  label: string;
  icon: LucideIcon;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
  type?: 'text' | 'number';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const InputGroup: React.FC<InputGroupProps> = React.memo(({ 
  label, 
  icon: Icon, 
  suffix, 
  value, 
  onChange, 
  type = "number",
  placeholder,
  required = true,
  disabled = false,
  error
}) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 flex items-center gap-1">
      <Icon size={12} /> {label}
    </label>
    <div className="relative">
      <input 
        type={type} 
        required={required}
        disabled={disabled}
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 transition-all text-slate-900 dark:text-white 
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''} 
          ${error ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'}
        `}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
          {suffix}
        </span>
      )}
    </div>
    {error && (
      <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>
    )}
  </div>
));

InputGroup.displayName = 'InputGroup';
