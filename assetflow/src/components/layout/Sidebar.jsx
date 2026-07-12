import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  Calendar, Wrench, ClipboardList, BarChart2,
  Bell, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import brandLogo from '../../assets/activotrack-logo.png';

const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',            icon: LayoutDashboard, roles: ['admin','asset_manager','department_head','employee'] },
  { path: '/org',          label: 'Organisation',         icon: Building2,       roles: ['admin'] },
  { path: '/assets',       label: 'Assets',               icon: Package,         roles: ['admin','asset_manager','department_head','employee'] },
  { path: '/allocations',  label: 'Allocation & Transfer',icon: ArrowLeftRight,  roles: ['admin','asset_manager','department_head','employee'] },
  { path: '/bookings',     label: 'Resource Booking',     icon: Calendar,        roles: ['admin','asset_manager','department_head','employee'] },
  { path: '/maintenance',  label: 'Maintenance',          icon: Wrench,          roles: ['admin','asset_manager','department_head','employee'] },
  { path: '/audit',        label: 'Audit',                icon: ClipboardList,   roles: ['admin','asset_manager'] },
  { path: '/reports',      label: 'Reports',              icon: BarChart2,       roles: ['admin','asset_manager'] },
  { path: '/activity',     label: 'Notifications',        icon: Bell,            roles: ['admin','asset_manager','department_head','employee'] },
];

export default function Sidebar() {
  const { role, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-surface-900 border-r border-surface-700/50',
        'transition-all duration-300 shrink-0',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-700/50">
        <img src={brandLogo} alt="Activotrack" className="w-8 h-8 shrink-0 object-contain" />
        {!collapsed && (
          <span className="text-base font-bold text-slate-100 tracking-tight">Activotrack</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active', collapsed && 'justify-center px-0')
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-2 py-3 border-t border-surface-700/50">
        {!collapsed && userProfile && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-slate-200 truncate">{userProfile.name}</p>
            <p className="text-xs text-slate-500 capitalize truncate">{userProfile.role?.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Logout"
          className={clsx(
            'nav-item w-full text-red-400/80 hover:text-red-400 hover:bg-red-900/20',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
