import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { subAdminAPI, departmentAPI } from '../../api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const EMPTY_FORM = { fullName: '', email: '', password: '', phone: '', address: '', departmentId: '' };

export default function AdminSubAdmins() {
  const [subAdmins, setSubAdmins]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const PAGE_SIZE = 10;

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentAPI.getActive();
      setDepartments(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const fetchSubAdmins = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await subAdminAPI.getAll({
        search: search || undefined,
        departmentId: departmentFilter || undefined,
        page: p, size: PAGE_SIZE,
      });
      const data = res.data.data;
      setSubAdmins(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(p);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => { fetchSubAdmins(0); }, [fetchSubAdmins]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (sa) => {
    setEditItem(sa);
    setForm({
      fullName: sa.fullName, email: sa.email, password: '',
      phone: sa.phone || '', address: sa.address || '', departmentId: sa.departmentId || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!editItem && !form.password.trim()) errs.password = 'Password is required for a new account';
    if (form.password && form.password.length < 6) errs.password = 'At least 6 characters';
    if (!form.departmentId) errs.departmentId = 'Department is required';
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) errs.phone = 'Phone must be 10 digits';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    setError('');
    const payload = { ...form, departmentId: Number(form.departmentId) };
    if (!payload.password) delete payload.password; // keep existing password on update
    try {
      if (editItem) {
        await subAdminAPI.update(editItem.id, payload);
        setSuccess('Sub Admin updated successfully');
      } else {
        await subAdminAPI.create(payload);
        setSuccess('Sub Admin created successfully');
      }
      setShowModal(false);
      fetchSubAdmins(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!confirmToggle) return;
    setActionLoading(confirmToggle.id);
    try {
      await subAdminAPI.toggleStatus(confirmToggle.id);
      setSuccess(`Sub Admin ${confirmToggle.isActive ? 'deactivated' : 'activated'} successfully`);
      setConfirmToggle(null);
      fetchSubAdmins(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(deleteConfirm.id);
    try {
      await subAdminAPI.delete(deleteConfirm.id);
      setSuccess('Sub Admin removed');
      setDeleteConfirm(null);
      fetchSubAdmins(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  return (
    <Layout role="admin" title="Manage Sub Admins" subtitle={`${totalElements} sub admin accounts`}>
      {error   && <div className="alert alert-danger   alert-dismissible">{error}  <button className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success  alert-dismissible">{success}<button className="btn-close" onClick={() => setSuccess('')}></button></div>}

      {/* Toolbar */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="d-flex gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1">
              <input type="text" className="form-control" placeholder="Search by name or email..."
                value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              <button type="submit" className="btn btn-primary px-4">
                <i className="bi bi-search me-1"></i>Search
              </button>
              {search && (
                <button type="button" className="btn btn-outline-secondary"
                  onClick={() => { setSearch(''); setSearchInput(''); }}>
                  Clear
                </button>
              )}
            </form>
            <select className="form-select" style={{ maxWidth: 220 }}
              value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-circle me-2"></i>Add Sub Admin
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : subAdmins.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-person-badge" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
              <p className="text-muted mt-2">No sub admins found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sub Admin</th>
                      <th>Department</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAdmins.map(sa => (
                      <tr key={sa.id}>
                        <td className="text-muted">{sa.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: sa.isActive ? '#7c3aed' : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                              {sa.fullName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>{sa.fullName}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sa.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            <i className="bi bi-diagram-3 me-1"></i>{sa.departmentName || '—'}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.875rem' }}>{sa.phone || '—'}</td>
                        <td>
                          {sa.isActive
                            ? <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}><i className="bi bi-check-circle me-1"></i>Active</span>
                            : <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}><i className="bi bi-x-circle me-1"></i>Inactive</span>}
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(sa.createdAt).split(',')[0]}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" title="Edit" onClick={() => openEdit(sa)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className={`btn btn-sm ${sa.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => setConfirmToggle(sa)}
                              disabled={actionLoading === sa.id}>
                              {actionLoading === sa.id
                                ? <span className="spinner-border spinner-border-sm"></span>
                                : <i className={`bi ${sa.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>}
                            </button>
                            <button className="btn btn-sm btn-outline-danger" title="Remove"
                              onClick={() => setDeleteConfirm(sa)}
                              disabled={actionLoading === sa.id}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                  <small className="text-muted">Page {page + 1} of {totalPages}</small>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => fetchSubAdmins(page - 1)}><i className="bi bi-chevron-left"></i></button>
                      </li>
                      {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                        const pageNum = totalPages <= 7 ? i : Math.max(0, page - 3) + i;
                        if (pageNum >= totalPages) return null;
                        return (
                          <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => fetchSubAdmins(pageNum)}>{pageNum + 1}</button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => fetchSubAdmins(page + 1)}><i className="bi bi-chevron-right"></i></button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editItem ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-primary`}></i>
                  {editItem ? 'Edit Sub Admin' : 'Create Sub Admin'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                  <input type="text" className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                    placeholder="e.g. Road Admin 2" value={form.fullName}
                    onChange={e => { setForm(f => ({ ...f, fullName: e.target.value })); setFormErrors(fe => ({ ...fe, fullName: '' })); }} />
                  {formErrors.fullName && <div className="invalid-feedback">{formErrors.fullName}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                  <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    placeholder="name@scims.com" value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(fe => ({ ...fe, email: '' })); }} />
                  {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Password {editItem ? <small className="text-muted">(leave blank to keep current)</small> : <span className="text-danger">*</span>}
                  </label>
                  <input type="password" className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                    placeholder={editItem ? '••••••••' : 'Set an initial password'} value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setFormErrors(fe => ({ ...fe, password: '' })); }} />
                  {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Department <span className="text-danger">*</span></label>
                  <select className={`form-select ${formErrors.departmentId ? 'is-invalid' : ''}`}
                    value={form.departmentId}
                    onChange={e => { setForm(f => ({ ...f, departmentId: e.target.value })); setFormErrors(fe => ({ ...fe, departmentId: '' })); }}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {formErrors.departmentId && <div className="invalid-feedback">{formErrors.departmentId}</div>}
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold">Phone</label>
                    <input type="text" className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                      placeholder="10-digit number" value={form.phone}
                      onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setFormErrors(fe => ({ ...fe, phone: '' })); }} />
                    {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold">Address</label>
                    <input type="text" className="form-control" placeholder="Office address"
                      value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check2 me-2"></i>Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Toggle Modal */}
      {confirmToggle && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">{confirmToggle.isActive ? 'Deactivate' : 'Activate'} Sub Admin</h5>
                <button className="btn-close" onClick={() => setConfirmToggle(null)}></button>
              </div>
              <div className="modal-body text-center py-3">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {confirmToggle.isActive ? '🔒' : '🔓'}
                </div>
                <p>Are you sure you want to <strong>{confirmToggle.isActive ? 'deactivate' : 'activate'}</strong> <strong>{confirmToggle.fullName}</strong>?</p>
                {confirmToggle.isActive && <small className="text-muted">They will not be able to login until reactivated.</small>}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setConfirmToggle(null)}>Cancel</button>
                <button className={`btn ${confirmToggle.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={handleToggle} disabled={actionLoading}>
                  {actionLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Remove Sub Admin</h5>
                <button className="btn-close" onClick={() => setDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body text-center py-3">
                <i className="bi bi-trash-fill text-danger" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">Remove <strong>{deleteConfirm.fullName}</strong> as a Sub Admin?</p>
                <small className="text-muted">Their account will be deactivated; complaint history is preserved.</small>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading === deleteConfirm.id}>
                  {actionLoading === deleteConfirm.id ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
