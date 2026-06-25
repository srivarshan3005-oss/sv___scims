import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

const CITIZEN_LINKS = [
  { to: '/citizen/dashboard',      icon: 'bi-speedometer2',   label: 'Dashboard'     },
  { to: '/citizen/complaints',     icon: 'bi-list-ul',         label: 'My Complaints' },
  { to: '/citizen/complaints/new', icon: 'bi-plus-circle',     label: 'New Complaint' },
  { to: '/citizen/profile',        icon: 'bi-person-circle',   label: 'My Profile'    },
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard',   icon: 'bi-speedometer2',   label: 'Dashboard'   },
  { to: '/admin/complaints',  icon: 'bi-clipboard-data', label: 'Complaints'  },
  { to: '/admin/users',       icon: 'bi-people',         label: 'Users'       },
  { to: '/admin/categories',  icon: 'bi-tags',           label: 'Categories'  },
];

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  const links = isAdmin ? ADMIN_LINKS : CITIZEN_LINKS;
  const homeRoute = isAdmin ? '/admin/dashboard' : '/citizen/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.fullName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="sidebar">
      <NavLink to={homeRoute} className="sidebar-brand">
        <i className="bi bi-building"></i>
        SCIMS<span>.</span>
      </NavLink>

      <div className="sidebar-nav">
        <div className="sidebar-role-badge">
          <span className={`role-badge ${isAdmin ? 'role-badge-admin' : 'role-badge-citizen'}`}>
            <i className={`bi ${isAdmin ? 'bi-shield-fill' : 'bi-person-fill'} me-1`}></i>
            {isAdmin ? 'Admin' : 'Citizen'}
          </span>
        </div>

        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${link.icon}`}></i>
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-sm w-100 mt-2 btn-logout">
          <i className="bi bi-box-arrow-right me-2"></i>Logout
        </button>
      </div>
    </div>
  );
}
