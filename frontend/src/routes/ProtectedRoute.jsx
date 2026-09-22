import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper that verifies authentication and optional role restrictions
 */
export const ProtectedRoute = ({ requiredRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Verifying session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles.length > 0 && user) {
    const userRole = (user.role || 'USER').toUpperCase();
    const isAdmin = userRole === 'ADMIN';
    const hasRole = requiredRoles.map(r => r.toUpperCase()).includes(userRole);

    if (!hasRole && !isAdmin) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            You do not have permission to view this page.
          </p>
        </div>
      );
    }
  }

  return <Outlet />;
};
