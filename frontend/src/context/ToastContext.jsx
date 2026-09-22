import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const addToast = useCallback(() => {}, []);
  const removeToast = useCallback(() => {}, []);
  const success = useCallback(() => {}, []);
  const error = useCallback(() => {}, []);
  const warning = useCallback(() => {}, []);
  const info = useCallback(() => {}, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
