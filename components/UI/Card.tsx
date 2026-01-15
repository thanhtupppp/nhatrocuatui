
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}>
    {children}
  </div>
);

export default Card;
