import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PencilIcon, PhoneIcon, MapPinIcon, EnvelopeIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import MetricCard from '../components/common/MetricCard';
import UdharoTimeline from '../components/suppliers/UdharoTimeline';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ToastContainer } from '../components/common/Toast';
import { useSupplierDetail } from '../hooks/useSupplierDetail';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';
import { supplierService } from '../services/supplierService';
import { generateUdharoMessage } from '../utils/whatsapp';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon } from '@heroicons/react/24/outline';

const WA_ICON = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function UdharoPayForm({ supplier, onSave, onClose, saving }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note,   setNote]   = useState('');
  const [err,    setErr]    = useState('');
  const udharo = parseFloat(supplier?.udharo ?? 0);
  const methods = [
    { value: 'cash',   label: '💵 Cash'   },
    { value: 'esewa',  label: '🟢 eSewa'  },
    { value: 'khalti', label: '🟣 Khalti' },
    { value: 'bank',   label: '🏦 Bank'   },
    { value: 'cheque', label: '📄 Cheque' },
  ];
  const quickAmounts = [500, 1000, 2000, udharo].filter((v, i, a) => a.indexOf(v) === i && v > 0).slice(0, 4);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return; }
    onSave({ amount: amt, paymentMethod: method, note });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl mb-16 max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Pay उधारो</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600">Supplier</p>
              <p className="text-sm font-semibold text-gray-900">{supplier?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-600">उधारो</p>
              <p className="text-sm font-bold text-amber-700">{formatCurrency(udharo)}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (रु)</label>
              <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setErr(''); }}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
            </div>
            <div className="flex gap-2">
              {quickAmounts.map(v => (
                <button key={v} type="button" onClick={() => { setAmount(String(v)); setErr(''); }}
                  className="flex-1 bg-amber-50 text-amber-700 text-xs font-semibold py-2 rounded-lg border border-amber-100 hover:bg-amber-100">
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {methods.map(m => (
                  <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      method === m.value ? 'bg-[#1a56db] text-white border-[#1a56db]' : 'bg-white text-gray-700 border-gray-200'
                    }`}>{m.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Partial payment"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Pay उधारो'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SupplierDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, showSuccess, showError, remove } = useToast();
  const { supplier, transactions, loading, error, payUdharo } = useSupplierDetail(id);
  const [showPayForm,  setShowPayForm]  = useState(false);
  const [paying,       setPaying]       = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const { t, lang } = useTranslation();

  if (loading && !supplier) return <div className="flex justify-center pt-24"><LoadingSpinner size="lg" /></div>;
  if (error && !supplier)   return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <p className="text-4xl">🔍</p>
      <p className="text-gray-500 text-sm">{error}</p>
      <button onClick={() => navigate('/suppliers')} className="text-[#1a56db] text-sm font-medium">← Back</button>
    </div>
  );
  if (!supplier) return null;

  const udharo   = parseFloat(supplier.udharo ?? 0);
  const bought   = parseFloat(supplier.total_purchased ?? 0);
  const paid     = parseFloat(supplier.total_paid ?? 0);

  const handlePaySave = async (data) => {
    setPaying(true);
    try {
      await payUdharo(data);
      showSuccess(`Payment of ${formatCurrency(data.amount)} recorded!`);
      setShowPayForm(false);
    } catch (err) {
      showError(err.message || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supplierService.delete(id);
      navigate('/suppliers', { replace: true });
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to delete supplier');
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleWhatsApp = () => {
    const msg = generateUdharoMessage(supplier, user?.shopName ?? 'My Shop', lang);    const phone = (supplier.phone ?? '').replace(/\D/g, '');
    const url = phone ? `https://wa.me/977${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const ProfileCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-black text-amber-700">
            {(supplier.company_name || supplier.name || '?').substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900">{supplier.name}</h2>
          {supplier.company_name && <p className="text-sm text-amber-700 font-medium">{supplier.company_name}</p>}
          <div className="space-y-1 mt-1.5">
            {supplier.phone && (
              <div className="flex items-center gap-1.5">
                <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <a href={`tel:${supplier.phone}`} className="text-sm text-[#1a56db]">{supplier.phone}</a>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-center gap-1.5">
                <MapPinIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-500 truncate">{supplier.address}</p>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-1.5">
                <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-500 truncate">{supplier.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="space-y-2">
      <button onClick={() => setShowPayForm(true)} disabled={udharo <= 0}
        className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-amber-600 transition-colors">
        💰 {t.suppliers.payUdharo}
      </button>
      <button onClick={() => navigate(`/purchases/new?supplierId=${id}`)}
        className="w-full border border-amber-200 text-amber-700 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors">
        🛒 {t.suppliers.newPurchase}
      </button>
      <button onClick={handleWhatsApp}
        className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-500 transition-colors">
        {WA_ICON} {t.suppliers.shareWhatsApp}
      </button>
    </div>
  );

  return (
    <div className="pb-24 md:pb-0">
      <ToastContainer toasts={toasts} onClose={remove} />

      {/* MOBILE TopBar */}
      <div className="md:hidden">
        <TopBar
          title={supplier.name}
          showBack
          rightElement={
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl bg-gray-100"><PencilIcon className="w-4 h-4 text-gray-600" /></button>
              <button onClick={() => setShowDelete(true)} className="p-2 rounded-xl bg-red-50">
                <TrashIcon className="w-4 h-4 text-[#e02424]" />
              </button>
            </div>
          }
        />
      </div>

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-4"><ProfileCard /></div>
        <div className="px-4 pt-3 grid grid-cols-3 gap-2">
          <MetricCard label={t.suppliers.totalPurchased} value={formatCurrency(bought)} color="blue"  />
          <MetricCard label={t.suppliers.totalPaid}      value={formatCurrency(paid)}   color="green" />
          <MetricCard label={t.suppliers.udharo}         value={formatCurrency(udharo)} color="amber" />
        </div>
        <div className="mt-5">
          <div className="px-4 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">{t.suppliers.transactionHistory}</h2>
            {loading && <LoadingSpinner size="sm" />}
          </div>
          <div className="px-4"><UdharoTimeline transactions={transactions} /></div>
        </div>
        {/* Action buttons — below timeline */}
        <div className="px-4 pt-4 pb-6"><ActionButtons /></div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block desktop-page">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{supplier.name}</h1>
            {supplier.company_name && <p className="text-sm text-amber-600">{supplier.company_name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50">
              <PencilIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => setShowDelete(true)} className="p-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100">
              <TrashIcon className="w-4 h-4 text-[#e02424]" />
            </button>
          </div>
        </div>
        <div className="grid gap-6" style={{ gridTemplateColumns: '380px 1fr' }}>
          <div className="space-y-4">
            <ProfileCard />
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label={t.suppliers.totalPurchased} value={formatCurrency(bought)} color="blue"  />
              <MetricCard label={t.suppliers.totalPaid}      value={formatCurrency(paid)}   color="green" />
              <MetricCard label={t.suppliers.udharo}         value={formatCurrency(udharo)} color="amber" />
            </div>
            <ActionButtons />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">{t.suppliers.transactionHistory}</h2>
              {loading && <LoadingSpinner size="sm" />}
            </div>
            <UdharoTimeline transactions={transactions} />
          </div>
        </div>
      </div>

      {showPayForm && (
        <UdharoPayForm supplier={supplier} saving={paying} onSave={handlePaySave} onClose={() => setShowPayForm(false)} />
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setShowDelete(false)} />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl px-5 pt-5 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <ExclamationTriangleIcon className="w-7 h-7 text-[#e02424]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{t.suppliers.deleteSupplier}</h3>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-semibold text-gray-800">{supplier.name}</span> हटाइनेछ।
              </p>
              {udharo > 0 && (
                <div className="mt-3 w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  <p className="text-xs font-semibold text-amber-700">
                    ⚠️ यो supplier को {formatCurrency(udharo)} उधारो बाँकी छ। पहिले उधारो चुक्ता गर्नुस्।
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                {t.common.cancel}
              </button>
              <button onClick={handleDelete} disabled={deleting || udharo > 0}
                className="flex-1 bg-[#e02424] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                {deleting ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>{t.common.loading}</> : <><TrashIcon className="w-4 h-4" /> {t.common.delete}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
