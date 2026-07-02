import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { PriorityBadge } from '../../components/common/StatusBadge';
import { adminUserAPI, adminComplaintAPI } from '../../api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const ComplaintMap = lazy(() => import('../../components/common/ComplaintMap'));

export default function AdminDashboard() {
  const [stats, setStats]               = useState(null);
  const [complaints, setComplaints]     = useState([]);
  const [mapComplaints, setMapComplaints] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    Promise.all([
      adminUserAPI.getDashboard(),
      adminComplaintAPI.getAll({ page: 0, size: 8, status: 'PENDING' }),
    ])
      .then(([dashRes, compRes]) => {
        setStats(dashRes.data.data);
        setComplaints(compRes.data.data.content || []);
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

    adminComplaintAPI.getAll({ page: 0, size: 200 })
      .then(r => {
        const all = r.data?.data?.content || [];
        setMapComplaints(all.filter(c => c.latitude != null));
      })
      .catch(() => {});
  }, []);

  const statCards = stats ? [
    { label: 'Total Complaints', value: stats.totalComplaints,      icon: 'bi-clipboard-data',  border: 'border-primary', color: '#2563eb' },
    { label: 'Pending',          value: stats.pendingComplaints,    icon: 'bi-hourglass-split',  border: 'border-warning', color: '#d97706' },
    { label: 'In Progress',      value: stats.inProgressComplaints, icon: 'bi-arrow-repeat',     border: 'border-info',    color: '#0891b2' },
    { label: 'Resolved',         value: stats.resolvedComplaints,   icon: 'bi-check-circle',     border: 'border-success', color: '#16a34a' },
    { label: 'Rejected',         value: stats.rejectedComplaints,   icon: 'bi-x-circle',         border: 'border-danger',  color: '#dc2626' },
    { label: 'Total Citizens',   value: stats.totalUsers,           icon: 'bi-people',           border: 'border-primary', color: '#7c3aed' },
  ] : [];

  if (loading) return (
    <Layout role="admin" title="Admin Dashboard">
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    </Layout>
  );

  return (
    <Layout role="admin" title="Admin Dashboard" subtitle="System overview and pending actions">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Grid */}
      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-lg-4 col-xl-2">
            <div className={`stat-card ${card.border}`}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-value" style={{ color: card.color, fontSize: '1.75rem' }}>{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
                <i className={`bi ${card.icon} stat-icon`} style={{ color: card.color }}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-8">

          {/* Complaint Map */}
          {mapComplaints.length > 0 && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-map text-primary me-2"></i>
                  Complaint Locations
                </div>
                <small className="text-muted">{mapComplaints.length} with GPS</small>
              </div>
              <div className="card-body p-0" style={{ borderRadius: '0 0 0.5rem 0.5rem', overflow: 'hidden' }}>
                <Suspense fallback={<div className="p-3 text-muted small">Loading map…</div>}>
                  <ComplaintMap complaints={mapComplaints} height="380px" zoom={12} />
                </Suspense>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-hourglass-split text-warning"></i>
                Pending Complaints
                <span className="badge bg-warning text-dark">{complaints.length}</span>
              </div>
              <Link to="/admin/complaints?status=PENDING" className="btn btn-sm btn-outline-warning">
                View All Pending
              </Link>
            </div>
            <div className="card-body p-0">
              {complaints.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-check-all text-success" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2 mb-0">No pending complaints!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Citizen</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map(c => (
                        <tr key={c.id}>
                          <td className="text-muted">#{c.id}</td>
                          <td style={{ maxWidth: 180 }}>
                            <div className="text-truncate-2" title={c.title}>{c.title}</div>
                          </td>
                          <td><span className="badge bg-light text-dark border">{c.categoryName}</span></td>
                          <td><PriorityBadge priority={c.priority} /></td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{c.userName}</div>
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formatDate(c.createdAt).split(',')[0]}
                          </td>
                          <td>
                            <Link to={`/admin/complaints/${c.id}`} className="btn btn-sm btn-primary">
                              <i className="bi bi-pencil-square me-1"></i>Review
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-lightning text-warning me-2"></i>Quick Actions
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/admin/complaints" className="btn btn-outline-primary text-start">
                  <i className="bi bi-clipboard-data me-2"></i>Manage All Complaints
                </Link>
                <Link to="/admin/users" className="btn btn-outline-primary text-start">
                  <i className="bi bi-people me-2"></i>Manage Citizens
                </Link>
                <Link to="/admin/categories" className="btn btn-outline-primary text-start">
                  <i className="bi bi-tags me-2"></i>Manage Categories
                </Link>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-pie-chart text-primary me-2"></i>Status Summary
            </div>
            <div className="card-body">
              {stats && [
                { label: 'Pending',     val: stats.pendingComplaints,    total: stats.totalComplaints, color: '#d97706' },
                { label: 'In Progress', val: stats.inProgressComplaints, total: stats.totalComplaints, color: '#0891b2' },
                { label: 'Resolved',    val: stats.resolvedComplaints,   total: stats.totalComplaints, color: '#16a34a' },
                { label: 'Rejected',    val: stats.rejectedComplaints,   total: stats.totalComplaints, color: '#dc2626' },
              ].map(item => {
                const pct = item.total > 0 ? Math.round((item.val / item.total) * 100) : 0;
                return (
                  <div key={item.label} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.val} ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: 6, borderRadius: 9999 }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: item.color, borderRadius: 9999 }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {stats?.complaintsByCategory && Object.keys(stats.complaintsByCategory).length > 0 && (
            <div className="card">
              <div className="card-header">
                <i className="bi bi-tags text-primary me-2"></i>By Category
              </div>
              <div className="card-body">
                {Object.entries(stats.complaintsByCategory).map(([name, count]) => (
                  <div key={name} className="d-flex justify-content-between align-items-center py-1">
                    <span style={{ fontSize: '0.8rem' }}>{name}</span>
                    <span className="badge bg-light text-dark border fw-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
