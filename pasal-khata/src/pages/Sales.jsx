import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useSales } from '../hooks/useSales';
import { useTranslation } from '../hooks/useTranslation';
import { formatCurrency } from '../utils/currency';
import { formatNepaliDate } from '../utils/nepaliDate';

export default function Sales() {
  const [filter, setFilter] = useState('week');
  const { sales, loading }  = useSales(filter);
  const navigate            = useNavigate();
  const { t } = useTranslation();

  const FILTERS = [
    { key: 'today', label: t.common.today      },
    { key: 'week',  label: t.common.thisWeek   },
    { key: 'month', label: t.common.thisMonth  },
  ];

  const totalSales = sales.reduce((s, x) => s + parseFloat(x.total_amount ?? x.total ?? 0), 0);
  const totalBaki  = sales.reduce((s, x) => s + parseFloat(x.baki_amount  ?? x.baki  ?? 0), 0);

  const FilterTabs = () => (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
      {FILTERS.map(f => (
        <button
          key={f.key}
          onClick={() => setFilter(f.key)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            filter === f.key ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-500'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="pb-24 md:pb-0">

      {/* ── MOBILE TopBar ── */}
      <div className="md:hidden">
        <TopBar title={t.sales.title} subtitle={`${sales.length} ${t.dashboard.transactions}`} />
      </div>

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-3">
          <FilterTabs />
        </div>
        <div className="px-4 pt-3 grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-600">{t.sales.totalSales}</p>
            <p className="text-base font-bold text-blue-700">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-xs text-red-600">{t.sales.totalBaki}</p>
            <p className="text-base font-bold text-[#e02424]">{formatCurrency(totalBaki)}</p>
          </div>
        </div>
        <div className="px-4 pt-3">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading && sales.length === 0 ? (
              <div className="py-12 flex justify-center"><LoadingSpinner /></div>
            ) : sales.length === 0 ? (
              <EmptyState
                icon="🛒"
                title={t.sales.noSales}
                subtitle={t.sales.noSalesDesc}
                actionLabel={t.sales.newSale}
                onAction={() => navigate('/sales/new')}
              />
            ) : (
              sales.map(sale => {
                const dateInfo     = formatNepaliDate(sale.sale_date ?? sale.date);
                const custName     = sale.customer_name ?? sale.customerName ?? '—';
                const total        = parseFloat(sale.total_amount ?? sale.total ?? 0);
                const baki         = parseFloat(sale.baki_amount  ?? sale.baki  ?? 0);
                const rawItems     = sale.items ?? [];
                const itemsSummary = rawItems.map(i => `${i.product_name ?? i.name} ×${i.quantity ?? i.qty}`).join(', ');
                return (
                  <div key={sale.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                    <Avatar name={custName} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{custName}</p>
                      <p className="text-xs text-gray-400 truncate">{itemsSummary || `${(sale.items_count ?? 0)} items`}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{dateInfo.bs}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(total)}</p>
                      <Badge
                        label={baki > 0 ? `${t.customers.baki} ${formatCurrency(baki)}` : t.sales.status.paid}
                        color={baki > 0 ? 'red' : 'green'}
                        size="xs"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* FAB */}
        <button
          onClick={() => navigate('/sales/new')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-[#1a56db] rounded-full shadow-lg shadow-blue-300 flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <PlusIcon className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block desktop-page">
        {/* Toolbar */}
        <div className="desktop-toolbar">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.sales.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{sales.length} {t.dashboard.transactions}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <FilterTabs />
            </div>
            <button
              onClick={() => navigate('/sales/new')}
              className="flex items-center gap-2 bg-[#1a56db] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {t.sales.newSale}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-4 mb-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div>
              <p className="text-xs text-blue-500 font-medium">{t.sales.totalSales}</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalSales)}</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div>
              <p className="text-xs text-red-500 font-medium">{t.sales.totalBaki}</p>
              <p className="text-lg font-bold text-[#e02424]">{formatCurrency(totalBaki)}</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 font-medium">{t.dashboard.transactions}</p>
            <p className="text-lg font-bold text-gray-700">{sales.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="desktop-card overflow-hidden">
          {loading && sales.length === 0 ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : sales.length === 0 ? (
            <EmptyState
              icon="🛒"
              title={t.sales.noSales}
              subtitle={t.sales.noSalesDesc}
              actionLabel={t.sales.newSale}
              onAction={() => navigate('/sales/new')}
            />
          ) : (
            <table className="resp-table">
              <thead>
                <tr>
                  <th>{t.customers.name}</th>
                  <th>{t.purchases.items}</th>
                  <th>{t.purchases.dateBS}</th>
                  <th>{t.purchases.total}</th>
                  <th>{t.purchases.paid}</th>
                  <th>{t.customers.baki}</th>
                  <th>{t.purchases.status}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const dateInfo     = formatNepaliDate(sale.sale_date ?? sale.date);
                  const custName     = sale.customer_name ?? sale.customerName ?? '—';
                  const total        = parseFloat(sale.total_amount ?? sale.total ?? 0);
                  const paid         = parseFloat(sale.paid_amount  ?? sale.paid  ?? 0);
                  const baki         = parseFloat(sale.baki_amount  ?? sale.baki  ?? 0);
                  const rawItems     = sale.items ?? [];
                  const itemsSummary = rawItems.map(i => `${i.product_name ?? i.name} ×${i.quantity ?? i.qty}`).join(', ');

                  return (
                    <tr key={sale.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={custName} size="sm" />
                          <span className="font-semibold text-gray-900">{custName}</span>
                        </div>
                      </td>
                      <td className="text-gray-500 max-w-[200px] truncate">{itemsSummary || `${sale.items_count ?? 0} items`}</td>
                      <td className="text-gray-600 whitespace-nowrap">{dateInfo.bs}</td>
                      <td className="font-semibold">{formatCurrency(total)}</td>
                      <td className="text-[#057a55] font-medium">{formatCurrency(paid)}</td>
                      <td>
                        {baki > 0
                          ? <span className="text-[#e02424] font-bold">{formatCurrency(baki)}</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td>
                        <Badge
                          label={baki > 0 ? t.customers.baki : t.sales.status.paid}
                          color={baki > 0 ? 'red' : 'green'}
                          size="xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
