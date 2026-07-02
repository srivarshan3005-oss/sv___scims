import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { departmentAPI } from '../../api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const EMPTY_FORM = { name: '', description: '', isActive: true };

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [actionId, setActionId]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentAPI.getAll();
      setDepartments(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditItem(dept);
    setForm({ name: dept.name, description: dept.description || '', isActive: dept.isActive });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Department name is required';
    else if (form.name.length < 2) errs.name = 'At least 2 characters';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await departmentAPI.update(editItem.id, form);
        setSuccess('Department updated successfully');
      } else {
        await departmentAPI.create(form);
        setSuccess('Department created successfully');
      }
      setShowModal(false);
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (dept) => {
    setActionId(dept.id);
    try {
      await departmentAPI.toggle(dept.id);
      setSuccess(`Department ${dept.isActive ? 'deactivated' : 'activated'}`);
      fetchDepartments();
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
      await departmentAPI.delete(deleteConfirm.id);
      setSuccess('Department deleted');
      setDeleteConfirm(null);
      fetchDepartments();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteConfirm(null);
    } finally {
      setActionId(null);
    }
  };

  return (
    <Layout role="admin" title="Manage Departments" subtitle={`${departments.length} departments`}>
      {error   && <div className="alert alert-danger   alert-dismissible">{error}  <button className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success  alert-dismissible">{success}<button className="btn-close" onClick={() => setSuccess('')}></button></div>}

      <div className="d-flex justify-content-end mb-4">
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-circle me-2"></i>Add Department
        </button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-diagram-3" style={{ fontSize: '2.5rem' }}></i>
          <p className="mt-2">No departments yet. Create one to start routing categories and Sub Admins.</p>
        </div>
      ) : (
        <div className="row g-3">
          {departments.map(dept => (
            <div key={dept.id} className="col-md-6 col-lg-4">
              <div className="card h-100" style={{ opacity: dept.isActive ? 1 : 0.65 }}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        <i className="bi bi-diagram-3"></i>
                      </div>
                      <div>
                        <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{dept.name}</div>
                        <span className={`badge ${dept.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" title="Edit" onClick={() => openEdit(dept)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className={`btn btn-sm ${dept.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        title={dept.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggle(dept)}
                        disabled={actionId === dept.id}>
                        <i className={`bi ${dept.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                      </button>
                      {dept.categoryCount === 0 && dept.subAdminCount === 0 && (
                        <button className="btn btn-sm btn-outline-danger" title="Delete"
                          onClick={() => setDeleteConfirm(dept)}
                          disabled={actionId === dept.id}>
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  {dept.description && (
                    <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>{dept.description}</p>
                  )}
                  <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                    <small className="text-muted">
                      <i className="bi bi-tags me-1"></i>{dept.categoryCount} categories
                    </small>
                    <small className="text-muted">
                      <i className="bi bi-person-badge me-1"></i>{dept.subAdminCount} sub admins
                    </small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <small className="text-muted">
                      <i className="bi bi-clipboard me-1"></i>{dept.complaintCount} complaints
                    </small>
                    <small className="text-muted">{formatDate(dept.createdAt).split(',')[0]}</small>
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
                  {editItem ? 'Edit Department' : 'Create Department'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Department Name <span className="text-danger">*</span></label>
                  <input type="text" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Roads Department" value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: '' })); }} />
                  {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea rows={3} className="form-control"
                    placeholder="What this department is responsible for..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="deptIsActiveSwitch"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="deptIsActiveSwitch">Active</label>
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
                <h5 className="modal-title">Delete Department</h5>
                <button className="btn-close" onClick={() => setDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body text-center py-3">
                <i className="bi bi-trash-fill text-danger" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">Delete department <strong>"{deleteConfirm.name}"</strong>?</p>
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
