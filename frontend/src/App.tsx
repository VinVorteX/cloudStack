// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { getFiles, refreshToken } from '@/api/api';
import Dashboard from './pages/Dashboard';
import Trash from './pages/Trash';
import Login from './pages/Login';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      console.log('ProtectedRoute: Checking token:', token ? 'Present' : 'Not found');
      if (!token) {
        console.log('ProtectedRoute: No token, redirecting to login');
        setIsAuthenticated(false);
        return;
      }
      try {
        await getFiles();
        console.log('ProtectedRoute: Token valid, allowing access');
        setIsAuthenticated(true);
      } catch (error: any) {
        console.error('ProtectedRoute: Token validation error:', error.message);
        if (error.message === 'Token refresh failed' || error.message === 'No refresh token available') {
          setIsAuthenticated(false);
        } else {
          try {
            console.log('ProtectedRoute: Attempting token refresh');
            await refreshToken();
            await getFiles();
            console.log('ProtectedRoute: Token refreshed, allowing access');
            setIsAuthenticated(true);
          } catch (refreshError) {
            console.error('ProtectedRoute: Refresh failed:', refreshError);
            setIsAuthenticated(false);
          }
        }
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    console.log('ProtectedRoute: Loading authentication state');
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trash"
              element={
                <ProtectedRoute>
                  <Trash />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
