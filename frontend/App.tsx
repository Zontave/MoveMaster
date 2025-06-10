
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Navbar } from './components/Common/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MovesPage } from './pages/MovesPage';
import { MoveDetailPage } from './pages/MoveDetailPage';
import { Spinner } from './components/Common/Spinner'; // For loading state

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner message="Authenticating..." size="lg" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <main className="flex-grow">
        <Outlet /> {/* Nested routes will render here */}
      </main>
      <footer className="bg-slate-800 text-center text-xs text-slate-400 p-4">
        © {new Date().getFullYear()} MoveMaestro. All rights reserved. (Frontend Demo)
      </footer>
    </div>
  );
};

// New component to handle wildcard navigation
const WildcardRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Match the loading behavior of ProtectedRoute or provide a suitable one
    return <div className="flex justify-center items-center h-screen"><Spinner message="Loading..." size="lg" /></div>;
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}> {/* Protected routes wrapper */}
              <Route element={<AppLayout />}> {/* Layout for authenticated routes */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/moves" element={<MovesPage />} />
                <Route path="/moves/:moveId" element={<MoveDetailPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                 {/* Add other protected routes here */}
              </Route>
            </Route>
            {/* Use the new WildcardRedirect component for the catch-all route */}
            <Route path="*" element={<WildcardRedirect />} />
          </Routes>
        </HashRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
