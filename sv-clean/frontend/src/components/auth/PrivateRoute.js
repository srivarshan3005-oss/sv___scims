import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

export const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/citizen/dashboard" replace />;

  return children;
};

export const CitizenRoute = ({ children }) => {
  const { user, loading, isCitizen } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isCitizen) return <Navigate to="/admin/dashboard" replace />;

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (user) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/citizen/dashboard'} replace />;
  }
  return children;
};
