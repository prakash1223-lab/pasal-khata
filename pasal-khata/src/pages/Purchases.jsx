import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { usePurchases } from '../hooks/usePurchases';
import { useTranslation } from '../hooks/useTranslation';
import { formatCurrency } from '../utils/currency';
import { formatNepaliDate } from '../utils/nepaliDate';

export default function Purchases() {
  const [filter, setFilter] = useState('week');
  const { purchases, loading } = usePurchases(filter);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const FILTERS = [
    { key: 'today', label: t.common.today    },
    { key: 'week',  label: t.common.thisWeek },
    { key: 'month', label: t.common.thisMonth},
  ];

  const totalCost   = purchases.reduce((s, p) => s + parseFloat(p.total_amount ?? 0), 0);
  const totalUdharo = purchases.reduce((s, p) => s + parseFloat(p.udharo_amount ?? 0), 0);

  const FilterTabs = () => (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
      {FILTERS.map(f => (
        <button key={f.key} onClick={() => setFilter(f.key)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            filter === f.key ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-500'
          }`}>{f.label}</button>
      ))}
    </div>
  );

  const PurchaseRow = ({ p }) => {
    const dateInfo   = formatNepaliDate(p.purchase_date ?? p.created_at);
    const supplier   = p.supplier_name ?? '—';
    const company    = p.company_name;
    const total      = parseFloat(p.total_amount ?? 0);
    const udharo     = parseFloat(p.udharo_amount ?? 0);

    return (
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-amber-700">
            {(company || supplier).substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{supplier}</p>
          {company && <p className="text-xs text-amber-600 truncate">{company}</p>}
          <p className="text-[10px] text-gray-400 mt-0.5">
            {p.items_count ?? 0} items · {dateInfo.bs}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-800">{formatCurrency(total)}</p>
          <Badge label={udharo > 0 ? `${t.suppliers.udharo} ${formatCurrency(udharo)}` : t.sales.status.paid} color={udharo > 0 ? 'amber' : 'green'} size="xs" />
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 md:pb-0">
      {/* MOBILE TopBar */}
      <div className="md:hidden">
        <TopBar title={t.purchases.title} subtitle={`${purchases.length} ${t.purchases.records}`} />
      </div>

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-3"><FilterTabs /></div>
        <div className="px-4 pt-3 grid grid-cols-2 gap-2">
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-xs text-amber-600">{t.purchases.totalCost}</p>
            <p className="text-base font-bold text-amber-700">{formatCurrency(totalCost)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-xs text-red-600">{t.purchases.totalUdharo}</p>
            <p className="text-base font-bold text-[#e02424]">{formatCurrency(totalUdharo)}</p>
          </div>
        </div>
        <div className="px-4 pt-3">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading && purchases.length === 0
              ? <div className="py-12 flex justify-center"><LoadingSpinner /></div>
              : purchases.length === 0
              ? <EmptyState icon="🛒" title={t.purchases.noPurchases} subtitle={t.purchases.noPurchasesDesc}
                  actionLabel={t.purchases.newPurchase} onAction={() => navigate('/purchases/new')} />
              : purchases.map(p => <PurchaseRow key={p.id} p={p} />)
            }
          </div>
        </div>
        <button onClick={() => navigate('/purchases/new')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-amber-500 rounded-full shadow-lg shadow-amber-200 flex items-center justify-center active:scale-95 transition-transform z-40">
          <PlusIcon className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block desktop-page">
        <div className="desktop-toolbar">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.purchases.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{purchases.length} {t.purchases.records}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64"><FilterTabs /></div>
            <button onClick={() => navigate('/purchases/new')}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
              <PlusIcon className="w-4 h-4" /> {t.purchases.newPurchase}
            </button>
          </div>
        </div>
        <div className="flex gap-4 mb-5">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-500 font-medium">{t.purchases.totalCost}</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(totalCost)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs text-red-500 font-medium">{t.purchases.totalUdharo}</p>
            <p className="text-lg font-bold text-[#e02424]">{formatCurrency(totalUdharo)}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 font-medium">{t.dashboard.transactions}</p>
            <p className="text-lg font-bold text-gray-700">{purchases.length}</p>
          </div>
        </div>
        <div className="desktop-card overflow-hidden">
          {loading && purchases.length === 0
            ? <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
            : purchases.length === 0
            ? <EmptyState icon="🛒" title={t.purchases.noPurchases} subtitle={t.purchases.noPurchasesDesc}
                actionLabel={t.purchases.newPurchase} onAction={() => navigate('/purchases/new')} />
            : (
              <table className="resp-table">
                <thead>
                  <tr>
                    <th>{t.purchases.supplier}</th>
                    <th>{t.purchases.invoiceNo}</th>
                    <th>{t.purchases.items}</th>
                    <th>{t.purchases.dateBS}</th>
                    <th>{t.purchases.total}</th>
                    <th>{t.purchases.paid}</th>
                    <th>{t.suppliers.udharo}</th>
                    <th>{t.purchases.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => {
                    const dateInfo = formatNepaliDate(p.purchase_date ?? p.created_at);
                    const udharo   = parseFloat(p.udharo_amount ?? 0);
                    return (
                      <tr key={p.id} onClick={() => p.supplier_id && navigate(`/suppliers/${p.supplier_id}`)}
                        className={p.supplier_id ? 'cursor-pointer' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-amber-700">
                                {(p.company_name || p.supplier_name || '?').substring(0,2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{p.supplier_name ?? '—'}</p>
                              {p.company_name && <p className="text-xs text-amber-600">{p.company_name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="text-gray-500">{p.invoice_number ?? '—'}</td>
                        <td className="text-gray-500">{p.items_count ?? 0}</td>
                        <td className="text-gray-600 whitespace-nowrap">{dateInfo.bs}</td>
                        <td className="font-semibold">{formatCurrency(p.total_amount ?? 0)}</td>
                        <td className="text-[#057a55] font-medium">{formatCurrency(p.paid_amount ?? 0)}</td>
                        <td>{udharo > 0 ? <span className="text-amber-700 font-bold">{formatCurrency(udharo)}</span> : <span className="text-gray-400">—</span>}</td>
                        <td><Badge label={udharo > 0 ? t.suppliers.udharo : t.sales.status.paid} color={udharo > 0 ? 'amber' : 'green'} size="xs" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
