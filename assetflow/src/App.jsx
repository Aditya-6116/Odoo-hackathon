import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './guards/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages — lazy loaded for performance
import LoginPage        from './pages/auth/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import OrgSetupPage     from './pages/org/OrgSetupPage';
import AssetsPage       from './pages/assets/AssetsPage';
import AssetDetailPage  from './pages/assets/AssetDetailPage';
import AllocationsPage  from './pages/allocations/AllocationsPage';
import BookingsPage     from './pages/bookings/BookingsPage';
import MaintenancePage  from './pages/maintenance/MaintenancePage';
import AuditPage        from './pages/audit/AuditPage';
import ReportsPage      from './pages/reports/ReportsPage';
import ActivityPage     from './pages/activity/ActivityPage';

const ADMIN         = ['admin'];
const ADMIN_AM      = ['admin', 'asset_manager'];
const ALL_AUTH      = ['admin', 'asset_manager', 'department_head', 'employee'];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected — inside shared layout */}
            <Route
              element={
                <ProtectedRoute allowedRoles={ALL_AUTH}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard"    element={<DashboardPage />} />
              <Route
                path="/org"
                element={
                  <ProtectedRoute allowedRoles={ADMIN}>
                    <OrgSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/assets"          element={<AssetsPage />} />
              <Route path="/assets/:id"      element={<AssetDetailPage />} />
              <Route path="/allocations"     element={<AllocationsPage />} />
              <Route path="/bookings"        element={<BookingsPage />} />
              <Route path="/maintenance"     element={<MaintenancePage />} />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_AM}>
                    <AuditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_AM}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/activity"        element={<ActivityPage />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
