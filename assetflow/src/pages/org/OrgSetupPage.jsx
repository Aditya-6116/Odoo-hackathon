import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, Layers, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDepartments, createDepartment, updateDepartment } from '../../services/departmentService';
import { getCategories, createCategory, updateCategory } from '../../services/categoryService';
import { getUsers, setUserRole, setUserStatus } from '../../services/userService';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { capitalizeRole, formatDate } from '../../utils/formatters';

const TABS = [
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'categories',  label: 'Categories',  icon: Layers },
  { id: 'employees',   label: 'Employees',   icon: Users },
];

const ROLES = ['employee', 'department_head', 'asset_manager', 'admin'];

export default function OrgSetupPage() {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState('departments');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Organisation Setup</h1>
          <p className="page-subtitle">Manage departments, asset categories, and employee roles</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900 border border-surface-700/50 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${tab === t.id ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'departments' && <DepartmentsTab actorUid={userProfile?.uid} />}
      {tab === 'categories'  && <CategoriesTab  actorUid={userProfile?.uid} />}
      {tab === 'employees'   && <EmployeesTab   actorUid={userProfile?.uid} />}
    </div>
  );
}

/* ─── Departments ─────────────────────────────────────────────── */
function DepartmentsTab({ actorUid }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ name: '', parentDepartmentId: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const docs = await getDepartments();
    setData(docs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createDepartment({ name: form.name.trim(), parentDepartmentId: form.parentDepartmentId || null }, actorUid);
      setModal(false);
      setForm({ name: '', parentDepartmentId: '' });
      await load();
    } finally { setSaving(false); }
  }

  const cols = [
    { key: 'name',   header: 'Name',   render: v => <span className="font-medium text-slate-100">{v}</span> },
    { key: 'headUserName', header: 'Department Head', render: v => v || '—' },
    { key: 'status', header: 'Status', render: v => <Badge label={v} /> },
    { key: 'createdAt', header: 'Created', render: v => formatDate(v) },
  ];

  return (
    <Card padding={false}>
      <div className="p-5 border-b border-surface-700/50">
        <CardHeader
          title="Departments"
          subtitle={`${data.length} total`}
          action={<Button size="sm" icon={<Plus size={14} />} onClick={() => setModal(true)}>Add Department</Button>}
        />
      </div>
      <Table columns={cols} data={data} loading={loading} emptyMessage="No departments yet." />

      <Modal open={modal} onClose={() => setModal(false)} title="Add Department"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input className="w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Parent Department (optional)</label>
            <select className="w-full" value={form.parentDepartmentId} onChange={e => setForm(f => ({ ...f, parentDepartmentId: e.target.value }))}>
              <option value="">None</option>
              {data.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

/* ─── Categories ──────────────────────────────────────────────── */
function CategoriesTab({ actorUid }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getCategories());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: form.name.trim() }, actorUid);
      setModal(false);
      setForm({ name: '' });
      await load();
    } finally { setSaving(false); }
  }

  const cols = [
    { key: 'name',   header: 'Name',   render: v => <span className="font-medium text-slate-100">{v}</span> },
    { key: 'customFields', header: 'Custom Fields', render: v => v?.length ? v.map(f => f.label).join(', ') : '—' },
    { key: 'status', header: 'Status', render: v => <Badge label={v} /> },
  ];

  return (
    <Card padding={false}>
      <div className="p-5 border-b border-surface-700/50">
        <CardHeader
          title="Asset Categories"
          subtitle={`${data.length} total`}
          action={<Button size="sm" icon={<Plus size={14} />} onClick={() => setModal(true)}>Add Category</Button>}
        />
      </div>
      <Table columns={cols} data={data} loading={loading} emptyMessage="No categories yet." />

      <Modal open={modal} onClose={() => setModal(false)} title="Add Category"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Category Name *</label>
          <input className="w-full" value={form.name} onChange={e => setForm({ name: e.target.value })} />
        </div>
      </Modal>
    </Card>
  );
}

/* ─── Employees ───────────────────────────────────────────────── */
function EmployeesTab({ actorUid }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getUsers());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRoleChange(uid, role) {
    setSaving(uid);
    try { await setUserRole(uid, role, actorUid); await load(); }
    finally { setSaving(null); }
  }

  async function handleStatusToggle(uid, status) {
    const next = status === 'active' ? 'inactive' : 'active';
    setSaving(uid);
    try { await setUserStatus(uid, next, actorUid); await load(); }
    finally { setSaving(null); }
  }

  const cols = [
    { key: 'name',  header: 'Name',       render: v => <span className="font-medium text-slate-100">{v}</span> },
    { key: 'email', header: 'Email',       render: v => <span className="text-slate-400">{v}</span> },
    { key: 'departmentName', header: 'Department', render: v => v || '—' },
    { key: 'role',  header: 'Role',        render: (v, row) => (
      <select
        value={v}
        disabled={saving === row.id}
        onChange={e => handleRoleChange(row.id, e.target.value)}
        className="text-xs py-1 px-2 rounded-md bg-surface-700 border border-surface-600"
      >
        {ROLES.map(r => <option key={r} value={r}>{capitalizeRole(r)}</option>)}
      </select>
    )},
    { key: 'status', header: 'Status', render: (v, row) => (
      <button onClick={() => handleStatusToggle(row.id, v)} disabled={saving === row.id}
        className="cursor-pointer">
        <Badge label={v} />
      </button>
    )},
  ];

  return (
    <Card padding={false}>
      <div className="p-5 border-b border-surface-700/50">
        <CardHeader title="Employee Directory" subtitle={`${data.length} users`} />
      </div>
      <Table columns={cols} data={data} loading={loading} emptyMessage="No users yet." />
    </Card>
  );
}
