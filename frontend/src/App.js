import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import { AdminRoute, CitizenRoute, SubAdminRoute, PublicRoute } from './components/auth/PrivateRoute';

// Pages
import LandingPage     from './pages/LandingPage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import NotFoundPage    from './pages/NotFoundPage';

// Citizen Pages
import CitizenDashboard    from './pages/citizen/CitizenDashboard';
import ComplaintForm       from './pages/citizen/ComplaintForm';
import ComplaintList       from './pages/citizen/ComplaintList';
import ComplaintTrack      from './pages/citizen/ComplaintTrack';
import ProfilePage         from './pages/citizen/ProfilePage';

// Admin Pages
import AdminDashboard      from './pages/admin/AdminDashboard';
import AdminComplaints     from './pages/admin/AdminComplaints';
import AdminComplaintView  from './pages/admin/AdminComplaintView';
import AdminUsers          from './pages/admin/AdminUsers';
import AdminCategories     from './pages/admin/AdminCategories';
import AdminDepartments    from './pages/admin/AdminDepartments';
import AdminSubAdmins      from './pages/admin/AdminSubAdmins';

// Sub Admin Pages
import SubAdminDashboard     from './pages/subadmin/SubAdminDashboard';
import SubAdminComplaints    from './pages/subadmin/SubAdminComplaints';
import SubAdminComplaintView from './pages/subadmin/SubAdminComplaintView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Citizen */}
          <Route path="/citizen/dashboard" element={<CitizenRoute><CitizenDashboard /></CitizenRoute>} />
          <Route path="/citizen/complaints" element={<CitizenRoute><ComplaintList /></CitizenRoute>} />
          <Route path="/citizen/complaints/new" element={<CitizenRoute><ComplaintForm /></CitizenRoute>} />
          <Route path="/citizen/complaints/:id" element={<CitizenRoute><ComplaintTrack /></CitizenRoute>} />
          <Route path="/citizen/profile" element={<CitizenRoute><ProfilePage /></CitizenRoute>} />

          {/* Super Admin */}
          <Route path="/admin/dashboard"   element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/complaints"  element={<AdminRoute><AdminComplaints /></AdminRoute>} />
          <Route path="/admin/complaints/:id" element={<AdminRoute><AdminComplaintView /></AdminRoute>} />
          <Route path="/admin/users"       element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/categories"  element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/departments" element={<AdminRoute><AdminDepartments /></AdminRoute>} />
          <Route path="/admin/subadmins"   element={<AdminRoute><AdminSubAdmins /></AdminRoute>} />

          {/* Sub Admin — department-scoped complaint management */}
          <Route path="/subadmin/dashboard"      element={<SubAdminRoute><SubAdminDashboard /></SubAdminRoute>} />
          <Route path="/subadmin/complaints"     element={<SubAdminRoute><SubAdminComplaints /></SubAdminRoute>} />
          <Route path="/subadmin/complaints/:id" element={<SubAdminRoute><SubAdminComplaintView /></SubAdminRoute>} />

          {/* Fallback */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
