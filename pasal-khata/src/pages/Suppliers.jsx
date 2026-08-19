import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import SupplierCard from '../components/suppliers/SupplierCard';
import SupplierForm from '../components/suppliers/SupplierForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { ToastContainer } from '../components/common/Toast';
import { useSuppliers } from '../hooks/useSuppliers';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';

export default function Suppliers() {
  const { suppliers, loading, error, search, setSearch, createSupplier } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const { toasts, showSuccess, showError, remove } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await createSupplier(data);
      showSuccess(t.toast.supplierAdded);
      setShowForm(false);
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setSaving(false);
    }
  };

  const withUdharo = suppliers.filter(s => parseFloat(s.udharo ?? 0) > 0).length;
  const totalUdharo = suppliers.reduce((sum, s) => sum + parseFloat(s.udharo ?? 0), 0);

  return (
    <div className="pb-24 md:pb-0">
      <ToastContainer toasts={toasts} onClose={remove} />

      {/* MOBILE TopBar */}
      <div className="md:hidden">
        <TopBar title={t.suppliers.title} subtitle={`${suppliers.length} ${t.suppliers.dealers}`} />
      </div>

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-3 pb-2">
          <SearchBar value={search} onChange={setSearch} placeholder={t.suppliers.searchPlaceholder} />
        </div>
        <div className="px-4 py-2 flex gap-3">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-gray-500">{t.suppliers.withUdharo}</p>
            <p className="text-sm font-bold text-amber-700">{withUdharo}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-gray-500">{t.suppliers.total}</p>
            <p className="text-sm font-bold text-[#1a56db]">{suppliers.length}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-gray-500">{t.suppliers.totalUdharo}</p>
            <p className="text-sm font-bold text-[#e02424]">{formatCurrency(totalUdharo)}</p>
          </div>
        </div>
        <div className="mx-4 bg-white rounded-2xl overflow-hidden border border-gray-100 mt-2">
          {loading && suppliers.length === 0 ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : suppliers.length === 0 ? (
            <EmptyState icon="🏭" title={t.suppliers.noSuppliers} subtitle={t.suppliers.noSuppliersDesc}
              actionLabel={t.suppliers.addSupplier} onAction={() => setShowForm(true)} />
          ) : (
            suppliers.map(s => <SupplierCard key={s.id} supplier={s} />)
          )}
        </div>
        <button onClick={() => setShowForm(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-amber-500 rounded-full shadow-lg shadow-amber-200 flex items-center justify-center active:scale-95 transition-transform z-40">
          <PlusIcon className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block desktop-page">
        <div className="desktop-toolbar">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.suppliers.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{suppliers.length} {t.suppliers.dealers} · {formatCurrency(totalUdharo)} {t.suppliers.totalUdharo}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-72">
              <SearchBar value={search} onChange={setSearch} placeholder={t.suppliers.searchPlaceholder} />
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
              <PlusIcon className="w-4 h-4" /> {t.suppliers.addSupplier}
            </button>
          </div>
        </div>
        <div className="flex gap-3 mb-5">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-bold text-amber-700">{withUdharo}</span>
            <span className="text-xs text-gray-500">{t.suppliers.withUdharo}</span>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-bold text-[#e02424]">{formatCurrency(totalUdharo)}</span>
            <span className="text-xs text-gray-500">{t.suppliers.totalUdharo}</span>
          </div>
        </div>
        <div className="desktop-card overflow-hidden">
          {loading && suppliers.length === 0 ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : suppliers.length === 0 ? (
            <EmptyState icon="🏭" title={t.suppliers.noSuppliers} subtitle={t.suppliers.noSuppliersDesc}
              actionLabel={t.suppliers.addSupplier} onAction={() => setShowForm(true)} />
          ) : (
            <table className="resp-table">
              <thead>
                <tr>
                  <th>{t.suppliers.name}</th>
                  <th>{t.suppliers.company}</th>
                  <th>{t.suppliers.phone}</th>
                  <th>{t.suppliers.totalPurchased}</th>
                  <th>{t.suppliers.totalPaid}</th>
                  <th>{t.suppliers.udharo}</th>
                  <th>{t.products.actions}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => {
                  const udharo = parseFloat(s.udharo ?? 0);
                  return (
                    <tr key={s.id} onClick={() => navigate(`/suppliers/${s.id}`)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-amber-700">
                              {(s.company_name || s.name || '?').substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="text-gray-500">{s.company_name ?? '—'}</td>
                      <td className="text-gray-600">{s.phone ?? '—'}</td>
                      <td className="font-medium">{formatCurrency(s.total_purchased ?? 0)}</td>
                      <td className="text-[#057a55] font-medium">{formatCurrency(s.total_paid ?? 0)}</td>
                      <td>
                        {udharo > 0
                          ? <span className="text-amber-700 font-bold">{formatCurrency(udharo)}</span>
                          : <span className="text-[#057a55] text-xs font-semibold bg-green-50 px-2 py-1 rounded-full">{t.customers.clear}</span>
                        }
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/suppliers/${s.id}`)}
                          className="flex items-center gap-1 text-xs text-[#1a56db] font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                          <EyeIcon className="w-3.5 h-3.5" /> {t.common.viewAll.split(' ')[0]}
                        </button>
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
        <SupplierForm onSave={handleAdd} onClose={() => setShowForm(false)} saving={saving} />
      )}

      <BottomNav />
    </div>
  );
}
