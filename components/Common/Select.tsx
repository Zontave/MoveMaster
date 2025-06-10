
import React, { ReactNode } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, error, children, className = '', containerClassName = '', ...props }) => {
  const selectId = id || props.name || React.useId();
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
