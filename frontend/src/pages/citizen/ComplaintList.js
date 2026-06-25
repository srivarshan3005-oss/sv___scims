import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { complaintAPI } from '../../api';
import { formatDate, getErrorMessage, STATUS_OPTIONS } from '../../utils/helpers';

export default function ComplaintList() {
  const [complaints, setComplaints]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [page, setPage]                     = useState(0);
  const [totalPages, setTotalPages]         = useState(0);
  const [totalElements, setTotalElements]   = useState(0);
  const [statusFilter, setStatusFilter]     = useState('');
  const [deleteId, setDeleteId]             = useState(null);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const PAGE_SIZE = 10;

  const fetchComplaints = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await complaintAPI.getMyComplaints(p, PAGE_SIZE);
      const data = res.data.data;
      // Apply status filter client-side only on the current page.
      // This is acceptable because citizens rarely have hundreds of complaints.
      // A proper server-side filter endpoint would require backend changes.
      const content = data.content || [];
      const filtered = statusFilter
        ? content.filter(c => c.status === statusFilter)
        : content;
      setComplaints(filtered);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(p);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchComplaints(0); }, [fetchComplaints]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await complaintAPI.delete(deleteId);
      setDeleteId(null);
      fetchComplaints(page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout role="citizen" title="My Complaints" subtitle={`${totalElements} total complaints`}>
      {error && (
        <div className="alert alert-danger alert-dismissible">
          <i className="bi bi-exclamation-circle me-2"></i>{error}
          <button className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <label className="form-label mb-0 fw-semibold">Filter by Status:</label>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`btn btn-sm ${statusFilter === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Link to="/citizen/complaints/new" className="btn btn-primary btn-sm">
              <i className="bi bi-plus-circle me-1"></i>New Complaint
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
              <p className="text-muted mt-2">No complaints found</p>
              <Link to="/citizen/complaints/new" className="btn btn-primary btn-sm">
                <i className="bi bi-plus-circle me-1"></i>File First Complaint
              </Link>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map(c => (
                      <tr key={c.id}>
                        <td className="text-muted fw-semibold">#{c.id}</td>
                        <td>
                          <div style={{ maxWidth: 220 }} className="text-truncate-2" title={c.title}>
                            {c.title}
                          </div>
                          <small className="text-muted d-block text-truncate" style={{ maxWidth: 220 }}>
                            <i className="bi bi-geo-alt me-1"></i>{c.location}
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{c.categoryName}</span>
                        </td>
                        <td><PriorityBadge priority={c.priority} /></td>
                        <td><StatusBadge status={c.status} /></td>
                        <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(c.createdAt).split(',')[0]}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Link
                              to={`/citizen/complaints/${c.id}`}
                              className="btn btn-sm btn-outline-primary"
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                            {c.status === 'PENDING' && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title="Delete"
                                onClick={() => setDeleteId(c.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                  <small className="text-muted">Page {page + 1} of {totalPages}</small>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => fetchComplaints(page - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => fetchComplaints(i)}>{i + 1}</button>
                        </li>
                      ))}
                      <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => fetchComplaints(page + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Delete Complaint</h5>
                <button className="btn-close" onClick={() => setDeleteId(null)}></button>
              </div>
              <div className="modal-body text-center py-2">
                <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3 mb-0">
                  Are you sure you want to delete complaint <strong>#{deleteId}</strong>?
                </p>
                <small className="text-muted">This action cannot be undone.</small>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading && <span className="spinner-border spinner-border-sm me-1"></span>}
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
