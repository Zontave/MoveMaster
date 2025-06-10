
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Common/Button';
import { Input } from '../components/Common/Input';
import { TruckIcon } from '../components/Common/Icons';
import { APP_NAME, MOCK_USER_EMAIL } from '../constants';
import { useNotification } from '../contexts/NotificationContext';


export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState(MOCK_USER_EMAIL); // Pre-fill for demo
  const [password, setPassword] = useState('password'); // Pre-fill for demo
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addNotification("Please enter email and password.", "warning");
      return;
    }
    try {
      await login(email, password);
      addNotification("Login successful! Welcome back.", "success");
      // Navigation is handled by useEffect
    } catch (error) {
      addNotification(error instanceof Error ? error.message : "Login failed. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <TruckIcon className="h-16 w-16 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to {APP_NAME}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Manage your moves efficiently.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email address"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
          <div className="text-sm text-gray-500">
            (Use any email/password for this demo. Try: <br/> Email: <strong>{MOCK_USER_EMAIL}</strong>, Password: <strong>password</strong>)
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Sign in
            </Button>
          </div>
        </form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {/* Mock social logins */}
            <Button variant="outline" className="w-full" disabled>Google (Not Implemented)</Button>
            <Button variant="outline" className="w-full" disabled>Facebook (Not Implemented)</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
