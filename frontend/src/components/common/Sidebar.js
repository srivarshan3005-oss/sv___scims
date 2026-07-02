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
  { to: '/admin/dashboard',   icon: 'bi-speedometer2',   label: 'Dashboard'    },
  { to: '/admin/complaints',  icon: 'bi-clipboard-data', label: 'Complaints'   },
  { to: '/admin/departments', icon: 'bi-diagram-3',      label: 'Departments'  },
  { to: '/admin/subadmins',   icon: 'bi-person-badge',   label: 'Sub Admins'   },
  { to: '/admin/users',       icon: 'bi-people',         label: 'Citizens'     },
  { to: '/admin/categories',  icon: 'bi-tags',           label: 'Categories'   },
];

const SUBADMIN_LINKS = [
  { to: '/subadmin/dashboard',  icon: 'bi-speedometer2',   label: 'Dashboard'  },
  { to: '/subadmin/complaints', icon: 'bi-clipboard-data', label: 'Complaints' },
];

const ROLE_CONFIG = {
  admin:    { links: ADMIN_LINKS,    home: '/admin/dashboard',    label: 'Super Admin', icon: 'bi-shield-fill',      badgeClass: 'role-badge-admin'    },
  subadmin: { links: SUBADMIN_LINKS, home: '/subadmin/dashboard', label: 'Sub Admin',   icon: 'bi-person-badge-fill', badgeClass: 'role-badge-subadmin' },
  citizen:  { links: CITIZEN_LINKS,  home: '/citizen/dashboard',  label: 'Citizen',     icon: 'bi-person-fill',      badgeClass: 'role-badge-citizen'  },
};

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.citizen;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.fullName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="sidebar">
      <NavLink to={config.home} className="sidebar-brand">
        <i className="bi bi-building"></i>
        SCIMS<span>.</span>
      </NavLink>

      <div className="sidebar-nav">
        <div className="sidebar-role-badge">
          <span className={`role-badge ${config.badgeClass}`}>
            <i className={`bi ${config.icon} me-1`}></i>
            {config.label}
          </span>
          {role === 'subadmin' && user?.departmentName && (
            <div className="sidebar-department-name" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
              <i className="bi bi-diagram-3 me-1"></i>{user.departmentName}
            </div>
          )}
        </div>

        {config.links.map(link => (
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
