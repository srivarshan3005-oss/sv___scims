import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { complaintAPI, categoryAPI } from '../../api';
import { getErrorMessage, PRIORITY_OPTIONS } from '../../utils/helpers';

// Lazy-load the map so Leaflet only loads when GPS succeeds
const ComplaintMap = lazy(() => import('../../components/common/ComplaintMap'));

const GPS_STATUS = {
    IDLE:       'idle',        // page load — haven't tried yet
    REQUESTING: 'requesting',  // waiting for browser permission
    OK:         'ok',          // got a fix
    LOW_ACC:    'low_accuracy',// got a fix but accuracy > 10 m
    DENIED:     'denied',      // user denied permission
    UNAVAILABLE:'unavailable', // browser or device doesn't support geolocation
    TIMEOUT:    'timeout',     // took too long
};

export default function ComplaintForm() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        title: '', description: '', location: '', categoryId: '', priority: 'MEDIUM',
    });
    const [gps, setGps] = useState({
        status:   GPS_STATUS.IDLE,
        latitude: null,
        longitude: null,
        accuracy: null,  // metres
    });
    const [image, setImage]           = useState(null);
    const [preview, setPreview]       = useState(null);
    const [errors, setErrors]         = useState({});
    const [apiError, setApiError]     = useState('');
    const [loading, setLoading]       = useState(false);
    const [catLoading, setCatLoading] = useState(true);

    // Revoke object URL on unmount / preview change to avoid memory leaks
    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview); };
    }, [preview]);

    useEffect(() => {
        categoryAPI.getActive()
            .then(r => setCategories(r.data.data || []))
            .catch(() => {})
            .finally(() => setCatLoading(false));
    }, []);

    // ---------- GPS helpers ----------

    const requestGps = () => {
        if (!navigator.geolocation) {
            setGps(g => ({ ...g, status: GPS_STATUS.UNAVAILABLE }));
            return;
        }
        setGps(g => ({ ...g, status: GPS_STATUS.REQUESTING }));
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                const status = accuracy <= 10 ? GPS_STATUS.OK : GPS_STATUS.LOW_ACC;
                setGps({ status, latitude, longitude, accuracy });
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setGps(g => ({ ...g, status: GPS_STATUS.DENIED }));
                } else if (err.code === err.TIMEOUT) {
                    setGps(g => ({ ...g, status: GPS_STATUS.TIMEOUT }));
                } else {
                    setGps(g => ({ ...g, status: GPS_STATUS.UNAVAILABLE }));
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const clearGps = () => setGps({ status: GPS_STATUS.IDLE, latitude: null, longitude: null, accuracy: null });

    // ---------- Form helpers ----------

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setErrors(er => ({ ...er, [name]: '' }));
        setApiError('');
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setErrors(er => ({ ...er, image: 'Max file size is 5MB' }));
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            setErrors(er => ({ ...er, image: 'Only JPEG, PNG, GIF, WEBP allowed' }));
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setErrors(er => ({ ...er, image: '' }));
    };

    const removeImage = () => {
        setImage(null);
        setPreview(null);
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Title is required';
        else if (form.title.length < 5) errs.title = 'At least 5 characters';
        if (!form.description.trim()) errs.description = 'Description is required';
        else if (form.description.length < 10) errs.description = 'At least 10 characters';
        if (!form.location.trim()) errs.location = 'Location is required';
        if (!form.categoryId) errs.categoryId = 'Please select a category';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setLoading(true);
        setApiError('');
        try {
            const payload = {
                ...form,
                categoryId: Number(form.categoryId),
                // Include GPS if we got a fix (even low-accuracy — backend stores it as-is)
                latitude:   gps.latitude,
                longitude:  gps.longitude,
                gpsAccuracy: gps.accuracy,
            };
            const formData = new FormData();
            formData.append(
                'complaint',
                new Blob([JSON.stringify(payload)], { type: 'application/json' })
            );
            if (image) formData.append('image', image);
            const res = await complaintAPI.create(formData);
            navigate(`/citizen/complaints/${res.data.data.id}`, { state: { created: true } });
        } catch (err) {
            setApiError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // ---------- GPS status UI ----------

    const gpsHasLocation = gps.latitude != null;

    const GpsPanel = () => {
        if (gps.status === GPS_STATUS.IDLE) {
            return (
                <button type="button" className="btn btn-outline-secondary btn-sm"
                        onClick={requestGps}>
                    <i className="bi bi-geo-alt me-1"></i>Capture GPS Location
                </button>
            );
        }
        if (gps.status === GPS_STATUS.REQUESTING) {
            return (
                <span className="text-muted small">
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Waiting for GPS fix…
                </span>
            );
        }
        if (gps.status === GPS_STATUS.OK) {
            return (
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>
                        GPS ±{Math.round(gps.accuracy)} m
                    </span>
                    <small className="text-muted">
                        {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
                    </small>
                    <button type="button" className="btn btn-link btn-sm p-0 text-danger"
                            onClick={clearGps}>Remove</button>
                </div>
            );
        }
        if (gps.status === GPS_STATUS.LOW_ACC) {
            return (
                <div>
                    <div className="alert alert-warning py-2 mb-1 small">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Low accuracy (±{Math.round(gps.accuracy)} m). Location saved but may
                        be off by up to {Math.round(gps.accuracy)} metres.
                        Move to an open area and&nbsp;
                        <button type="button" className="btn btn-link btn-sm p-0 align-baseline"
                                onClick={requestGps}>try again</button>
                        &nbsp;for a better fix.
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-warning text-dark">
                            <i className="bi bi-geo me-1"></i>
                            {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
                        </span>
                        <button type="button" className="btn btn-link btn-sm p-0 text-danger"
                                onClick={clearGps}>Remove</button>
                    </div>
                </div>
            );
        }
        if (gps.status === GPS_STATUS.DENIED) {
            return (
                <div className="alert alert-secondary py-2 small mb-0">
                    <i className="bi bi-geo-slash me-1"></i>
                    Location permission denied. The complaint will be submitted
                    without GPS coordinates. You can enable location in your browser
                    settings and&nbsp;
                    <button type="button" className="btn btn-link btn-sm p-0 align-baseline"
                            onClick={requestGps}>try again</button>.
                </div>
            );
        }
        return (
            <div className="d-flex align-items-center gap-2">
                <span className="text-danger small">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    Could not get location
                </span>
                <button type="button" className="btn btn-outline-secondary btn-sm"
                        onClick={requestGps}>Retry</button>
            </div>
        );
    };

    // Preview marker for the map while still on the form
    const previewComplaint = gpsHasLocation ? [{
        id: 0, title: form.title || 'New complaint',
        status: 'PENDING', priority: form.priority,
        location: form.location,
        latitude: gps.latitude, longitude: gps.longitude, gpsAccuracy: gps.accuracy,
    }] : [];

    return (
        <Layout role="citizen" title="New Complaint" subtitle="Submit a community issue">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <i className="bi bi-plus-circle text-primary me-2"></i>
                            File a Complaint
                        </div>
                        <div className="card-body p-4">
                            {apiError && (
                                <div className="alert alert-danger d-flex align-items-center gap-2">
                                    <i className="bi bi-exclamation-circle-fill"></i>{apiError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate>
                                {/* Title */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        Complaint Title <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text" name="title"
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                        placeholder="e.g. Large pothole near school entrance"
                                        value={form.title} onChange={handleChange} maxLength={200}
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                    <div className="form-text">{form.title.length}/200 characters</div>
                                </div>

                                {/* Category & Priority */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            Category <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            name="categoryId"
                                            className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                                            value={form.categoryId}
                                            onChange={handleChange}
                                            disabled={catLoading}
                                        >
                                            <option value="">-- Select Category --</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        {errors.categoryId && (
                                            <div className="invalid-feedback">{errors.categoryId}</div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Priority</label>
                                        <select
                                            name="priority"
                                            className="form-select"
                                            value={form.priority}
                                            onChange={handleChange}
                                        >
                                            {PRIORITY_OPTIONS.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        Location / Address <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text"><i className="bi bi-geo-alt"></i></span>
                                        <input
                                            type="text" name="location"
                                            className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                                            placeholder="e.g. Main Street & 2nd Ave, Downtown"
                                            value={form.location} onChange={handleChange}
                                        />
                                        {errors.location && (
                                            <div className="invalid-feedback">{errors.location}</div>
                                        )}
                                    </div>
                                </div>

                                {/* GPS Capture */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        GPS Location
                                        <span className="ms-1 text-muted fw-normal small">(optional — helps track the exact spot)</span>
                                    </label>
                                    <GpsPanel />
                                </div>

                                {/* Live map preview */}
                                {gpsHasLocation && (
                                    <div className="mb-3">
                                        <label className="form-label">Location Preview</label>
                                        <Suspense fallback={<div className="text-muted small">Loading map…</div>}>
                                            <ComplaintMap
                                                complaints={previewComplaint}
                                                height="240px"
                                                zoom={16}
                                            />
                                        </Suspense>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        Description <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        name="description" rows={5}
                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                        placeholder="Describe the issue in detail — when did you notice it, how severe is it, what impact does it have?"
                                        value={form.description} onChange={handleChange} maxLength={2000}
                                    />
                                    {errors.description && (
                                        <div className="invalid-feedback">{errors.description}</div>
                                    )}
                                    <div className="form-text">{form.description.length}/2000 characters</div>
                                </div>

                                {/* Image Upload */}
                                <div className="mb-4">
                                    <label className="form-label">Photo Evidence (Optional)</label>
                                    {!preview ? (
                                        <div>
                                            <input
                                                type="file" id="imageInput" accept="image/*"
                                                className="d-none" onChange={handleImage}
                                            />
                                            <label
                                                htmlFor="imageInput"
                                                className="d-flex flex-column align-items-center justify-content-center gap-2"
                                                style={{
                                                    border: '2px dashed #cbd5e1',
                                                    borderRadius: '0.625rem',
                                                    padding: '2rem',
                                                    background: '#f8fafc',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <i className="bi bi-cloud-upload" style={{ fontSize: '2rem', color: '#94a3b8' }}></i>
                                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                                    Click to upload or drag &amp; drop
                                                </span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                                    JPEG, PNG, GIF, WEBP — Max 5MB
                                                </span>
                                            </label>
                                            {errors.image && (
                                                <div className="text-danger small mt-1">{errors.image}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="image-preview">
                                            <img
                                                src={preview} alt="Preview"
                                                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: '0.5rem' }}
                                            />
                                            <button
                                                type="button" className="image-remove-btn"
                                                onClick={removeImage}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                            <div className="mt-1 text-muted" style={{ fontSize: '0.8rem' }}>
                                                <i className="bi bi-image me-1"></i>{image?.name}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex gap-3">
                                    <button
                                        type="submit" className="btn btn-primary px-4"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</>
                                            : <><i className="bi bi-send me-2"></i>Submit Complaint</>}
                                    </button>
                                    <button
                                        type="button" className="btn btn-outline-secondary"
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
