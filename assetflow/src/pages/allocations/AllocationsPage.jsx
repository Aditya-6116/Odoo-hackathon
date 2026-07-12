import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeftRight, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveAllocations, getOverdueAllocations, createAllocation, processReturn } from '../../services/allocationService';
import { getAssets } from '../../services/assetService';
import { getUsers } from '../../services/userService';
import { getDepartments } from '../../services/departmentService';
import { createTransferRequest, getTransferRequests, decideTransferRequest } from '../../services/transferService';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/formatters';

const TABS = ['Active Allocations', 'Overdue', 'Transfer Requests'];

export default function AllocationsPage() {
  const { userProfile, role } = useAuth();
  const [tab, setTab] = useState(0);

  const canAllocate = ['admin', 'asset_manager'].includes(role);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Allocation & Transfer</h1>
          <p className="page-subtitle">Manage asset assignments and transfer requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="segmented-control">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`segmented-tab ${tab === i ? 'active' : ''}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <ActiveAllocationsTab canAllocate={canAllocate} actorUid={userProfile?.uid} />}
      {tab === 1 && <OverdueTab />}
      {tab === 2 && <TransferTab actorUid={userProfile?.uid} role={role} />}
    </div>
  );
}

/* ── Active Allocations ── */
function ActiveAllocationsTab({ canAllocate, actorUid }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [returnModal, setReturnModal] = useState(null);
  const [assets, setAssets] = useState([]);
  const [users, setUsers]   = useState([]);
  const [depts, setDepts]   = useState([]);
  const [form, setForm]     = useState({ assetId: '', holderType: 'employee', holderId: '', expectedReturnDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [notes, setNotes]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getActiveAllocations());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!modal) return;
    Promise.all([
      getAssets({ status: 'Available' }),
      getUsers({ status: 'active' }),
      getDepartments({ status: 'active' }),
    ]).then(([a, u, d]) => { setAssets(a); setUsers(u); setDepts(d); });
  }, [modal]);

  async function handleAllocate() {
    setError('');
    if (!form.assetId || !form.holderId) { setError('Asset and holder are required.'); return; }
    setSaving(true);
    try {
      const asset = assets.find(a => a.id === form.assetId);
      const holderList = form.holderType === 'employee' ? users : depts;
      const holder = holderList.find(h => h.id === form.holderId);
      await createAllocation({
        assetId: form.assetId,
        assetTag: asset.assetTag,
        allocatedToType: form.holderType,
        allocatedToId: form.holderId,
        allocatedToName: holder?.name ?? '',
        expectedReturnDate: form.expectedReturnDate || null,
      }, actorUid);
      setModal(false);
      setForm({ assetId:'', holderType:'employee', holderId:'', expectedReturnDate:'' });
      await load();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleReturn() {
    if (!returnModal) return;
    setSaving(true);
    try {
      await processReturn(returnModal.id, returnModal.assetId, notes, actorUid);
      setReturnModal(null);
      setNotes('');
      await load();
    } finally { setSaving(false); }
  }

  const holderOptions = form.holderType === 'employee' ? users : depts;

  const cols = [
    { key: 'assetTag', header: 'Tag',
      render: v => <span className="font-mono text-primary-400 font-semibold">{v}</span> },
    { key: 'allocatedToName', header: 'Allocated To',
      render: (v, row) => <span>{v} <span className="text-xs text-slate-500">({row.allocatedToType})</span></span> },
    { key: 'allocationDate', header: 'Allocated On', render: v => formatDate(v) },
    { key: 'expectedReturnDate', header: 'Expected Return', render: v => v ? formatDate(v) : '—' },
    { key: 'status', header: 'Status', render: v => <Badge label={v} /> },
    { key: 'id', header: '', render: (_, row) => canAllocate && (
      <Button size="xs" variant="secondary" icon={<RotateCcw size={12} />}
        onClick={() => setReturnModal(row)}>
        Return
      </Button>
    )},
  ];

  return (
    <>
      <Card padding={false}>
        <div className="p-4 border-b border-surface-700/50 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">{data.length} active allocations</span>
          {canAllocate && (
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setModal(true)}>Allocate Asset</Button>
          )}
        </div>
        <Table columns={cols} data={data} loading={loading} emptyMessage="No active allocations." />
      </Card>

      {/* Allocate Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Allocate Asset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAllocate}>Allocate</Button>
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
            <label className="form-label">Asset (Available only)</label>
            <select className="w-full" value={form.assetId} onChange={e => setForm(f=>({...f,assetId:e.target.value}))}>
              <option value="">Select asset…</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Allocate To</label>
            <div className="flex gap-3 mb-2">
              {['employee','department'].map(t => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-300">
                  <input type="radio" name="holderType" value={t} checked={form.holderType===t}
                    onChange={e => setForm(f=>({...f,holderType:e.target.value,holderId:''}))} />
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </label>
              ))}
            </div>
            <select className="w-full" value={form.holderId} onChange={e => setForm(f=>({...f,holderId:e.target.value}))}>
              <option value="">Select {form.holderType}…</option>
              {holderOptions.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Expected Return Date (optional)</label>
            <input type="date" className="w-full" value={form.expectedReturnDate}
              onChange={e => setForm(f=>({...f,expectedReturnDate:e.target.value}))} />
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal open={!!returnModal} onClose={() => setReturnModal(null)} title="Process Return"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturnModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={handleReturn}>Confirm Return</Button>
          </>
        }
      >
        <p className="text-sm text-slate-300 mb-4">
          Returning <strong className="text-primary-400">{returnModal?.assetTag}</strong> — this will mark the asset as Available.
        </p>
        <div className="form-group">
          <label className="form-label">Condition Notes (optional)</label>
          <textarea className="w-full h-24 resize-none" value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="e.g. Minor scuff on lid…" />
        </div>
      </Modal>
    </>
  );
}

/* ── Overdue Tab ── */
function OverdueTab() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverdueAllocations().then(d => { setData(d); setLoading(false); });
  }, []);

  const cols = [
    { key: 'assetTag', header: 'Tag',
      render: v => <span className="font-mono text-primary-400 font-semibold">{v}</span> },
    { key: 'allocatedToName', header: 'Holder' },
    { key: 'expectedReturnDate', header: 'Was Due', render: v => <span className="text-red-400">{formatDate(v)}</span> },
    { key: 'status', header: 'Status', render: v => <Badge label={v} /> },
  ];

  return (
    <Card padding={false}>
      <Table columns={cols} data={data} loading={loading} emptyMessage="No overdue allocations — all good! 🎉" />
    </Card>
  );
}

/* ── Transfer Requests Tab ── */
function TransferTab({ actorUid, role }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const canDecide = ['admin','asset_manager','department_head'].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getTransferRequests());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(req, decision) {
    setSaving(req.id);
    try { await decideTransferRequest(req.id, req, decision, actorUid); await load(); }
    finally { setSaving(null); }
  }

  const cols = [
    { key: 'assetTag', header: 'Asset',
      render: v => <span className="font-mono text-primary-400 font-semibold">{v}</span> },
    { key: 'toHolderName', header: 'Requested By → To' },
    { key: 'requestDate',  header: 'Requested On', render: v => formatDate(v) },
    { key: 'status',       header: 'Status', render: v => <Badge label={v} /> },
    { key: 'id', header: '', render: (_, row) =>
      row.status === 'requested' && canDecide ? (
        <div className="flex gap-1.5">
          <Button size="xs" loading={saving===row.id} onClick={() => decide(row,'approved')}>Approve</Button>
          <Button size="xs" variant="danger" loading={saving===row.id} onClick={() => decide(row,'rejected')}>Reject</Button>
        </div>
      ) : null,
    },
  ];

  return (
    <Card padding={false}>
      <Table columns={cols} data={data} loading={loading} emptyMessage="No transfer requests." />
    </Card>
  );
}
