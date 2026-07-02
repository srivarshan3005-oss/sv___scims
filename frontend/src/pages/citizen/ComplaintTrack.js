import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { complaintAPI } from '../../api';
import { formatDate, getErrorMessage, getImageUrl } from '../../utils/helpers';

const ComplaintMap = lazy(() => import('../../components/common/ComplaintMap'));

export default function ComplaintTrack() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const justCreated = location.state?.created;

  useEffect(() => {
    complaintAPI.getById(id)
      .then(res => setComplaint(res.data.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout role="citizen" title="Complaint Details">
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout role="citizen" title="Complaint Details">
      <div className="alert alert-danger">{error}</div>
      <Link to="/citizen/complaints" className="btn btn-outline-secondary">
        <i className="bi bi-arrow-left me-2"></i>Back to List
      </Link>
    </Layout>
  );

  const stepOrder = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
  const currentStep = stepOrder.indexOf(complaint?.status);
  const isRejected  = complaint?.status === 'REJECTED' || complaint?.status === 'CLOSED';

  return (
    <Layout role="citizen" title={`Complaint #${id}`} subtitle="Track your complaint status">
      {justCreated && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-check-circle-fill"></i>
          <div>
            <strong>Complaint submitted successfully!</strong> We'll review it shortly.
          </div>
        </div>
      )}

      <div className="d-flex gap-2 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <Link to="/citizen/complaints/new" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-circle me-1"></i>New Complaint
        </Link>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-8">
          {/* Main Details */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-text text-primary"></i>
                <span>Complaint Details</span>
              </div>
              <div className="d-flex gap-2">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
            </div>
            <div className="card-body">
              <h5 className="fw-bold mb-3">{complaint.title}</h5>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-tags text-muted mt-1"></i>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Category</div>
                      <div className="fw-semibold">{complaint.categoryName}</div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-geo-alt text-muted mt-1"></i>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Location</div>
                      <div className="fw-semibold">{complaint.location}</div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-calendar text-muted mt-1"></i>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Submitted On</div>
                      <div className="fw-semibold">{formatDate(complaint.createdAt)}</div>
                    </div>
                  </div>
                </div>
                {complaint.resolvedAt && (
                  <div className="col-sm-6">
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle text-success mt-1"></i>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Resolved On</div>
                        <div className="fw-semibold text-success">{formatDate(complaint.resolvedAt)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-0">
                <div className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Description</div>
                <p className="mb-0" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
              </div>
            </div>
          </div>

          {/* Admin Remarks */}
          {complaint.adminRemarks && (
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-chat-left-text text-info me-2"></i>Admin Remarks
              </div>
              <div className="card-body">
                <div className="d-flex gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>Admin Response</div>
                    <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>{complaint.adminRemarks}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {complaint.imageUrls && complaint.imageUrls.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-image text-primary me-2"></i>Photo Evidence
              </div>
              <div className="card-body">
                {complaint.imageUrls.map((url, i) => (
                  <img key={i} src={getImageUrl(url)} alt={`Evidence ${i + 1}`}
                    className="img-fluid rounded"
                    style={{ maxHeight: 300, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          {/* Progress Tracker */}
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-bar-chart-steps text-primary me-2"></i>Progress
            </div>
            <div className="card-body">
              {isRejected ? (
                <div className="text-center py-2">
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    <i className="bi bi-x-circle"></i>
                  </div>
                  <div className="fw-bold mt-2 text-danger">{complaint.status}</div>
                  <small className="text-muted">This complaint has been {complaint.status.toLowerCase()}</small>
                </div>
              ) : (
                <div>
                  {[
                    { label: 'Submitted',    icon: 'bi-upload',       step: 0 },
                    { label: 'In Progress',  icon: 'bi-arrow-repeat', step: 1 },
                    { label: 'Resolved',     icon: 'bi-check-circle', step: 2 },
                  ].map((s, i) => (
                    <div key={s.label} className="d-flex align-items-center gap-3 mb-3">
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: currentStep >= s.step ? '#2563eb' : '#f1f5f9',
                        color: currentStep >= s.step ? '#fff' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem',
                        boxShadow: currentStep === s.step ? '0 0 0 4px rgba(37,99,235,0.2)' : 'none',
                      }}>
                        <i className={`bi ${s.icon}`}></i>
                      </div>
                      <div>
                        <div className={`fw-semibold ${currentStep >= s.step ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '0.875rem' }}>
                          {s.label}
                        </div>
                        {currentStep === s.step && (
                          <small className="text-primary">Current Status</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* GPS Location Map */}
          {complaint.latitude != null && (
            <div className="card mb-4">
              <div className="card-header">
                <i className="bi bi-geo-alt text-primary me-2"></i>
                GPS Location
                {complaint.gpsAccuracy != null && (
                  <small className="text-muted ms-2">(accuracy ±{Math.round(complaint.gpsAccuracy)} m)</small>
                )}
              </div>
              <div className="card-body p-0" style={{ borderRadius: '0 0 0.5rem 0.5rem', overflow: 'hidden' }}>
                <Suspense fallback={<div className="p-3 text-muted small">Loading map…</div>}>
                  <ComplaintMap complaints={[complaint]} height="280px" zoom={16} />
                </Suspense>
                <div className="px-3 py-2 border-top" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-geo me-1 text-muted"></i>
                  {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                  &nbsp;&nbsp;
                  <a href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                     target="_blank" rel="noreferrer" className="text-primary">
                    Open in Google Maps ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Status History */}
          <div className="card">
            <div className="card-header">
              <i className="bi bi-clock-history text-primary me-2"></i>Status History
            </div>
            <div className="card-body">
              {(!complaint.statusHistory || complaint.statusHistory.length === 0) ? (
                <p className="text-muted text-center mb-0">No history yet</p>
              ) : (
                <div className="timeline">
                  {complaint.statusHistory.map((h, i) => (
                    <div key={h.id} className="timeline-item">
                      <div className="timeline-dot" style={{
                        background: h.newStatus === 'RESOLVED' ? '#16a34a'
                                  : h.newStatus === 'REJECTED' ? '#dc2626'
                                  : h.newStatus === 'IN_PROGRESS' ? '#2563eb' : '#f59e0b'
                      }}></div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                            {h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : h.newStatus}
                          </div>
                        </div>
                        {h.remarks && <p className="mb-1 mt-1" style={{ fontSize: '0.8rem', color: '#475569' }}>{h.remarks}</p>}
                        <div className="timeline-date">
                          <i className="bi bi-person me-1"></i>{h.changedBy} &bull; {formatDate(h.changedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
