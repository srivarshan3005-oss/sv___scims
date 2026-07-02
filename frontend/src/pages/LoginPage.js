import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { getErrorMessage } from '../utils/helpers';

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      const role = user.role;
      if (from) { navigate(from, { replace: true }); return; }
      const home = role === 'ROLE_ADMIN' ? '/admin/dashboard'
                 : role === 'ROLE_SUB_ADMIN' ? '/subadmin/dashboard'
                 : '/citizen/dashboard';
      navigate(home, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin')    setForm({ email: 'admin@scims.com',       password: 'Admin@123' });
    if (type === 'subadmin') setForm({ email: 'road.admin1@scims.com', password: 'Citizen@123' });
    if (type === 'citizen')  setForm({ email: 'john@example.com',      password: 'Citizen@123' });
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"><i className="bi bi-building"></i></div>
          <h4>Welcome Back</h4>
          <p>Sign in to your SCIMS account</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-exclamation-circle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Demo credentials */}
        <div className="d-flex gap-2 mb-3">
          <button type="button" className="btn btn-sm btn-outline-secondary flex-1 w-100" onClick={() => fillDemo('admin')}>
            <i className="bi bi-shield-fill me-1"></i>Super Admin
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary flex-1 w-100" onClick={() => fillDemo('subadmin')}>
            <i className="bi bi-person-badge me-1"></i>Sub Admin
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary flex-1 w-100" onClick={() => fillDemo('citizen')}>
            <i className="bi bi-person me-1"></i>Citizen
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope"></i></span>
              <input
                type="email" name="email" className="form-control"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} autoComplete="email" required />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input
                type={showPw ? 'text' : 'password'} name="password"
                className="form-control" placeholder="••••••••"
                value={form.password} onChange={handleChange}
                autoComplete="current-password" required />
              <button type="button" className="input-group-text bg-transparent border-start-0 cursor-pointer"
                onClick={() => setShowPw(p => !p)}>
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing In...</>
              : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>}
          </button>
        </form>

        <hr className="my-4" />
        <p className="text-center mb-0" style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" className="text-primary fw-semibold text-decoration-none">
            Create one free
          </Link>
        </p>
        <p className="text-center mt-2 mb-0">
          <Link to="/" className="text-secondary text-decoration-none" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-arrow-left me-1"></i>Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
