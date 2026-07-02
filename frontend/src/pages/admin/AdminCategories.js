import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { categoryAPI, departmentAPI } from '../../api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const EMPTY_FORM = { name: '', description: '', isActive: true, departmentId: '' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [actionId, setActionId]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentAPI.getActive();
      setDepartments(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => { fetchCategories(); fetchDepartments(); }, [fetchCategories, fetchDepartments]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description || '', isActive: cat.isActive, departmentId: cat.departmentId || '' });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Category name is required';
    else if (form.name.length < 2) errs.name = 'At least 2 characters';
    if (!form.departmentId) errs.departmentId = 'Department is required — complaints in this category route to it';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    setError('');
    const payload = { ...form, departmentId: Number(form.departmentId) };
    try {
      if (editItem) {
        await categoryAPI.update(editItem.id, payload);
        setSuccess('Category updated successfully');
      } else {
        await categoryAPI.create(payload);
        setSuccess('Category created successfully');
      }
      setShowModal(false);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat) => {
    setActionId(cat.id);
    try {
      await categoryAPI.toggle(cat.id);
      setSuccess(`Category ${cat.isActive ? 'deactivated' : 'activated'}`);
      fetchCategories();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionId(deleteConfirm.id);
    try {
      await categoryAPI.delete(deleteConfirm.id);
      setSuccess('Category deleted');
      setDeleteConfirm(null);
      fetchCategories();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteConfirm(null);
    } finally {
      setActionId(null);
    }
  };

  const categoryIcons = {
    'Road Damage': 'bi-cone-striped', 'Garbage': 'bi-trash3',
    'Water Leakage': 'bi-droplet', 'Streetlight': 'bi-lightbulb',
    'Drainage': 'bi-water', 'Public Safety': 'bi-shield-exclamation',
    'Illegal Dumping': 'bi-exclamation-triangle', 'Other': 'bi-three-dots',
  };

  return (
    <Layout role="admin" title="Manage Categories" subtitle={`${categories.length} categories`}>
      {error   && <div className="alert alert-danger   alert-dismissible">{error}  <button className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success  alert-dismissible">{success}<button className="btn-close" onClick={() => setSuccess('')}></button></div>}

      <div className="d-flex justify-content-end mb-4">
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-circle me-2"></i>Add Category
        </button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <div className="row g-3">
          {categories.map(cat => (
            <div key={cat.id} className="col-md-6 col-lg-4">
              <div className="card h-100" style={{ opacity: cat.isActive ? 1 : 0.65 }}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        <i className={`bi ${categoryIcons[cat.name] || 'bi-tag'}`}></i>
                      </div>
                      <div>
                        <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{cat.name}</div>
                        <span className={`badge ${cat.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" title="Edit" onClick={() => openEdit(cat)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className={`btn btn-sm ${cat.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        title={cat.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggle(cat)}
                        disabled={actionId === cat.id}>
                        <i className={`bi ${cat.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                      </button>
                      {cat.complaintCount === 0 && (
                        <button className="btn btn-sm btn-outline-danger" title="Delete"
                          onClick={() => setDeleteConfirm(cat)}
                          disabled={actionId === cat.id}>
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  {cat.description && (
                    <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>{cat.description}</p>
                  )}
                  <div className="mb-2">
                    <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-diagram-3 me-1"></i>{cat.departmentName || 'No department'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                    <small className="text-muted">
                      <i className="bi bi-clipboard me-1"></i>{cat.complaintCount} complaints
                    </small>
                    <small className="text-muted">{formatDate(cat.createdAt).split(',')[0]}</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editItem ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-primary`}></i>
                  {editItem ? 'Edit Category' : 'Create Category'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Category Name <span className="text-danger">*</span></label>
                  <input type="text" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Road Damage" value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: '' })); }} />
                  {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea rows={3} className="form-control"
                    placeholder="Brief description of this category..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Department <span className="text-danger">*</span></label>
                  <select className={`form-select ${formErrors.departmentId ? 'is-invalid' : ''}`}
                    value={form.departmentId}
                    onChange={e => { setForm(f => ({ ...f, departmentId: e.target.value })); setFormErrors(fe => ({ ...fe, departmentId: '' })); }}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {formErrors.departmentId
                    ? <div className="invalid-feedback">{formErrors.departmentId}</div>
                    : <small className="text-muted">Complaints in this category are auto-routed to the chosen department.</small>}
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="isActiveSwitch"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="isActiveSwitch">Active (visible to citizens)</label>
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

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Delete Category</h5>
                <button className="btn-close" onClick={() => setDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body text-center py-3">
                <i className="bi bi-trash-fill text-danger" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">Delete category <strong>"{deleteConfirm.name}"</strong>?</p>
                <small className="text-muted">This cannot be undone.</small>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={actionId === deleteConfirm.id}>
                  {actionId === deleteConfirm.id ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
