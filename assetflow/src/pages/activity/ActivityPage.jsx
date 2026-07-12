import React, { useState, useEffect } from 'react';
import { Bell, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getActivityLogs } from '../../services/activityLogService';
import Card, { CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDistanceToNow, formatDateTime, capitalizeRole } from '../../utils/formatters';

const TABS = ['Notifications', 'Activity Log'];

export default function ActivityPage() {
  const [tab, setTab] = useState(0);
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Activity & Logs</h1>
        <p className="page-subtitle">Your notifications and the organisation-wide audit trail</p>
      </div>
      <div className="flex gap-1 bg-surface-900 border border-surface-700/50 rounded-xl p-1 w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${tab === i ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <NotificationsTab />}
      {tab === 1 && <ActivityLogTab />}
    </div>
  );
}

function NotificationsTab() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const NOTIF_ICONS = {
    AssetAssigned:           '📦',
    MaintenanceApproved:     '✅',
    MaintenanceRejected:     '❌',
    BookingConfirmed:        '📅',
    BookingCancelled:        '🚫',
    BookingReminder:         '⏰',
    TransferApproved:        '🔄',
    OverdueReturn:           '⚠️',
    AuditDiscrepancyFlagged: '🔍',
  };

  return (
    <Card padding={false}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-700/50">
        <span className="text-sm font-semibold text-slate-200">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300">
            Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} message="No notifications yet." />
      ) : (
        <ul className="divide-y divide-surface-700/40">
          {notifications.map(n => (
            <li key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-colors
                hover:bg-surface-700/20 ${!n.isRead ? 'bg-primary-900/10' : ''}`}
            >
              <span className="text-xl shrink-0 mt-0.5">{NOTIF_ICONS[n.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityLogTab() {
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityLogs({ pageLimit: 200 }).then(d => { setLogs(d); setLoading(false); });
  }, []);

  const ACTION_LABELS = {
    'asset.registered':    { icon: '📦', label: 'Asset Registered' },
    'asset.allocated':     { icon: '➡️', label: 'Asset Allocated' },
    'asset.returned':      { icon: '↩️', label: 'Asset Returned' },
    'asset.updated':       { icon: '✏️', label: 'Asset Updated' },
    'asset.Lost':          { icon: '🔴', label: 'Asset Lost' },
    'asset.Retired':       { icon: '🗃️', label: 'Asset Retired' },
    'maintenance.raised':  { icon: '🔧', label: 'Maintenance Raised' },
    'maintenance.approved':{ icon: '✅', label: 'Maintenance Approved' },
    'maintenance.rejected':{ icon: '❌', label: 'Maintenance Rejected' },
    'maintenance.resolved':{ icon: '🎉', label: 'Maintenance Resolved' },
    'booking.created':     { icon: '📅', label: 'Booking Created' },
    'booking.cancelled':   { icon: '🚫', label: 'Booking Cancelled' },
    'transfer.requested':  { icon: '🔄', label: 'Transfer Requested' },
    'transfer.approved':   { icon: '✅', label: 'Transfer Approved' },
    'transfer.rejected':   { icon: '❌', label: 'Transfer Rejected' },
    'audit.cycle_created': { icon: '📋', label: 'Audit Cycle Created' },
    'audit.cycle_closed':  { icon: '🔒', label: 'Audit Cycle Closed' },
    'user.role_changed':   { icon: '👤', label: 'Role Changed' },
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size="md" /></div>;

  return (
    <Card padding={false}>
      {logs.length === 0 ? (
        <EmptyState icon={Activity} message="No activity logged yet." />
      ) : (
        <ul className="divide-y divide-surface-700/40">
          {logs.map(log => {
            const meta = ACTION_LABELS[log.action] ?? { icon: '📝', label: log.action };
            return (
              <li key={log.id} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-surface-700/10 transition-colors">
                <span className="text-base shrink-0 mt-0.5">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{meta.label}</span>
                    {log.details?.assetTag && (
                      <span className="font-mono text-primary-400 text-xs">{log.details.assetTag}</span>
                    )}
                    {log.details?.name && (
                      <span className="text-slate-400 text-xs">{log.details.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500 font-mono">{log.entityType}/{log.entityId?.slice(0,8)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
