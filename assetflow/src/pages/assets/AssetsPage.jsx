import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAssets, createAsset } from '../../services/assetService';
import { getCategories } from '../../services/categoryService';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatDate, formatCurrency } from '../../utils/formatters';

const CONDITIONS  = ['New','Good','Fair','Poor','Damaged'];
const STATUSES    = ['Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed'];

export default function AssetsPage() {
  const { userProfile, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assets, setAssets]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState(searchParams.get('q') ?? '');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({
    name: '', categoryId: '', serialNumber: '',
    acquisitionCost: '', condition: 'Good', location: '',
    isBookable: false, acquisitionDate: '',
  });
  const [error, setError]           = useState('');

  useEffect(() => {
    getCategories({ status: 'active' }).then(setCategories);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAssets({
      status:     filterStatus || undefined,
      categoryId: filterCat   || undefined,
      search:     search       || undefined,
    });
    setAssets(data);
    setLoading(false);
  }, [search, filterStatus, filterCat]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setError('');
    if (!form.name.trim() || !form.categoryId) { setError('Name and category are required.'); return; }
    setSaving(true);
    try {
      const cat = categories.find(c => c.id === form.categoryId);
      await createAsset({
        ...form,
        acquisitionCost: Number(form.acquisitionCost) || 0,
        categoryName: cat?.name ?? '',
      }, userProfile.uid);
      setModal(false);
      resetForm();
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function resetForm() {
    setForm({ name:'',categoryId:'',serialNumber:'',acquisitionCost:'',condition:'Good',location:'',isBookable:false,acquisitionDate:'' });
    setError('');
  }

  const canCreate = ['admin','asset_manager'].includes(role);

  const cols = [
    { key: 'assetTag', header: 'Tag',
      render: v => <span className="font-mono text-primary-400 font-semibold">{v}</span> },
    { key: 'name', header: 'Name',
      render: v => <span className="font-medium text-slate-100">{v}</span> },
    { key: 'categoryName', header: 'Category' },
    { key: 'status',       header: 'Status',   render: v => <Badge label={v} /> },
    { key: 'condition',    header: 'Condition', render: v => <Badge label={v} /> },
    { key: 'location',     header: 'Location' },
    { key: 'currentHolderName', header: 'Holder', render: v => v ?? '—' },
    { key: 'acquisitionCost',   header: 'Cost',
      render: v => <span className="text-slate-400">{formatCurrency(v)}</span> },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Registry</h1>
          <p className="page-subtitle">{assets.length} assets found</p>
        </div>
        {canCreate && (
          <Button icon={<Plus size={15} />} onClick={() => setModal(true)}>
            Register Asset
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="flex flex-wrap gap-3 p-4 border-b border-surface-700/50">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="pl-9 w-full text-sm"
              placeholder="Search by tag, name, serial, location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="text-sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <Table
          columns={cols}
          data={assets}
          loading={loading}
          emptyMessage="No assets match your filters."
          onRowClick={row => navigate(`/assets/${row.id}`)}
        />
      </Card>

      {/* Register Asset Modal */}
      <Modal
        open={modal}
        onClose={() => { setModal(false); resetForm(); }}
        title="Register New Asset"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModal(false); resetForm(); }}>Cancel</Button>
            <Button loading={saving} onClick={handleCreate}>Register</Button>
          </>
        }
      >
        {error && <p className="text-sm text-red-400 mb-4 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="form-label">Asset Name *</label>
            <input className="w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="w-full" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select className="w-full" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Serial Number</label>
            <input className="w-full" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="w-full" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Acquisition Cost (₹)</label>
            <input type="number" className="w-full" value={form.acquisitionCost} onChange={e => setForm(f => ({ ...f, acquisitionCost: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Acquisition Date</label>
            <input type="date" className="w-full" value={form.acquisitionDate} onChange={e => setForm(f => ({ ...f, acquisitionDate: e.target.value }))} />
          </div>
          <div className="form-group col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isBookable}
                onChange={e => setForm(f => ({ ...f, isBookable: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary-600"
              />
              <span className="text-sm text-slate-300">Is Bookable (appears in Resource Booking)</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
