import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Legend,
} from 'recharts';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Card, { CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316'];

export default function ReportsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch all data in parallel
      const [assets, allocations, maintenance, bookings] = await Promise.all([
        getDocs(collection(db, 'assets')),
        getDocs(query(collection(db, 'allocations'), orderBy('allocationDate', 'desc'))),
        getDocs(collection(db, 'maintenanceRequests')),
        getDocs(collection(db, 'bookings')),
      ]);

      const assetDocs = assets.docs.map(d => ({ id: d.id, ...d.data() }));
      const allocDocs = allocations.docs.map(d => ({ id: d.id, ...d.data() }));
      const maintDocs = maintenance.docs.map(d => ({ id: d.id, ...d.data() }));
      const bookDocs  = bookings.docs.map(d => ({ id: d.id, ...d.data() }));

      // ── Status breakdown (Pie) ──
      const statusMap = {};
      assetDocs.forEach(a => { statusMap[a.status] = (statusMap[a.status] ?? 0) + 1; });
      const statusPie = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // ── Utilisation by category (Bar) ──
      const catMap = {};
      assetDocs.forEach(a => {
        const cat = a.categoryName || 'Unknown';
        if (!catMap[cat]) catMap[cat] = { total: 0, allocated: 0 };
        catMap[cat].total++;
        if (a.status === 'Allocated') catMap[cat].allocated++;
      });
      const utilBar = Object.entries(catMap).map(([cat, d]) => ({
        category: cat,
        utilisation: d.total ? Math.round((d.allocated / d.total) * 100) : 0,
        total: d.total,
      }));

      // ── Maintenance frequency by priority (Bar) ──
      const prioMap = {};
      maintDocs.forEach(m => { prioMap[m.priority] = (prioMap[m.priority] ?? 0) + 1; });
      const maintBar = Object.entries(prioMap).map(([name, count]) => ({ name, count }));

      // ── High-value idle assets ──
      const idleAssets = assetDocs
        .filter(a => a.status === 'Available' && a.acquisitionCost > 0)
        .sort((a, b) => b.acquisitionCost - a.acquisitionCost)
        .slice(0, 8);

      // ── Booking frequency by week (last 8 weeks) ──
      const now  = Date.now();
      const week = 7 * 24 * 60 * 60 * 1000;
      const bookingByWeek = Array.from({ length: 8 }, (_, i) => {
        const from = now - (8 - i) * week;
        const to   = now - (7 - i) * week;
        const count = bookDocs.filter(b => {
          const ts = b.createdAt?.toDate?.().getTime() ?? 0;
          return ts >= from && ts < to;
        }).length;
        const d = new Date(from);
        return { week: `W${d.getDate()}/${d.getMonth() + 1}`, count };
      });

      setData({ statusPie, utilBar, maintBar, idleAssets, bookingByWeek });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Organisation-wide asset intelligence</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Asset Status Pie */}
        <Card>
          <CardHeader title="Asset Status Breakdown" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.statusPie} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.statusPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', color:'#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Utilisation by Category */}
        <Card>
          <CardHeader title="Utilisation by Category" subtitle="% allocated" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.utilBar} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" />
              <Tooltip
                contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', color:'#cbd5e1' }}
                formatter={(v) => [`${v}%`, 'Utilisation']}
              />
              <Bar dataKey="utilisation" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Maintenance Frequency */}
        <Card>
          <CardHeader title="Maintenance Requests by Priority" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.maintBar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', color:'#cbd5e1' }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Booking trend */}
        <Card>
          <CardHeader title="Booking Trend (Last 8 Weeks)" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.bookingByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', color:'#cbd5e1' }} />
              <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} dot={{ fill:'#a855f7' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* High-value idle assets */}
      <Card>
        <CardHeader
          title="Highest-Value Available Assets"
          subtitle="Potentially idle — consider re-deploying"
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tag</th><th>Name</th><th>Category</th><th>Location</th>
                <th>Condition</th><th className="text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.idleAssets.map(a => (
                <tr key={a.id}>
                  <td><span className="font-mono text-primary-400 font-semibold">{a.assetTag}</span></td>
                  <td className="font-medium text-slate-100">{a.name}</td>
                  <td>{a.categoryName}</td>
                  <td>{a.location || '—'}</td>
                  <td><Badge label={a.condition} /></td>
                  <td className="text-right text-emerald-400 font-semibold">{formatCurrency(a.acquisitionCost)}</td>
                </tr>
              ))}
              {data.idleAssets.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-500 py-8">No available assets with cost data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
