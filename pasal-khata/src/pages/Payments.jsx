import { useState } from 'react';
import { BanknotesIcon, PlusIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Avatar from '../components/common/Avatar';
import PaymentForm from '../components/payments/PaymentForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { ToastContainer } from '../components/common/Toast';
import { usePayments } from '../hooks/usePayments';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomers } from '../hooks/useCustomers';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';
import { formatNepaliDate } from '../utils/nepaliDate';

const METHOD_ICONS  = { cash: '💵', esewa: '🟢', banking: '🏦', bank: '🏦', khalti: '🟣' };

export default function Payments() {
  const [filter, setFilter] = useState('week');
  const { payments, loading, refetch, createPayment } = usePayments(filter);
  const { customers }       = useCustomers();
  const [showForm,           setShowForm]           = useState(false);
  const [selectedCustomer,   setSelectedCustomer]   = useState(null);
  const [saving,             setSaving]             = useState(false);
  const { toasts, showSuccess, showError, remove }  = useToast();
  const { t } = useTranslation();

  const METHOD_LABELS = {
    cash: t.payments.methods.cash,
    esewa: t.payments.methods.esewa,
    banking: t.payments.methods.bank,
    bank: t.payments.methods.bank,
    khalti: t.payments.methods.khalti,
  };

  const FILTERS = [
    { key: 'today', label: t.common.today    },
    { key: 'week',  label: t.common.thisWeek },
    { key: 'month', label: t.common.thisMonth},
  ];

  const totalReceived = payments.reduce((s, p) => s + parseFloat(p.amount ?? 0), 0);

  const openPaymentForm = () => {
    const withBaki = customers.find(c => parseFloat(c.baki ?? 0) > 0);
    setSelectedCustomer(withBaki || customers[0] || null);
    setShowForm(true);
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      await createPayment(data);
      showSuccess(t.toast.paymentReceived);
      setShowForm(false);
      refetch();
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setSaving(false);
    }
  };

  const FilterTabs = () => (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
      {FILTERS.map(f => (
        <button key={f.key} onClick={() => setFilter(f.key)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            filter === f.key ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-500'
          }`}>
          {f.label}
        </button>
      ))}
    </div>
  );

  const PaymentRow = ({ p }) => {
    const name    = p.customer_name ?? p.customerName ?? '—';
    const method  = p.payment_method ?? p.method ?? 'cash';
    const dateStr = p.payment_date ?? p.date;
    const dateInfo = dateStr ? formatNepaliDate(dateStr) : null;
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
        <Avatar name={name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {METHOD_ICONS[method] ?? '💵'} {p.note ?? p.notes ?? t.payments.received}
          </p>
          {dateInfo && <p className="text-[10px] text-gray-400">{dateInfo.bs}</p>}
        </div>
        <p className="text-base font-bold text-[#057a55] flex-shrink-0">
          +{formatCurrency(p.amount)}
        </p>
      </div>
    );
  };

  return (
    <div className="pb-24 md:pb-0">
      <ToastContainer toasts={toasts} onClose={remove} />

      {/* MOBILE TopBar */}
      <div className="md:hidden">
        <TopBar title={t.payments.title} subtitle={t.payments.title} />
      </div>

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-3">
          <FilterTabs />
        </div>
        <div className="px-4 pt-3">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="w-5 h-5 text-[#057a55]" />
              </div>
              <div>
                <p className="text-xs text-green-600">{t.payments.totalReceived}</p>
                <p className="text-lg font-black text-[#057a55]">{formatCurrency(totalReceived)}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-green-600">{payments.length} {t.payments.payments}</p>
          </div>
        </div>
        <div className="px-4 pt-3">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading && payments.length === 0 ? (
              <div className="py-12 flex justify-center"><LoadingSpinner /></div>
            ) : payments.length === 0 ? (
              <EmptyState icon="💳" title={t.payments.noPayments} subtitle={t.payments.noPaymentsDesc} />
            ) : (
              payments.map(p => <PaymentRow key={p.id} p={p} />)
            )}
          </div>
        </div>
        <div className="px-4 pt-4">
          <button onClick={openPaymentForm}
            className="w-full bg-[#057a55] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <BanknotesIcon className="w-5 h-5" />
            {t.payments.receiveNewPayment}
          </button>
        </div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block desktop-page">
        <div className="desktop-toolbar">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.payments.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t.payments.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64"><FilterTabs /></div>
            <button onClick={openPaymentForm}
              className="flex items-center gap-2 bg-[#057a55] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors whitespace-nowrap">
              <PlusIcon className="w-4 h-4" />
              {t.payments.receivePayment}
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-5">
          <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-[#057a55]" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">{t.payments.totalReceived}</p>
              <p className="text-xl font-black text-[#057a55]">{formatCurrency(totalReceived)}</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-3.5">
            <p className="text-xs text-gray-500 font-medium">{t.payments.payments}</p>
            <p className="text-xl font-bold text-gray-700">{payments.length}</p>
          </div>
        </div>

        <div className="desktop-card overflow-hidden">
          {loading && payments.length === 0 ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : payments.length === 0 ? (
            <EmptyState icon="💳" title={t.payments.noPayments} subtitle={t.payments.noPaymentsDesc} />
          ) : (
            <table className="resp-table">
              <thead>
                <tr>
                  <th>{t.customers.name}</th>
                  <th>{t.payments.method}</th>
                  <th>{t.payments.note}</th>
                  <th>{t.purchases.dateBS}</th>
                  <th>{t.payments.amount}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const name    = p.customer_name ?? p.customerName ?? '—';
                  const method  = p.payment_method ?? p.method ?? 'cash';
                  const dateStr = p.payment_date ?? p.date;
                  const dateInfo = dateStr ? formatNepaliDate(dateStr) : null;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={name} size="sm" />
                          <span className="font-semibold text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2.5 py-1 rounded-full font-medium text-gray-600">
                          {METHOD_ICONS[method] ?? '💵'} {METHOD_LABELS[method] ?? method}
                        </span>
                      </td>
                      <td className="text-gray-500">{p.note ?? p.notes ?? '—'}</td>
                      <td className="text-gray-600 whitespace-nowrap">{dateInfo?.bs ?? '—'}</td>
                      <td>
                        <span className="text-base font-bold text-[#057a55]">+{formatCurrency(p.amount)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && selectedCustomer && (
        <PaymentForm
          customer={selectedCustomer}
          saving={saving}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
