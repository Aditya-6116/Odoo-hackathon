import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/org':         'Organisation Setup',
  '/assets':      'Asset Registry',
  '/allocations': 'Allocation & Transfer',
  '/bookings':    'Resource Booking',
  '/maintenance': 'Maintenance',
  '/audit':       'Audit',
  '/reports':     'Reports & Analytics',
  '/activity':    'Activity & Logs',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'AssetFlow';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar pageTitle={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
