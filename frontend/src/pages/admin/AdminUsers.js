import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/common/Layout';
import { adminUserAPI } from '../../api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

export default function AdminUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const PAGE_SIZE = 10;

  const fetchUsers = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await adminUserAPI.getAll({ search: search || undefined, page: p, size: PAGE_SIZE });
      const data = res.data.data;
      setUsers(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(p);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(0); }, [fetchUsers]);

  const handleToggle = async () => {
    if (!confirmToggle) return;
    setActionLoading(confirmToggle.id);
    try {
      await adminUserAPI.toggleStatus(confirmToggle.id);
      setSuccess(`User ${confirmToggle.isActive ? 'deactivated' : 'activated'} successfully`);
      setConfirmToggle(null);
      fetchUsers(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  return (
    <Layout role="admin" title="Manage Citizens" subtitle={`${totalElements} registered citizens`}>
      {error   && <div className="alert alert-danger   alert-dismissible">{error}  <button className="btn-close" onClick={() => setError('')}></button></div>}
      {success && <div className="alert alert-success  alert-dismissible">{success}<button className="btn-close" onClick={() => setSuccess('')}></button></div>}

      {/* Toolbar */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <form onSubmit={handleSearch} className="d-flex gap-2">
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
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
              <p className="text-muted mt-2">No citizens found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Citizen</th>
                      <th>Phone</th>
                      <th>Complaints</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="text-muted">{u.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.isActive ? '#2563eb' : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                              {u.fullName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>{u.fullName}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.875rem' }}>{u.phone || '—'}</td>
                        <td>
                          <span className="badge bg-light text-dark border fw-semibold">{u.totalComplaints}</span>
                        </td>
                        <td>
                          {u.isActive
                            ? <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}><i className="bi bi-check-circle me-1"></i>Active</span>
                            : <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}><i className="bi bi-x-circle me-1"></i>Inactive</span>}
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(u.createdAt).split(',')[0]}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${u.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => setConfirmToggle(u)}
                            disabled={actionLoading === u.id}>
                            {actionLoading === u.id
                              ? <span className="spinner-border spinner-border-sm"></span>
                              : u.isActive
                                ? <><i className="bi bi-toggle-on me-1"></i>Deactivate</>
                                : <><i className="bi bi-toggle-off me-1"></i>Activate</>}
                          </button>
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
                        <button className="page-link" onClick={() => fetchUsers(page - 1)}><i className="bi bi-chevron-left"></i></button>
                      </li>
                      {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                        const pageNum = totalPages <= 7 ? i : Math.max(0, page - 3) + i;
                        if (pageNum >= totalPages) return null;
                        return (
                          <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => fetchUsers(pageNum)}>{pageNum + 1}</button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => fetchUsers(page + 1)}><i className="bi bi-chevron-right"></i></button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Toggle Modal */}
      {confirmToggle && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  {confirmToggle.isActive ? 'Deactivate' : 'Activate'} User
                </h5>
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
                <button
                  className={`btn ${confirmToggle.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={handleToggle} disabled={actionLoading}>
                  {actionLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
