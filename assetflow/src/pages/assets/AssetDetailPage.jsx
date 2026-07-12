import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode } from 'lucide-react';
import { getAsset, getAssetHistory } from '../../services/assetService';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset]     = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [a, h] = await Promise.all([getAsset(id), getAssetHistory(id)]);
      setAsset(a);
      setHistory(h);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  if (!asset)  return <p className="text-slate-400 text-center py-20">Asset not found.</p>;

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-2xl font-bold text-primary-400">{asset.assetTag}</span>
            <Badge label={asset.status} />
            <Badge label={asset.condition} />
          </div>
          <h1 className="text-xl font-bold text-slate-100">{asset.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{asset.categoryName} · {asset.location || 'No location'}</p>
        </div>
        <div className="text-center">
          <div className="p-3 bg-white rounded-xl mb-1">
            <QrCode size={64} className="text-surface-950" />
          </div>
          <p className="text-xs text-slate-500">{asset.qrCode}</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Asset Details" />
          <dl className="space-y-3 text-sm">
            {[
              ['Serial Number',    asset.serialNumber || '—'],
              ['Acquisition Date', formatDate(asset.acquisitionDate)],
              ['Acquisition Cost', formatCurrency(asset.acquisitionCost)],
              ['Bookable',         asset.isBookable ? 'Yes' : 'No'],
              ['Created At',       formatDate(asset.createdAt)],
              ['Last Updated',     formatDate(asset.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-slate-400">{label}</dt>
                <dd className="text-slate-200 font-medium text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Current Holder" />
          {asset.currentHolderId ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Name</dt>
                <dd className="text-slate-200 font-medium">{asset.currentHolderName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Type</dt>
                <dd className="text-slate-200 font-medium capitalize">{asset.currentHolderType}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-slate-500 text-sm">Not currently allocated.</p>
          )}
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader title="History" subtitle="Allocations and maintenance events" />
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No history yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map(item => (
              <li key={item.id} className="flex items-start gap-4 py-3 border-b border-surface-700/40 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  {item._type === 'allocation' ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">
                          Allocated to {item.allocatedToName}
                        </span>
                        <Badge label={item.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDateTime(item.allocationDate)}
                        {item.actualReturnDate && ` → Returned ${formatDateTime(item.actualReturnDate)}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">
                          Maintenance — {item.issueDescription}
                        </span>
                        <Badge label={item.priority} />
                        <Badge label={item.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(item.createdAt)}</p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
