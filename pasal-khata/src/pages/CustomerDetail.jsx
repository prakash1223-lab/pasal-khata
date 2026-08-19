import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PencilIcon, PhoneIcon, MapPinIcon, CalendarIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import Avatar from '../components/common/Avatar';
import MetricCard from '../components/common/MetricCard';
import KhataTimeline from '../components/customers/KhataTimeline';
import PaymentForm from '../components/payments/PaymentForm';
import CustomerForm from '../components/customers/CustomerForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ToastContainer } from '../components/common/Toast';
import { useCustomerDetail } from '../hooks/useCustomerDetail';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';
import { formatNepaliDate } from '../utils/nepaliDate';
import { shareOnWhatsApp } from '../utils/whatsapp';
import { customerService } from '../services/customerService';
import { useTranslation } from '../hooks/useTranslation';

const WA_ICON = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function CustomerDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { toasts, showSuccess, showError, remove } = useToast();
  const { customer, transactions, loading, error, receivePayment, refetch } = useCustomerDetail(id);
  const { t, lang } = useTranslation();

  const [showPayment, setShowPayment] = useState(false);
  const [paying,      setPaying]      = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [saving,      setSaving]      = useState(false);

  if (loading && !customer) {
    return <div className="flex justify-center pt-24"><LoadingSpinner size="lg" /></div>;
  }

  if (error && !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-4xl">🔍</p>
        <p className="text-gray-500 text-sm">{error}</p>
        <button onClick={() => navigate('/customers')} className="text-[#1a56db] text-sm font-medium">← Back</button>
      </div>
    );
  }

  if (!customer) return null;

  const baki        = parseFloat(customer.baki ?? 0);
  const totalBought = parseFloat(customer.total_purchased ?? customer.totalBought ?? 0);
  const totalPaid   = parseFloat(customer.total_paid      ?? customer.totalPaid    ?? 0);
  const memberDate  = formatNepaliDate(customer.created_at ?? customer.memberSince ?? new Date());

  const handlePaymentSave = async (data) => {
    setPaying(true);
    try {
      await receivePayment(data);
      showSuccess(t.toast.paymentReceived);
      setShowPayment(false);
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setPaying(false);
    }
  };

  const handleEditSave = async (data) => {
    setSaving(true);
    try {
      await customerService.update(customer.id, data);
      showSuccess(t.toast.customerUpdated);
      setShowEdit(false);
      refetch();
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await customerService.delete(customer.id);
      navigate('/customers', { replace: true });
    } catch (err) {
      const msg = err.message || t.errors.serverError;
      showError(msg);
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const EditButton = () => (
    <button
      onClick={() => setShowEdit(true)}
      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
      aria-label="Edit customer"
    >
      <PencilIcon className="w-4 h-4 text-gray-600" />
    </button>
  );

  return (
    <div className="pb-24 md:pb-0">
      <ToastContainer toasts={toasts} onClose={remove} />

      <TopBar
        title={customer.name}
        showBack
        rightElement={
          <div className="flex items-center gap-2">
            <EditButton />
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 rounded-xl bg-red-50"
              aria-label="Delete customer"
            >
              <TrashIcon className="w-4 h-4 text-[#e02424]" />
            </button>
          </div>
        }
      />

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-4">
              <Avatar name={customer.name} size="xl" />
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900">{customer.name}</h2>
                <div className="space-y-1 mt-1.5">
                  {customer.phone && (
                    <div className="flex items-center gap-1.5">
                      <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${customer.phone}`} className="text-sm text-[#1a56db]">{customer.phone}</a>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-500 truncate">{customer.address}</p>
                    </div>
                  )}
                  {memberDate.bs && (
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-400">Since {memberDate.bs}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-3 grid grid-cols-3 gap-2">
          <MetricCard label={t.customers.totalBought} value={formatCurrency(totalBought)} color="blue"  />
          <MetricCard label={t.customers.totalPaid}   value={formatCurrency(totalPaid)}   color="green" />
          <MetricCard label={t.customers.baki}        value={formatCurrency(baki)}        color="red"   />
        </div>

        <div className="px-4 pt-3 space-y-2">
          <button
            onClick={() => setShowPayment(true)}
            disabled={baki <= 0}
            className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            💵 {t.customers.receivePayment}
          </button>
          <button
            onClick={() => shareOnWhatsApp(customer, user?.shopName ?? 'My Shop', lang)}
            className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            {WA_ICON} {t.customers.shareWhatsApp}
          </button>
        </div>

        <div className="mt-5">
          <div className="px-4 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">{t.customers.khataHistory}</h2>
            {loading && <LoadingSpinner size="sm" />}
          </div>
          <div className="px-4">
            <KhataTimeline transactions={transactions} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block desktop-page">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">{customer.phone} {memberDate.bs ? `· Since ${memberDate.bs}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <EditButton />
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100"
            >
              <TrashIcon className="w-4 h-4 text-[#e02424]" />
            </button>
          </div>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: '380px 1fr' }}>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <Avatar name={customer.name} size="xl" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-gray-900">{customer.name}</h2>
                  <div className="space-y-1.5 mt-2">
                    {customer.phone && (
                      <div className="flex items-center gap-1.5">
                        <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${customer.phone}`} className="text-sm text-[#1a56db]">{customer.phone}</a>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-500">{customer.address}</p>
                      </div>
                    )}
                    {memberDate.bs && (
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-400">Member since {memberDate.bs}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MetricCard label={t.customers.totalBought} value={formatCurrency(totalBought)} color="blue"  />
              <MetricCard label={t.customers.totalPaid}   value={formatCurrency(totalPaid)}   color="green" />
              <MetricCard label={t.customers.baki}        value={formatCurrency(baki)}        color="red"   />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowPayment(true)}
                disabled={baki <= 0}
                className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                💵 {t.customers.receivePayment}
              </button>
              <button
                onClick={() => shareOnWhatsApp(customer, user?.shopName ?? 'My Shop', lang)}
                className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"
              >
                {WA_ICON} {t.customers.shareWhatsApp}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">{t.customers.khataHistory}</h2>
              {loading && <LoadingSpinner size="sm" />}
            </div>
            <KhataTimeline transactions={transactions} />
          </div>
        </div>
      </div>

      {/* ── Payment modal ── */}
      {showPayment && (
        <PaymentForm
          customer={{ ...customer, baki }}
          saving={paying}
          onSave={handlePaymentSave}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* ── Edit modal ── */}
      {showEdit && (
        <CustomerForm
          customer={customer}
          onSave={handleEditSave}
          onClose={() => setShowEdit(false)}
          saving={saving}
        />
      )}

      {/* ── Delete confirmation ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setShowDelete(false)}
          />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl px-5 pt-5 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <ExclamationTriangleIcon className="w-7 h-7 text-[#e02424]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{t.customers.deleteCustomer}</h3>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-semibold text-gray-800">{customer.name}</span> र तिनको सबै लेनदेन रेकर्ड हटाइनेछ।
              </p>
              {baki > 0 && (
                <div className="mt-3 w-full bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <p className="text-xs font-semibold text-[#e02424]">
                    ⚠️ यो ग्राहकको {formatCurrency(baki)} बाँकी छ। पहिले बाँकी शोध्नुस्।
                  </p>
                </div>
              )}
              {baki === 0 && (
                <p className="text-xs text-[#e02424] mt-2 font-medium">यो काम पूर्ववत गर्न सकिँदैन।</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50">
                {t.common.cancel}
              </button>
              <button onClick={handleDelete} disabled={deleting || baki > 0}
                className="flex-1 bg-[#e02424] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                {deleting ? (
                  <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>{t.common.loading}</>
                ) : (
                  <><TrashIcon className="w-4 h-4" /> {t.common.delete}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
