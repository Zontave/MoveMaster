
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HomeIcon, TruckIcon, PackageIcon, LogoutIcon } from './Icons';
import { APP_NAME } from '../../constants';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-700 text-white'
        : 'text-slate-300 hover:bg-slate-600 hover:text-white'
    }`;

  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 flex items-center text-xl font-bold">
              <TruckIcon className="w-8 h-8 mr-2 text-blue-400" />
              {APP_NAME}
            </NavLink>
          </div>
          {isAuthenticated && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/dashboard" className={navLinkClass}>
                  <HomeIcon className="w-5 h-5 mr-2" />
                  Dashboard
                </NavLink>
                <NavLink to="/moves" className={navLinkClass}>
                  <TruckIcon className="w-5 h-5 mr-2" />
                  Moves
                </NavLink>
                {/* Add more links here if needed, e.g., for all packages */}
              </div>
            </div>
          )}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                <span className="text-sm text-slate-300 mr-4 hidden sm:inline">Welcome, {user?.name || user?.email}</span>
                <Button onClick={logout} variant="ghost" size="sm" leftIcon={<LogoutIcon className="w-5 h-5"/>}>
                  Logout
                </Button>
              </div>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
