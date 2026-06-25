// ============================================================
// Date / Time helpers
// ============================================================

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  });
};

// ============================================================
// Badge / CSS class helpers
// ============================================================

export const getStatusClass = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':     return 'badge-pending';
    case 'IN_PROGRESS': return 'badge-in_progress';
    case 'RESOLVED':    return 'badge-resolved';
    case 'REJECTED':    return 'badge-rejected';
    case 'CLOSED':      return 'badge-closed';
    default:            return 'bg-secondary text-white';
  }
};

export const getStatusLabel = (status) => {
  if (!status) return '';
  // Convert IN_PROGRESS → "In Progress", etc.
  return status
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
};

export const getPriorityClass = (priority) => {
  switch ((priority || '').toUpperCase()) {
    case 'LOW':    return 'badge-low';
    case 'MEDIUM': return 'badge-medium';
    case 'HIGH':   return 'badge-high';
    case 'URGENT': return 'badge-urgent';
    default:       return 'bg-secondary text-white';
  }
};

// ============================================================
// Error message extraction from Axios error
// ============================================================

export const getErrorMessage = (error) => {
  // Validation error: data.data is { fieldName: "message", ... }
  if (error?.response?.data?.data &&
      typeof error.response.data.data === 'object' &&
      !Array.isArray(error.response.data.data)) {
    return Object.values(error.response.data.data).join(', ');
  }
  // Standard API error message
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  // Network / timeout errors
  if (error?.message) return error.message;
  return 'An unexpected error occurred. Please try again.';
};

// ============================================================
// Image URL builder
// ============================================================

/**
 * In development, CRA's proxy forwards /api/uploads/... to the backend,
 * so we just use the path as-is. The backend static handler serves
 * /uploads/** (without /api prefix) so the URL becomes /api/uploads/...
 * because the context-path is /api.
 *
 * imageUrl from backend is already "/uploads/complaints/uuid.jpg"
 * We prepend /api so the CRA proxy can forward it.
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;       // absolute URL — use as-is
  // path is like "/uploads/complaints/abc.jpg"
  // CRA proxy: /api/uploads/... → http://localhost:8080/api/uploads/...
  if (path.startsWith('/uploads/')) {
    return `/api${path}`;
  }
  return path;
};

// ============================================================
// Static option lists
// ============================================================

export const STATUS_OPTIONS = [
  { value: '',            label: 'All Statuses' },
  { value: 'PENDING',     label: 'Pending'      },
  { value: 'IN_PROGRESS', label: 'In Progress'  },
  { value: 'RESOLVED',    label: 'Resolved'     },
  { value: 'REJECTED',    label: 'Rejected'     },
  { value: 'CLOSED',      label: 'Closed'       },
];

export const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: 'Low'    },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH',   label: 'High'   },
  { value: 'URGENT', label: 'Urgent' },
];
