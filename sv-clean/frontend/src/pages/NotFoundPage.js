import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function NotFoundPage() {
  const { user, isAdmin } = useAuth();
  const dashboardLink = !user ? '/login' : isAdmin ? '/admin/dashboard' : '/citizen/dashboard';

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3"
      style={{ background: 'linear-gradient(135deg,#1e293b,#2563eb)' }}>
      <div style={{ color: '#60a5fa', fontSize: '6rem', fontWeight: 800, lineHeight: 1 }}>404</div>
      <h2 className="text-white fw-bold mt-2 mb-3">Page Not Found</h2>
      <p className="text-white-50 mb-4">The page you're looking for doesn't exist or has been moved.</p>
      <Link to={dashboardLink} className="btn btn-light px-4">
        <i className="bi bi-house me-2"></i>Go to Dashboard
      </Link>
    </div>
  );
}
