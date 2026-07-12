import React, { useState } from 'react';
import { Bell, CheckCheck, Package, Wrench, Calendar, ArrowLeftRight, AlertTriangle, ClipboardList } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { formatDistanceToNow } from '../../utils/formatters';

// Map notification types to filter categories
const TYPE_CATEGORY = {
  AssetAssigned:           'Alerts',
  OverdueReturn:           'Alerts',
  AuditDiscrepancyFlagged: 'Alerts',
  MaintenanceApproved:     'Approvals',
  MaintenanceRejected:     'Approvals',
  TransferApproved:        'Approvals',
  TransferRejected:        'Approvals',
  BookingConfirmed:        'Bookings',
  BookingCancelled:        'Bookings',
  BookingReminder:         'Bookings',
};

const TABS = ['All', 'Alerts', 'Approvals', 'Bookings'];

// Per-type icon config
const TYPE_META = {
  AssetAssigned:           { icon: Package,       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  MaintenanceApproved:     { icon: CheckCheck,    color: 'text-green-400',  bg: 'bg-green-500/10' },
  MaintenanceRejected:     { icon: Wrench,        color: 'text-red-400',    bg: 'bg-red-500/10' },
  BookingConfirmed:        { icon: Calendar,      color: 'text-purple-400', bg: 'bg-purple-500/10' },
  BookingCancelled:        { icon: Calendar,      color: 'text-red-400',    bg: 'bg-red-500/10' },
  BookingReminder:         { icon: Calendar,      color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  TransferApproved:        { icon: ArrowLeftRight,color: 'text-green-400',  bg: 'bg-green-500/10' },
  TransferRejected:        { icon: ArrowLeftRight,color: 'text-red-400',    bg: 'bg-red-500/10' },
  OverdueReturn:           { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  AuditDiscrepancyFlagged: { icon: ClipboardList, color: 'text-red-400',    bg: 'bg-red-500/10' },
};

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('All');
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const filtered = activeTab === 'All'
    ? notifications
    : notifications.filter(n => (TYPE_CATEGORY[n.type] ?? 'Alerts') === activeTab);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated on asset activity across your organisation</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-colors"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs — matches mockup */}
      <div className="flex gap-2">
        {TABS.map(tab => {
          const count = tab === 'All'
            ? notifications.filter(n => !n.isRead).length
            : notifications.filter(n => !n.isRead && (TYPE_CATEGORY[n.type] ?? 'Alerts') === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2
                ${activeTab === tab
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'bg-surface-800 border border-surface-700/50 text-slate-400 hover:text-slate-200 hover:border-surface-600'
                }`}
            >
              {tab}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-primary-600/30 text-primary-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            message={activeTab === 'All' ? 'No notifications yet.' : `No ${activeTab.toLowerCase()} notifications.`}
          />
        ) : (
          <ul className="divide-y divide-surface-700/40">
            {filtered.map(n => {
              const meta = TYPE_META[n.type] ?? { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/10' };
              const Icon = meta.icon;
              return (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors
                    hover:bg-surface-700/20 ${!n.isRead ? 'bg-primary-900/10' : ''}`}
                >
                  {/* Icon badge */}
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5 ${meta.bg}`}>
                    <Icon size={16} className={meta.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'text-slate-100 font-medium' : 'text-slate-300'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(n.createdAt)}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
