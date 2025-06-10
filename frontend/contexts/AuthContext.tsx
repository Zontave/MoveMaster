
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';
import { MOCK_USER_ID, MOCK_USER_EMAIL } from '../constants';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password?: string) => Promise<void>; // Password for mock purposes
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('movemaestro-user', null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial check

  useEffect(() => {
    // Simulate checking auth status on load
    const checkAuth = async () => {
      setIsLoading(true);
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); 
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [user]);


  const login = async (email: string, _password?: string): Promise<void> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = { id: MOCK_USER_ID, email: email, name: email.split('@')[0] };
    setUser(mockUser);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = (): void => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
