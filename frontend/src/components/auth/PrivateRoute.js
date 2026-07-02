import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

// Single source of truth for "where does this role land" — used by every
// guard below and by PublicRoute, so a misrouted role (e.g. a Sub Admin
// bouncing off /admin/dashboard) always ends up somewhere valid instead
// of in a redirect loop.
export function homeRouteFor({ isAdmin, isSubAdmin, isCitizen }) {
  if (isAdmin) return '/admin/dashboard';
  if (isSubAdmin) return '/subadmin/dashboard';
  if (isCitizen) return '/citizen/dashboard';
  return '/login';
}

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
  const auth = useAuth();
  const { user, loading, isAdmin } = auth;
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to={homeRouteFor(auth)} replace />;

  return children;
};

export const CitizenRoute = ({ children }) => {
  const auth = useAuth();
  const { user, loading, isCitizen } = auth;
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isCitizen) return <Navigate to={homeRouteFor(auth)} replace />;

  return children;
};

export const SubAdminRoute = ({ children }) => {
  const auth = useAuth();
  const { user, loading, isSubAdmin } = auth;
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isSubAdmin) return <Navigate to={homeRouteFor(auth)} replace />;

  return children;
};

export const PublicRoute = ({ children }) => {
  const auth = useAuth();
  const { user } = auth;
  if (user) {
    return <Navigate to={homeRouteFor(auth)} replace />;
  }
  return children;
};
