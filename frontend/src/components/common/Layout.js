import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, role, title, subtitle }) {
  return (
    <div className="d-flex">
      <Sidebar role={role} />
      <div className="main-content flex-grow-1">
        <div className="content-header">
          <div>
            <h5 className="mb-0 fw-bold">{title}</h5>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
        </div>
        <div className="content-body">
          {children}
        </div>
      </div>
    </div>
  );
}
