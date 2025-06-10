
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationType } from '../types';
import { generateId } from '../utils/helpers';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InfoIcon, ExclamationTriangleIcon } from '../components/Common/Icons';

interface NotificationContextType {
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType, duration: number = 5000) => {
    const id = generateId();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <InfoIcon className="w-6 h-6 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      case 'info': return 'border-blue-500';
      default: return 'border-gray-500';
    }
  };


  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`flex items-start p-4 rounded-lg shadow-xl bg-white border-l-4 ${getBorderColor(notification.type)}`}
          >
            <div className="flex-shrink-0 mr-3">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</p>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
