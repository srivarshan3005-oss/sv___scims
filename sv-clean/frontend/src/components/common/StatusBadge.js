import React from 'react';
import { getStatusClass, getStatusLabel, getPriorityClass } from '../../utils/helpers';

export function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span className={`priority-badge ${getPriorityClass(priority)}`}>
      {priority}
    </span>
  );
}
