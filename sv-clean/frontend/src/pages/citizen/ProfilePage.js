import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { profileAPI } from '../../api';
import { getErrorMessage, formatDate, getImageUrl } from '../../utils/helpers';

export default function ProfilePage() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]         = useState({ fullName: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    profileAPI.get()
      .then(res => {
        const p = res.data.data;
        setProfile(p);
        setForm({ fullName: p.fullName || '', phone: p.phone || '', address: p.address || '' });
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFormErrors(fe => ({ ...fe, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) errs.phone = 'Phone must be 10 digits';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    setError(''); setSuccess('');
    try {
      const res = await profileAPI.update(form);
      setProfile(res.data.data);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setImgLoading(true);
    setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await profileAPI.uploadImage(fd);
      setProfile(res.data.data);
      setSuccess('Profile photo updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setImgLoading(false);
    }
  };

  if (loading) return (
    <Layout role="citizen" title="My Profile">
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    </Layout>
  );

  return (
    <Layout role="citizen" title="My Profile" subtitle="Manage your account information">
      {error   && <div className="alert alert-danger   alert-dismissible"><i className="bi bi-exclamation-circle me-2"></i>{error}  <button className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success  alert-dismissible"><i className="bi bi-check-circle me-2"></i>{success}<button className="btn-close" onClick={() => setSuccess('')}></button></div>}

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-4">
          <div className="card text-center">
            <div className="card-body p-4">
              {/* Avatar */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                {profile?.profileImage ? (
                  <img src={getImageUrl(profile.profileImage)} alt="Profile"
                    style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e2e8f0' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700 }}>
                    {profile?.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <label htmlFor="profileImg" style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, background: '#2563eb', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                  {imgLoading
                    ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }}></span>
                    : <i className="bi bi-camera" style={{ fontSize: '0.75rem' }}></i>}
                </label>
                <input type="file" id="profileImg" accept="image/*" className="d-none" onChange={handleImageUpload} />
              </div>

              <h5 className="fw-bold mb-1">{profile?.fullName}</h5>
              <p className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>{profile?.email}</p>
              <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem' }}>
                <i className="bi bi-person-check me-1"></i>Citizen
              </span>

              <hr />
              <div className="text-start">
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Total Complaints</span>
                  <strong>{profile?.totalComplaints ?? 0}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Member Since</span>
                  <strong style={{ fontSize: '0.8rem' }}>{formatDate(profile?.createdAt).split(',')[0]}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Account Status</span>
                  <span className="badge bg-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div><i className="bi bi-person-gear text-primary me-2"></i>Personal Information</div>
              {!editMode && (
                <button className="btn btn-sm btn-outline-primary" onClick={() => setEditMode(true)}>
                  <i className="bi bi-pencil me-1"></i>Edit
                </button>
              )}
            </div>
            <div className="card-body p-4">
              {!editMode ? (
                <div className="row g-3">
                  {[
                    ['Full Name', profile?.fullName, 'bi-person'],
                    ['Email Address', profile?.email, 'bi-envelope'],
                    ['Phone Number', profile?.phone || '—', 'bi-telephone'],
                    ['Address', profile?.address || '—', 'bi-geo-alt'],
                  ].map(([label, value, icon]) => (
                    <div className="col-sm-6" key={label}>
                      <div className="p-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <i className={`bi ${icon} text-muted`} style={{ fontSize: '0.85rem' }}></i>
                          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                        </div>
                        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <label className="form-label">Full Name <span className="text-danger">*</span></label>
                    <input type="text" name="fullName"
                      className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                      value={form.fullName} onChange={handleChange} />
                    {formErrors.fullName && <div className="invalid-feedback">{formErrors.fullName}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" value={profile?.email} disabled />
                    <div className="form-text">Email cannot be changed</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" name="phone"
                      className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                      placeholder="10-digit number" value={form.phone} onChange={handleChange} />
                    {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Address</label>
                    <textarea name="address" rows={3} className="form-control"
                      placeholder="Your residential address" value={form.address} onChange={handleChange} />
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
                      {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check2 me-2"></i>Save Changes</>}
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => { setEditMode(false); setFormErrors({}); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
