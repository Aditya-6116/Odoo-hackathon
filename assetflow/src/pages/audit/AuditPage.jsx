import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAuditCycles, createAuditCycle, getAuditItems,
  recordAuditItem, closeAuditCycle, getDiscrepancyReport,
} from '../../services/auditService';
import { getAssets } from '../../services/assetService';
import { getUsers } from '../../services/userService';
import { getDepartments } from '../../services/departmentService';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatters';

const AUDIT_RESULTS = ['Verified', 'Missing', 'Damaged'];

export default function AuditPage() {
  const { userProfile } = useAuth();
  const [cycles, setCycles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(null);  // cycleId
  const [items, setItems]     = useState([]);
  const [report, setReport]   = useState(null);
  const [form, setForm]       = useState({ name:'', scopeType:'department', scopeValue:'', dateRangeStart:'', dateRangeEnd:'' });
  const [depts, setDepts]     = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, d] = await Promise.all([getAuditCycles(), getDepartments({ status:'active' })]);
    setCycles(c);
    setDepts(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleExpand(cycle) {
    if (expanded === cycle.id) { setExpanded(null); setItems([]); setReport(null); return; }
    setExpanded(cycle.id);
    const [i, r] = await Promise.all([getAuditItems(cycle.id), getDiscrepancyReport(cycle.id)]);
    setItems(i);
    setReport(r);
  }

  async function handleCreateCycle() {
    if (!form.name.trim() || !form.scopeValue || !form.dateRangeStart || !form.dateRangeEnd) {
      alert('All fields required.'); return;
    }
    setSaving(true);
    try {
      // Get in-scope assets
      let assets = [];
      if (form.scopeType === 'department') {
        assets = await getAssets();
        // Filter by department held by dept (simple: all assets in org for hackathon)
      } else {
        assets = await getAssets({ location: form.scopeValue });
      }
      // fallback: use all assets if none found
      if (assets.length === 0) assets = await getAssets();

      await createAuditCycle(form, assets, userProfile.uid);
      setModal(false);
      setForm({ name:'', scopeType:'department', scopeValue:'', dateRangeStart:'', dateRangeEnd:'' });
      await load();
    } finally { setSaving(false); }
  }

  async function handleResult(itemId, result) {
    await recordAuditItem(itemId, result, '', userProfile.uid);
    // Refresh items
    const i = await getAuditItems(expanded);
    setItems(i);
  }

  async function handleClose(cycleId) {
    if (!window.confirm('Close this audit cycle? This will generate the discrepancy report and mark missing assets as Lost.')) return;
    setSaving(cycleId);
    try {
      await closeAuditCycle(cycleId, userProfile.uid);
      await load();
      const [i, r] = await Promise.all([getAuditItems(cycleId), getDiscrepancyReport(cycleId)]);
      setItems(i);
      setReport(r);
    } finally { setSaving(null); }
  }

  const cycleCols = [
    { key: 'name',   header: 'Cycle Name', render: v => <span className="font-medium text-slate-100">{v}</span> },
    { key: 'scopeType',  header: 'Scope', render: v => <span className="capitalize">{v}</span> },
    { key: 'scopeValue', header: 'Scope Value' },
    { key: 'dateRangeStart', header: 'Start', render: v => formatDate(v) },
    { key: 'status', header: 'Status', render: v => <Badge label={v} /> },
    { key: 'id', header: '', render: (_, row) => (
      <div className="flex gap-2">
        <button onClick={() => handleExpand(row)} className="text-slate-400 hover:text-primary-400 transition-colors">
          {expanded === row.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
        </button>
        {row.status === 'Open' && (
          <Button size="xs" variant="danger" loading={saving === row.id}
            onClick={() => handleClose(row.id)}>Close Cycle</Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Audit</h1>
          <p className="page-subtitle">Manage audit cycles, verify assets, and review discrepancies</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setModal(true)}>
          New Audit Cycle
        </Button>
      </div>

      <Card padding={false}>
        <Table columns={cycleCols} data={cycles} loading={loading} emptyMessage="No audit cycles yet." />
      </Card>

      {/* Expanded cycle details */}
      {expanded && (
        <div className="space-y-4 animate-slide-in">
          <Card>
            <CardHeader
              title="Audit Checklist"
              subtitle={`${items.filter(i => i.result !== 'Pending').length} / ${items.length} items recorded`}
            />
            <div className="space-y-2.5">
              {items.map(item => (
                <div key={item.id}
                  className="flex items-center gap-4 py-2.5 px-3 rounded-lg bg-surface-700/30">
                  <span className="font-mono text-primary-400 text-sm font-semibold w-24 shrink-0">{item.assetTag}</span>
                  <Badge label={item.result} />
                  <div className="ml-auto flex gap-1.5">
                    {AUDIT_RESULTS.map(r => (
                      <button key={r}
                        onClick={() => handleResult(item.id, r)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors
                          ${item.result === r
                            ? r === 'Verified' ? 'bg-emerald-700 border-emerald-600 text-white'
                              : r === 'Missing' ? 'bg-red-700 border-red-600 text-white'
                              : 'bg-orange-700 border-orange-600 text-white'
                            : 'bg-surface-700 border-surface-600 text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Discrepancy Report */}
          {report && (
            <Card>
              <CardHeader title="Discrepancy Report" subtitle="Auto-generated on cycle close" />
              {report.flaggedItems.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm py-3">
                  <CheckCircle size={18} /> No discrepancies found — all assets verified!
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-sm mb-3">
                    <AlertTriangle size={16} /> {report.flaggedItems.length} flagged items
                  </div>
                  {report.flaggedItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 bg-red-900/10 rounded-lg border border-red-800/30">
                      <span className="font-mono text-primary-400 text-sm font-semibold">{item.assetTag}</span>
                      <Badge label={item.result} />
                      {item.notes && <span className="text-xs text-slate-400">{item.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* New Cycle Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Create Audit Cycle"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving === true} onClick={handleCreateCycle}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Cycle Name *</label>
            <input className="w-full" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Scope Type</label>
            <select className="w-full" value={form.scopeType} onChange={e => setForm(f=>({...f,scopeType:e.target.value,scopeValue:''}))}>
              <option value="department">Department</option>
              <option value="location">Location</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Scope Value *</label>
            {form.scopeType === 'department' ? (
              <select className="w-full" value={form.scopeValue} onChange={e => setForm(f=>({...f,scopeValue:e.target.value}))}>
                <option value="">Select department…</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            ) : (
              <input className="w-full" placeholder="e.g. 3rd Floor" value={form.scopeValue}
                onChange={e => setForm(f=>({...f,scopeValue:e.target.value}))} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input type="date" className="w-full" value={form.dateRangeStart}
                onChange={e => setForm(f=>({...f,dateRangeStart:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input type="date" className="w-full" value={form.dateRangeEnd}
                onChange={e => setForm(f=>({...f,dateRangeEnd:e.target.value}))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
