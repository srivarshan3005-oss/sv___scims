import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { adminComplaintAPI, categoryAPI } from '../../api';
import { formatDate, getErrorMessage, STATUS_OPTIONS } from '../../utils/helpers';

export default function AdminComplaints() {
    const [searchParams] = useSearchParams();
    const [complaints, setComplaints]       = useState([]);
    const [categories, setCategories]       = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const [page, setPage]                   = useState(0);
    const [totalPages, setTotalPages]       = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({
        status:     searchParams.get('status') || '',
        categoryId: '',
        search:     '',
    });
    const [searchInput, setSearchInput] = useState('');
    const PAGE_SIZE = 10;

    useEffect(() => {
        categoryAPI.getActive()
            .then(r => setCategories(r.data.data || []))
            .catch(() => {});
    }, []);

    const fetchComplaints = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const params = { page: p, size: PAGE_SIZE };
            if (filters.status)     params.status     = filters.status;
            /**
             * categoryId from <select> value is a string (e.g. "3").
             * Backend expects a Long. Convert to Number so Axios serialises it
             * as a plain integer in the query string, e.g. ?categoryId=3
             * not ?categoryId=3 (string would also work in QS but Number is correct).
             * More importantly, ensure we only send it when genuinely selected.
             */
            if (filters.categoryId) params.categoryId = Number(filters.categoryId);
            if (filters.search)     params.search     = filters.search;
            const res = await adminComplaintAPI.getAll(params);
            const data = res.data.data;
            setComplaints(data.content || []);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
            setPage(p);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchComplaints(0); }, [fetchComplaints]);

    const handleFilterChange = (key, value) => {
        setFilters(f => ({ ...f, [key]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(f => ({ ...f, search: searchInput }));
    };

    const handleReset = () => {
        setFilters({ status: '', categoryId: '', search: '' });
        setSearchInput('');
    };

    return (
        <Layout role="admin" title="Manage Complaints" subtitle={`${totalElements} total complaints`}>
            {error && (
                <div className="alert alert-danger alert-dismissible">
                    {error}
                    <button className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body py-3">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                Status
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.status}
                                onChange={e => handleFilterChange('status', e.target.value)}
                            >
                                {STATUS_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                Category
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.categoryId}
                                onChange={e => handleFilterChange('categoryId', e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                Search
                            </label>
                            <form onSubmit={handleSearch} className="d-flex gap-1">
                                <input
                                    type="text" className="form-control form-control-sm"
                                    placeholder="Search by title or location..."
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                />
                                <button type="submit" className="btn btn-sm btn-primary px-3">
                                    <i className="bi bi-search"></i>
                                </button>
                            </form>
                        </div>
                        <div className="col-md-2">
                            <button className="btn btn-sm btn-outline-secondary w-100" onClick={handleReset}>
                                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
                            </button>
                        </div>
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
                            <button className="btn btn-sm btn-outline-secondary" onClick={handleReset}>
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>#ID</th>
                                            <th>Title / Location</th>
                                            <th>Category</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Citizen</th>
                                            <th>Submitted</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {complaints.map(c => (
                                            <tr key={c.id}>
                                                <td className="text-muted fw-semibold">#{c.id}</td>
                                                <td style={{ maxWidth: 200 }}>
                                                    <div className="text-truncate-2 fw-semibold" title={c.title}>
                                                        {c.title}
                                                    </div>
                                                    <small className="text-muted d-block text-truncate">
                                                        <i className="bi bi-geo-alt me-1"></i>{c.location}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border">
                                                        {c.categoryName}
                                                    </span>
                                                </td>
                                                <td><PriorityBadge priority={c.priority} /></td>
                                                <td><StatusBadge status={c.status} /></td>
                                                <td>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                                        {c.userName}
                                                    </div>
                                                    <small className="text-muted">{c.userEmail}</small>
                                                </td>
                                                <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                    {formatDate(c.createdAt).split(',')[0]}
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/admin/complaints/${c.id}`}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        <i className="bi bi-eye me-1"></i>View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                                    <small className="text-muted">
                                        Page {page + 1} of {totalPages} &bull; {totalElements} complaints
                                    </small>
                                    <nav>
                                        <ul className="pagination pagination-sm mb-0">
                                            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => fetchComplaints(page - 1)}>
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>
                                            </li>
                                            {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                                                // For large page counts, only show a window of pages around current
                                                const pageNum = totalPages <= 7 ? i : Math.max(0, page - 3) + i;
                                                if (pageNum >= totalPages) return null;
                                                return (
                                                    <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => fetchComplaints(pageNum)}>
                                                            {pageNum + 1}
                                                        </button>
                                                    </li>
                                                );
                                            })}
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
        </Layout>
    );
}
