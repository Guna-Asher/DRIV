import React, { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';

import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import VaultPage from '@/pages/VaultPage';
import AssetsPage from '@/pages/AssetsPage';
import LegacyPage from '@/pages/LegacyPage';
import TrustedPartiesPage from '@/pages/TrustedPartiesPage';
import VerificationPage from '@/pages/VerificationPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SubscriptionsPage from '@/pages/SubscriptionsPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-cyan-400 text-xl">Loading DRIV...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, API }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/vaults" element={user ? <VaultPage /> : <Navigate to="/" />} />
            <Route path="/assets" element={user ? <AssetsPage /> : <Navigate to="/" />} />
            <Route path="/legacy" element={user ? <LegacyPage /> : <Navigate to="/" />} />
            <Route path="/trusted-parties" element={user ? <TrustedPartiesPage /> : <Navigate to="/" />} />
            <Route path="/verification" element={user ? <VerificationPage /> : <Navigate to="/" />} />
            <Route path="/analytics" element={user ? <AnalyticsPage /> : <Navigate to="/" />} />
            <Route path="/subscriptions" element={user ? <SubscriptionsPage /> : <Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;