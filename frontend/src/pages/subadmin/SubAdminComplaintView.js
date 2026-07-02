import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { subAdminComplaintAPI } from '../../api';
import { formatDate, getErrorMessage, getImageUrl, STATUS_OPTIONS } from '../../utils/helpers';

const ComplaintMap = lazy(() => import('../../components/common/ComplaintMap'));

const UPDATE_STATUS_OPTIONS = STATUS_OPTIONS.filter(o => o.value !== '');

export default function SubAdminComplaintView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint]   = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [statusForm, setStatusForm] = useState({ status: '', remarks: '' });
    const [updating, setUpdating]     = useState(false);
    const [formError, setFormError]   = useState('');

    const fetchComplaint = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await subAdminComplaintAPI.getById(id);
            const data = res.data.data;
            setComplaint(data);
            setStatusForm({ status: data.status || '', remarks: data.adminRemarks || '' });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        if (!statusForm.status) { setFormError('Please select a status'); return; }
        setUpdating(true);
        setFormError('');
        try {
            const res = await subAdminComplaintAPI.updateStatus(id, {
                status:  statusForm.status,
                remarks: statusForm.remarks,
            });
            const updated = res.data.data;
            setComplaint(updated);
            setStatusForm(f => ({ ...f, status: updated.status }));
            setSuccess('Status updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setFormError(getErrorMessage(err));
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <Layout role="subadmin" title="Complaint Details">
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary"></div>
            </div>
        </Layout>
    );

    if (error && !complaint) return (
        <Layout role="subadmin" title="Complaint Details">
            <div className="alert alert-danger">{error}</div>
            <Link to="/subadmin/complaints" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>Back
            </Link>
        </Layout>
    );

    return (
        <Layout role="subadmin" title={`Complaint #${id}`} subtitle="Review and update status">
            {success && (
                <div className="alert alert-success alert-dismissible">
                    <i className="bi bi-check-circle me-2"></i>{success}
                    <button className="btn-close" onClick={() => setSuccess('')}></button>
                </div>
            )}
            {error && <div className="alert alert-warning">{error}</div>}

            <div className="d-flex gap-2 mb-4">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left me-1"></i>Back
                </button>
                <Link to="/subadmin/complaints" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-list-ul me-1"></i>All Complaints
                </Link>
            </div>

            <div className="row g-4">
                {/* Left column */}
                <div className="col-lg-8">
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <i className="bi bi-file-earmark-text text-primary me-2"></i>
                                Complaint Details
                            </div>
                            <div className="d-flex gap-2">
                                <StatusBadge status={complaint.status} />
                                <PriorityBadge priority={complaint.priority} />
                            </div>
                        </div>
                        <div className="card-body">
                            <h5 className="fw-bold mb-3">{complaint.title}</h5>
                            <div className="row g-3 mb-4">
                                {[
                                    { label: 'Category',     val: complaint.categoryName,                            icon: 'bi-tags' },
                                    { label: 'Department',   val: complaint.departmentName,                          icon: 'bi-diagram-3' },
                                    { label: 'Location',     val: complaint.location,                                icon: 'bi-geo-alt' },
                                    { label: 'Submitted By', val: `${complaint.userName} (${complaint.userEmail})`, icon: 'bi-person' },
                                    { label: 'Submitted On', val: formatDate(complaint.createdAt),                  icon: 'bi-calendar' },
                                    complaint.resolvedAt
                                        ? { label: 'Resolved On', val: formatDate(complaint.resolvedAt), icon: 'bi-check-circle' }
                                        : null,
                                ].filter(Boolean).map(item => (
                                    <div key={item.label} className="col-sm-6">
                                        <div className="d-flex align-items-start gap-2">
                                            <i className={`bi ${item.icon} text-muted mt-1`}></i>
                                            <div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                    {item.label}
                                                </div>
                                                <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{item.val}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Description
                                </div>
                                <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                    {complaint.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    {complaint.imageUrls?.length > 0 && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <i className="bi bi-image text-primary me-2"></i>Photo Evidence
                            </div>
                            <div className="card-body">
                                {complaint.imageUrls.map((url, i) => (
                                    <img key={i} src={getImageUrl(url)} alt="Evidence"
                                        className="img-fluid rounded"
                                        style={{ maxHeight: 350, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                        onError={e => { e.target.style.display = 'none'; }} />
                                ))}
                            </div>
                        </div>
                    )}

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
                            {!complaint.statusHistory?.length ? (
                                <p className="text-muted mb-0">No history</p>
                            ) : (
                                <div className="timeline">
                                    {complaint.statusHistory.map(h => (
                                        <div key={h.id} className="timeline-item">
                                            <div className="timeline-dot" style={{
                                                background: h.newStatus === 'RESOLVED' ? '#16a34a'
                                                          : h.newStatus === 'REJECTED' ? '#dc2626'
                                                          : h.newStatus === 'IN_PROGRESS' ? '#2563eb' : '#f59e0b',
                                            }}></div>
                                            <div className="timeline-content">
                                                <div className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                                                    {h.oldStatus ? `${h.oldStatus} → ` : ''}
                                                    <strong>{h.newStatus}</strong>
                                                </div>
                                                {h.remarks && (
                                                    <p className="mb-1 mt-1" style={{ fontSize: '0.8rem', color: '#475569' }}>
                                                        {h.remarks}
                                                    </p>
                                                )}
                                                <div className="timeline-date">
                                                    <i className="bi bi-shield me-1"></i>
                                                    {h.changedBy} &bull; {formatDate(h.changedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column — update panel */}
                <div className="col-lg-4">
                    <div className="card">
                        <div className="card-header">
                            <i className="bi bi-pencil-square text-primary me-2"></i>Update Status
                        </div>
                        <div className="card-body">
                            {formError && (
                                <div className="alert alert-danger py-2">{formError}</div>
                            )}
                            <form onSubmit={handleStatusUpdate}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        New Status <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        value={statusForm.status}
                                        onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
                                        required
                                    >
                                        <option value="" disabled>-- Select Status --</option>
                                        {UPDATE_STATUS_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Remarks</label>
                                    <textarea
                                        rows={4} className="form-control"
                                        placeholder="Add remarks, actions taken, or instructions for the citizen..."
                                        value={statusForm.remarks}
                                        onChange={e => setStatusForm(f => ({ ...f, remarks: e.target.value }))}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100" disabled={updating}>
                                    {updating
                                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                                        : <><i className="bi bi-check2 me-2"></i>Update Status</>}
                                </button>
                            </form>

                            <hr />
                            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem' }}>
                                <div className="text-muted mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Citizen Info
                                </div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                                        {complaint.userName?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                                            {complaint.userName}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            {complaint.userEmail}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
