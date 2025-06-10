
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  leftIcon?: React.ReactNode; // Added leftIcon prop
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', containerClassName = '', labelClassName = '', leftIcon, ...props }) => {
  const inputId = id || props.name || React.useId();
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative flex items-center"> {/* Added relative container for icon positioning */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${leftIcon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
  const areaId = id || props.name || React.useId();
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={areaId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
