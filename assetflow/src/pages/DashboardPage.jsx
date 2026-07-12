import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Users, AlertTriangle, Wrench,
  Calendar, ArrowLeftRight, Plus, RotateCcw,
} from 'lucide-react';
import { collection, getCountFromServer, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sweepOverdueAllocations } from '../services/allocationService';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { formatDistanceToNow } from '../utils/formatters';

async function countWhere(collectionName, ...constraints) {
  try {
    const snap = await getCountFromServer(query(collection(db, collectionName), ...constraints));
    return snap.data().count;
  } catch { return 0; }
}

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [activity, setActivity] = useState([]);

  // Sweep overdue allocations on mount (lightweight alternative to Cloud Function)
  useEffect(() => { sweepOverdueAllocations().catch(() => {}); }, []);

  // Fetch KPI counts
  useEffect(() => {
    async function load() {
      const [total, available, allocated, maintenance, overdue, bookings, users] = await Promise.all([
        countWhere('assets'),
        countWhere('assets', where('status', '==', 'Available')),
        countWhere('assets', where('status', '==', 'Allocated')),
        countWhere('assets', where('status', '==', 'Under Maintenance')),
        countWhere('allocations', where('status', '==', 'overdue')),
        countWhere('bookings', where('status', 'in', ['Upcoming', 'Ongoing'])),
        countWhere('users', where('status', '==', 'active')),
      ]);
      setStats({ total, available, allocated, maintenance, overdue, bookings, users });
      setLoading(false);
    }
    load();
  }, []);

  // Real-time recent activity
  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(8));
    return onSnapshot(q, (snap) => {
      setActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const ACTION_MAP = {
    'asset.registered':   { label: 'Asset registered',    color: 'text-emerald-400' },
    'asset.allocated':    { label: 'Asset allocated',     color: 'text-primary-700' },
    'asset.returned':     { label: 'Asset returned',      color: 'text-slate-400' },
    'maintenance.raised': { label: 'Maintenance raised',  color: 'text-amber-400' },
    'maintenance.approved':{ label: 'Maintenance approved',color: 'text-primary-700' },
    'maintenance.resolved':{ label: 'Maintenance resolved',color: 'text-emerald-400' },
    'booking.created':    { label: 'Booking created',     color: 'text-primary-700' },
    'transfer.requested': { label: 'Transfer requested',  color: 'text-amber-400' },
    'transfer.approved':  { label: 'Transfer approved',   color: 'text-emerald-400' },
    'audit.cycle_created':{ label: 'Audit cycle started', color: 'text-primary-700' },
    'audit.cycle_closed': { label: 'Audit cycle closed',  color: 'text-slate-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-surface-850">
          Good {hour()}, {userProfile?.name?.split(' ')[0] ?? 'there'} 👋
        </h2>
        <p className="text-slate-500 text-sm mt-1">Here's your asset overview for today.</p>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard label="Total Assets"      value={stats.total}       icon={Package}       color="blue" />
          <StatCard label="Available"         value={stats.available}   icon={Package}       color="emerald" />
          <StatCard label="Allocated"         value={stats.allocated}   icon={ArrowLeftRight} color="blue" />
          <StatCard label="Under Maintenance" value={stats.maintenance} icon={Wrench}        color="amber" />
          <StatCard label="Overdue Returns"   value={stats.overdue}     icon={AlertTriangle} color="red" />
          <StatCard label="Active Bookings"   value={stats.bookings}    icon={Calendar}      color="purple" />
          <StatCard label="Active Employees"  value={stats.users}       icon={Users}         color="slate" />
        </div>
      )}

      {/* Overdue banner */}
      {stats.overdue > 0 && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/40 rounded-xl px-5 py-3.5">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              {stats.overdue} overdue {stats.overdue === 1 ? 'return' : 'returns'} — action required
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">Assets past their expected return date</p>
          </div>
          <Button size="sm" variant="danger" onClick={() => navigate('/allocations')}>
            View
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Quick actions */}
        <Card>
          <CardHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Register Asset',   icon: Plus,         path: '/assets',      roles: ['admin','asset_manager'] },
              { label: 'Allocate Asset',   icon: ArrowLeftRight,path: '/allocations', roles: ['admin','asset_manager'] },
              { label: 'Book Resource',    icon: Calendar,     path: '/bookings',    roles: null },
              { label: 'Report Maintenance',icon: Wrench,      path: '/maintenance', roles: null },
            ].filter(a => !a.roles || a.roles.includes(userProfile?.role)).map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-surface-700/40
                           hover:bg-surface-700 border border-surface-700/50 hover:border-primary-700/50
                           transition-all duration-150 text-center group"
              >
                <div className="p-2 rounded-lg bg-primary-900/40 text-primary-400 group-hover:bg-primary-800/60 transition-colors">
                  <action.icon size={18} />
                </div>
                <span className="text-xs font-medium text-slate-300 leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="xl:col-span-2">
          <CardHeader title="Recent Activity" subtitle="Live updates" />
          <ul className="space-y-3">
            {activity.length === 0 && (
              <li className="text-sm text-slate-500 py-4 text-center">No recent activity yet.</li>
            )}
            {activity.map(log => {
              const meta = ACTION_MAP[log.action] ?? { label: log.action, color: 'text-slate-400' };
              return (
                <li key={log.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0 animate-pulse-soft" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">
                      <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                      {log.details?.assetTag && (
                        <span className="text-slate-400"> — {log.details.assetTag}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDistanceToNow(log.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function hour() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
