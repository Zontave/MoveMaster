
import React, { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ className?: string }>; // Changed ReactNode to be more specific
  color?: string; // Tailwind color class for icon and border, e.g., 'text-blue-500 border-blue-500'
  unit?: string;
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color = 'text-slate-500 border-slate-500', unit, onClick }) => {
  const [textColor, borderColor] = color.split(' ');
  return (
    <div 
      className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${borderColor} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {value}
            {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 ${textColor.replace('text-', 'bg-')} ${textColor}`}>
           {React.cloneElement(icon, { className: 'w-7 h-7' })}
        </div>
      </div>
    </div>
  );
};
