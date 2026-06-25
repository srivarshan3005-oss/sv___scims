import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { profileAPI, complaintAPI } from '../../api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { useAuth } from '../../utils/AuthContext';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [stats, setStats]         = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, compRes] = await Promise.all([
          profileAPI.getDashboard(),
          complaintAPI.getMyComplaints(0, 5),
        ]);
        setStats(dashRes.data.data);
        setComplaints(compRes.data.data.content || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = stats ? [
    { label: 'Total Complaints', value: stats.totalComplaints,    icon: 'bi-clipboard-data', border: 'border-primary', color: '#2563eb' },
    { label: 'Pending',          value: stats.pendingComplaints,  icon: 'bi-hourglass-split', border: 'border-warning', color: '#d97706' },
    { label: 'In Progress',      value: stats.inProgressComplaints, icon: 'bi-arrow-repeat', border: 'border-info',    color: '#0891b2' },
    { label: 'Resolved',         value: stats.resolvedComplaints, icon: 'bi-check-circle',   border: 'border-success', color: '#16a34a' },
  ] : [];

  if (loading) return (
    <Layout role="citizen" title="Dashboard">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary"></div>
      </div>
    </Layout>
  );

  return (
    <Layout role="citizen" title="Dashboard" subtitle={`Welcome back, ${user?.fullName}`}>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="col-6 col-lg-3">
            <div className={`stat-card ${card.border}`}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
                <i className={`bi ${card.icon} stat-icon`} style={{ color: card.color }}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Quick Actions */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center gap-2">
              <i className="bi bi-lightning text-warning"></i>
              Quick Actions
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/citizen/complaints/new" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>File New Complaint
                </Link>
                <Link to="/citizen/complaints" className="btn btn-outline-secondary">
                  <i className="bi bi-list-ul me-2"></i>View All Complaints
                </Link>
                <Link to="/citizen/profile" className="btn btn-outline-secondary">
                  <i className="bi bi-person-gear me-2"></i>Edit Profile
                </Link>
              </div>

              <hr />
              <h6 className="fw-semibold mb-3" style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Complaint Categories
              </h6>
              <div className="d-flex flex-wrap gap-1">
                {['Road Damage','Garbage','Water Leakage','Streetlight','Drainage','Public Safety'].map(cat => (
                  <span key={cat} className="badge bg-light text-secondary" style={{ fontWeight: 500 }}>{cat}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-primary"></i>
                Recent Complaints
              </div>
              <Link to="/citizen/complaints" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {complaints.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
                  <p className="text-muted mt-2 mb-0">No complaints yet</p>
                  <Link to="/citizen/complaints/new" className="btn btn-primary btn-sm mt-3">
                    File Your First Complaint
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>#ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map(c => (
                        <tr key={c.id}>
                          <td className="text-muted">#{c.id}</td>
                          <td>
                            <div className="text-truncate-2" style={{ maxWidth: 180 }} title={c.title}>
                              {c.title}
                            </div>
                          </td>
                          <td><span className="badge bg-light text-secondary">{c.categoryName}</span></td>
                          <td><StatusBadge status={c.status} /></td>
                          <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                            {formatDate(c.createdAt).split(',')[0]}
                          </td>
                          <td>
                            <Link to={`/citizen/complaints/${c.id}`} className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye"></i>
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
      </div>
    </Layout>
  );
}
