import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getBookableAssets, getAllBookings, createBooking, cancelBooking } from '../../services/bookingService';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatDateTime } from '../../utils/formatters';

export default function BookingsPage() {
  const { userProfile } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [assets, setAssets]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState({
    resourceAssetId: '', startTime: '', endTime: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [b, a] = await Promise.all([getAllBookings(), getBookableAssets()]);
    setBookings(b);
    setAssets(a);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleBook() {
    setError('');
    if (!form.resourceAssetId || !form.startTime || !form.endTime) {
      setError('All fields are required.'); return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      setError('End time must be after start time.'); return;
    }
    setSaving(true);
    try {
      const asset = assets.find(a => a.id === form.resourceAssetId);
      await createBooking({
        resourceAssetId: form.resourceAssetId,
        assetTag:        asset?.assetTag ?? '',
        startTime:       form.startTime,
        endTime:         form.endTime,
        bookedByUserId:  userProfile.uid,
        departmentId:    userProfile.departmentId ?? null,
      }, userProfile.uid);
      setModal(false);
      setForm({ resourceAssetId:'', startTime:'', endTime:'' });
      await load();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleCancel(booking) {
    setCancelling(booking.id);
    try { await cancelBooking(booking.id, booking.resourceAssetId, userProfile.uid); await load(); }
    finally { setCancelling(null); }
  }

  const cols = [
    { key: 'assetTag', header: 'Resource',
      render: v => <span className="font-mono text-primary-400 font-semibold">{v}</span> },
    { key: 'startTime', header: 'Start', render: v => formatDateTime(v) },
    { key: 'endTime',   header: 'End',   render: v => formatDateTime(v) },
    { key: 'status',    header: 'Status', render: v => <Badge label={v} /> },
    { key: 'id', header: '', render: (_, row) =>
      ['Upcoming'].includes(row.status) ? (
        <Button size="xs" variant="danger" loading={cancelling === row.id}
          onClick={() => handleCancel(row)}>
          Cancel
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resource Booking</h1>
          <p className="page-subtitle">Book shared assets and meeting rooms</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setModal(true)}>
          New Booking
        </Button>
      </div>

      {/* Bookable resources quick list */}
      {assets.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Available Resources</p>
          <div className="flex flex-wrap gap-2">
            {assets.map(a => (
              <div key={a.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 rounded-lg border border-surface-700 text-sm">
                <span className="font-mono text-primary-400 font-semibold">{a.assetTag}</span>
                <span className="text-slate-300">{a.name}</span>
                <Badge label={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-surface-700/50">
          <span className="text-sm font-semibold text-slate-200">{bookings.length} bookings</span>
        </div>
        <Table columns={cols} data={bookings} loading={loading} emptyMessage="No bookings yet." />
      </Card>

      <Modal open={modal} onClose={() => { setModal(false); setError(''); }} title="New Resource Booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleBook}>Book</Button>
          </>
        }
      >
        {error && (
          <div className="flex items-start gap-2.5 bg-red-900/20 border border-red-800/40 rounded-lg p-3 mb-4">
            <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Resource *</label>
            <select className="w-full" value={form.resourceAssetId}
              onChange={e => setForm(f=>({...f,resourceAssetId:e.target.value}))}>
              <option value="">Select resource…</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Time *</label>
            <input type="datetime-local" className="w-full" value={form.startTime}
              onChange={e => setForm(f=>({...f,startTime:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">End Time *</label>
            <input type="datetime-local" className="w-full" value={form.endTime}
              onChange={e => setForm(f=>({...f,endTime:e.target.value}))} />
          </div>
          <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-400">
              ⚠ Overlapping bookings are automatically detected and rejected.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
