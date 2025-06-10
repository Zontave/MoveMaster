
import React, { ReactNode } from 'react';
import { XMarkIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full h-full',
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl transform transition-all w-full ${sizeClasses[size]} overflow-hidden modal-content flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
