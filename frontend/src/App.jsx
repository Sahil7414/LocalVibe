import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import { AppRoutes } from './routes/AppRoutes';
import './styles/globals.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <LocationProvider>
            <AppRoutes />
          </LocationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}


