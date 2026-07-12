import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMaintenanceRequests, raiseMaintenance,
  approveMaintenance, rejectMaintenance,
  assignTechnician, startMaintenance, resolveMaintenance,
} from '../../services/maintenanceService';
import { getAssets } from '../../services/assetService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';

const COLUMNS = [
  { id: 'Pending',             label: 'Pending',             color: 'text-slate-300' },
  { id: 'Approved',            label: 'Approved',            color: 'text-blue-400' },
  { id: 'Technician Assigned', label: 'Assigned',            color: 'text-purple-400' },
  { id: 'In Progress',         label: 'In Progress',         color: 'text-amber-400' },
  { id: 'Resolved',            label: 'Resolved',            color: 'text-emerald-400' },
];

export default function MaintenancePage() {
  const { userProfile, role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [assets, setAssets]     = useState([]);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [form, setForm] = useState({ assetId: '', issueDescription: '', priority: 'Medium' });

  const canApprove = ['admin', 'asset_manager'].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setRequests(await getMaintenanceRequests());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!modal) return;
    getAssets().then(setAssets);
  }, [modal]);

  async function handleRaise() {
    setError('');
    if (!form.assetId || !form.issueDescription.trim()) { setError('Asset and description required.'); return; }
    setSaving(true);
    try {
      const asset = assets.find(a => a.id === form.assetId);
      await raiseMaintenance({ ...form, assetTag: asset?.assetTag ?? '' }, userProfile.uid);
      setModal(false);
      setForm({ assetId:'', issueDescription:'', priority:'Medium' });
      await load();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleAction(req, action) {
    setSaving(req.id);
    try {
      if (action === 'approve')    await approveMaintenance(req.id, req.assetId, userProfile.uid);
      if (action === 'reject')     await rejectMaintenance(req.id, userProfile.uid);
      if (action === 'start')      await startMaintenance(req.id, userProfile.uid);
      if (action === 'resolve')    { setResolveModal(req); setSaving(false); return; }
      await load();
    } finally { setSaving(false); }
  }

  async function handleResolve() {
    if (!resolveModal) return;
    setSaving(resolveModal.id);
    try {
      await resolveMaintenance(resolveModal.id, resolveModal.assetId, resolveNotes, userProfile.uid);
      setResolveModal(null);
      setResolveNotes('');
      await load();
    } finally { setSaving(false); }
  }

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = requests.filter(r => r.status === col.id);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">Track and manage asset repair requests</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setModal(true)}>
          Raise Request
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.id} className="kanban-col min-w-[220px]">
            <div className="kanban-col-header flex items-center gap-2">
              <span className={col.color}>{col.label}</span>
              <span className="ml-auto bg-surface-700 text-slate-400 text-xs px-1.5 py-0.5 rounded-full">
                {grouped[col.id]?.length ?? 0}
              </span>
            </div>
            <div className="p-2 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
              {grouped[col.id]?.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-6">Empty</p>
              )}
              {grouped[col.id]?.map(req => (
                <div key={req.id}
                  className="bg-surface-800 rounded-lg p-3 border border-surface-700/50
                             hover:border-primary-700/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="font-mono text-primary-400 text-xs font-semibold">{req.assetTag}</span>
                    <Badge label={req.priority} />
                  </div>
                  <p className="text-sm text-slate-200 leading-snug line-clamp-2">{req.issueDescription}</p>
                  <p className="text-xs text-slate-500 mt-1.5">{formatDate(req.createdAt)}</p>

                  {/* Action buttons */}
                  {canApprove && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {req.status === 'Pending' && (
                        <>
                          <Button size="xs" loading={saving===req.id} onClick={() => handleAction(req,'approve')}>Approve</Button>
                          <Button size="xs" variant="danger" onClick={() => handleAction(req,'reject')}>Reject</Button>
                        </>
                      )}
                      {req.status === 'Approved' && (
                        <Button size="xs" variant="secondary" onClick={() => handleAction(req,'start')}>Start</Button>
                      )}
                      {req.status === 'In Progress' && (
                        <Button size="xs" onClick={() => handleAction(req,'resolve')}>Resolve</Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Raise Maintenance Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Raise Maintenance Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving === true} onClick={handleRaise}>Submit</Button>
          </>
        }
      >
        {error && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 rounded-lg p-3 mb-4">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Asset *</label>
            <select className="w-full" value={form.assetId} onChange={e => setForm(f=>({...f,assetId:e.target.value}))}>
              <option value="">Select asset…</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="w-full" value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}>
              {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Issue Description *</label>
            <textarea className="w-full h-24 resize-none" value={form.issueDescription}
              onChange={e => setForm(f=>({...f,issueDescription:e.target.value}))}
              placeholder="Describe the issue in detail…" />
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal open={!!resolveModal} onClose={() => setResolveModal(null)} title="Resolve Maintenance"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResolveModal(null)}>Cancel</Button>
            <Button loading={!!saving} onClick={handleResolve}>Mark Resolved</Button>
          </>
        }
      >
        <p className="text-sm text-slate-400 mb-4">
          Resolving <strong className="text-primary-400">{resolveModal?.assetTag}</strong> — asset will be set back to Available.
        </p>
        <div className="form-group">
          <label className="form-label">Resolution Notes</label>
          <textarea className="w-full h-24 resize-none" value={resolveNotes}
            onChange={e => setResolveNotes(e.target.value)} placeholder="Describe what was done…" />
        </div>
      </Modal>
    </div>
  );
}
