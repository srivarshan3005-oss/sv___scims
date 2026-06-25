import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { complaintAPI, categoryAPI } from '../../api';
import { getErrorMessage, PRIORITY_OPTIONS } from '../../utils/helpers';

export default function ComplaintForm() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        title: '', description: '', location: '', categoryId: '', priority: 'MEDIUM',
    });
    const [image, setImage]           = useState(null);
    const [preview, setPreview]       = useState(null);
    const [errors, setErrors]         = useState({});
    const [apiError, setApiError]     = useState('');
    const [loading, setLoading]       = useState(false);
    const [catLoading, setCatLoading] = useState(true);

    useEffect(() => {
        // Revoke the object URL when the component unmounts or preview changes
        // to prevent memory leaks.
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    useEffect(() => {
        categoryAPI.getActive()
            .then(r => setCategories(r.data.data || []))
            .catch(() => {})
            .finally(() => setCatLoading(false));
    }, []);

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
        setPreview(null); // triggers useEffect cleanup to revokeObjectURL
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
            /**
             * categoryId comes from <select> as a string.
             * Backend @NotNull Long categoryId requires a number in JSON.
             * Convert to Number before serialising so Jackson can deserialise
             * it as Long without a 400 Bad Request / MethodArgumentNotValid error.
             */
            const payload = {
                ...form,
                categoryId: Number(form.categoryId),
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
                                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
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
