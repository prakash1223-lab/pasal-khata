import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import CustomerCard from '../components/customers/CustomerCard';
import CustomerForm from '../components/customers/CustomerForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Avatar from '../components/common/Avatar';
import { useCustomers } from '../hooks/useCustomers';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/common/Toast';
import { formatCurrency } from '../utils/currency';
import { formatNepaliDate } from '../utils/nepaliDate';

export default function Customers() {
  const { customers, loading, error, search, setSearch, createCustomer } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const { toasts, showSuccess, showError, remove } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAddCustomer = async (data) => {
    setSaving(true);
    try {
      await createCustomer(data);
      showSuccess(t.toast.customerAdded);
      setShowForm(false);
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setSaving(false);
    }
  };

  const withBaki  = customers.filter(c => parseFloat(c.baki ?? 0) > 0).length;
  const clearBaki = customers.filter(c => parseFloat(c.baki ?? 0) === 0).length;

  return (
    <div className="pb-24 md:pb-0">
      <ToastContainer toasts={toasts} onClose={remove} />

      {/* ── MOBILE TopBar ── */}
      <div className="md:hidden">
        <TopBar title={t.customers.title} subtitle={`${customers.length} ${t.customers.title.toLowerCase()}`} />
      </div>

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-3 pb-2">
          <SearchBar value={search} onChange={setSearch} placeholder={t.customers.search} />
        </div>

        {/* Stats row */}
        <div className="px-4 py-2 flex gap-3">
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-gray-500">{t.customers.withBaki}</p>
            <p className="text-sm font-bold text-[#e02424]">{withBaki}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-gray-500">{t.customers.clear}</p>
            <p className="text-sm font-bold text-[#057a55]">{clearBaki}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-gray-500">{t.customers.total}</p>
            <p className="text-sm font-bold text-[#1a56db]">{customers.length}</p>
          </div>
        </div>

        <div className="mx-4 bg-white rounded-2xl overflow-hidden border border-gray-100 mt-2">
          {loading && customers.length === 0 ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : error && customers.length === 0 ? (
            <div className="p-6 text-center text-sm text-red-500">{error}</div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon="👤"
              title={t.customers.noCustomers}
              subtitle={t.customers.noCustomersDesc}
              actionLabel={t.customers.addCustomer}
              onAction={() => setShowForm(true)}
            />
          ) : (
            customers.map(c => <CustomerCard key={c.id} customer={c} />)
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setShowForm(true)}
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
            <h1 className="text-xl font-bold text-gray-900">{t.customers.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{customers.length} {t.customers.title.toLowerCase()} · {withBaki} {t.customers.withBaki.toLowerCase()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-72">
              <SearchBar value={search} onChange={setSearch} placeholder={t.customers.search} />
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#1a56db] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {t.customers.addCustomer}
            </button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex gap-3 mb-5">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-bold text-[#e02424]">{withBaki}</span>
            <span className="text-xs text-gray-500">{t.customers.withBaki}</span>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-bold text-[#057a55]">{clearBaki}</span>
            <span className="text-xs text-gray-500">{t.customers.clear}</span>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-bold text-[#1a56db]">{customers.length}</span>
            <span className="text-xs text-gray-500">{t.customers.total}</span>
          </div>
        </div>

        {/* Table */}
        <div className="desktop-card overflow-hidden">
          {loading && customers.length === 0 ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon="👤"
              title={t.customers.noCustomers}
              subtitle={t.customers.noCustomersDesc}
              actionLabel={t.customers.addCustomer}
              onAction={() => setShowForm(true)}
            />
          ) : (
            <table className="resp-table">
              <thead>
                <tr>
                  <th>{t.customers.name}</th>
                  <th>{t.customers.phone}</th>
                  <th>{t.customers.address}</th>
                  <th>{t.customers.totalBought}</th>
                  <th>{t.customers.totalPaid}</th>
                  <th>{t.customers.baki}</th>
                  <th>{t.products.actions}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const baki        = parseFloat(c.baki ?? 0);
                  const totalBought = parseFloat(c.total_purchased ?? c.totalBought ?? 0);
                  const totalPaid   = parseFloat(c.total_paid ?? c.totalPaid ?? 0);
                  const lastDate    = c.lastPurchase ? formatNepaliDate(c.lastPurchase) : null;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" />
                          <div>
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            {lastDate && <p className="text-[11px] text-gray-400">{lastDate.bs}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600">{c.phone ?? '—'}</td>
                      <td className="text-gray-500 max-w-[160px] truncate">{c.address ?? '—'}</td>
                      <td className="font-medium">{formatCurrency(totalBought)}</td>
                      <td className="text-[#057a55] font-medium">{formatCurrency(totalPaid)}</td>
                      <td>
                        {baki > 0 ? (
                          <span className="text-[#e02424] font-bold">{formatCurrency(baki)}</span>
                        ) : (
                          <span className="text-[#057a55] text-xs font-semibold bg-green-50 px-2 py-1 rounded-full">{t.customers.clear}</span>
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/customers/${c.id}`)}
                            className="flex items-center gap-1 text-xs text-[#1a56db] font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> {t.common.viewAll.split(' ')[0]}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <CustomerForm
          onSave={handleAddCustomer}
          onClose={() => setShowForm(false)}
          saving={saving}
        />
      )}

      <BottomNav />
    </div>
  );
}
