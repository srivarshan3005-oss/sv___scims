import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { getErrorMessage } from '../utils/helpers';

const INITIAL = { fullName: '', email: '', password: '', confirmPassword: '', phone: '', address: '' };

export default function RegisterPage() {
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    else if (form.fullName.length < 2) errs.fullName = 'At least 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errs.password = 'Must contain uppercase, lowercase and number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) errs.phone = 'Phone must be 10 digits';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await authAPI.register(payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="logo-icon"><i className="bi bi-person-plus"></i></div>
          <h4>Create Your Account</h4>
          <p>Join the community — it's free</p>
        </div>

        {apiError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-exclamation-circle-fill"></i>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Full Name <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input type="text" name="fullName"
                  className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                  placeholder="John Doe" value={form.fullName} onChange={handleChange} />
                {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Email Address <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                <input type="email" name="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="you@example.com" value={form.email} onChange={handleChange} />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Password <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input type={showPw ? 'text' : 'password'} name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Min 6 chars, uppercase + number" value={form.password} onChange={handleChange} />
                <button type="button" className="input-group-text bg-transparent"
                  onClick={() => setShowPw(p => !p)}>
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                <input type="password" name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Phone Number</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                <input type="tel" name="phone"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder="10-digit number" value={form.phone} onChange={handleChange} />
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea name="address" rows={2}
                className="form-control" placeholder="Your residential address"
                value={form.address} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 mt-4" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating Account...</>
              : <><i className="bi bi-person-check me-2"></i>Create Account</>}
          </button>
        </form>

        <hr className="my-3" />
        <p className="text-center mb-0" style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-primary fw-semibold text-decoration-none">Sign In</Link>
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
