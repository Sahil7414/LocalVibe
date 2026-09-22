import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(authService.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const storedToken = authService.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
        setToken(storedToken);
      } catch (err) {
        console.error('[AuthContext] Session validation failed:', err);
        authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const result = await authService.login({ email, password });
      setUser(result.user);
      setToken(result.token);
      return result;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const result = await authService.register(userData);
      setUser(result.user);
      setToken(result.token);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const googleLogin = async (credential) => {
    setError(null);
    try {
      const result = await authService.googleLogin(credential);
      setUser(result.user);
      setToken(result.token);
      return result;
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      if (!prev) return updatedUserData;
      return {
        ...prev,
        ...updatedUserData
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        register,
        googleLogin,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
