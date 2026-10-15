import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import Avatar from '../components/common/Avatar';
import MetricCard from '../components/common/MetricCard';
import KhataTimeline from '../components/customers/KhataTimeline';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCustomerDetail } from '../hooks/useCustomerDetail';
import { formatCurrency } from '../utils/currency';
import { formatNepaliDate } from '../utils/nepaliDate';
import { shareOnWhatsApp } from '../utils/whatsapp';
import { useTranslation } from '../hooks/useTranslation';

const LogoutIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
  </svg>
);

export default function MyKhata() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { t, lang }      = useTranslation();

  const customerId = user?.customerId ?? user?.id;
  const { customer, transactions, loading } = useCustomerDetail(customerId);

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading && !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-400">{t.myKhata.loading}</p>
      </div>
    );
  }

  const name   = customer?.name  ?? user?.name  ?? '—';
  const phone  = customer?.phone ?? user?.phone ?? '—';
  const baki   = parseFloat(customer?.baki ?? 0);
  const bought = parseFloat(customer?.total_purchased ?? customer?.totalBought ?? 0);
  const paid   = parseFloat(customer?.total_paid      ?? customer?.totalPaid   ?? 0);
  const since  = customer?.created_at ?? customer?.memberSince;
  const memberDate = since ? formatNepaliDate(since) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-10">
        <TopBar
          title={t.myKhata.title}
          subtitle="My Khata"
          rightElement={
            <button onClick={handleLogout} className="p-2 rounded-xl bg-red-50" aria-label="Logout">
              <LogoutIcon />
            </button>
          }
        />

        <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <LockClosedIcon className="w-4 h-4 text-[#057a55] flex-shrink-0" />
          <p className="text-sm text-[#057a55] font-medium">{t.myKhata.privacy}</p>
        </div>

        <div className="pt-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <Avatar name={name} size="xl" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{name}</h2>
              <p className="text-sm text-gray-500">{phone}</p>
              {memberDate?.bs && (
                <p className="text-xs text-gray-400 mt-1">{t.myKhata.memberSince} {memberDate.bs}</p>
              )}
              {customer?.address && (
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{customer.address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 grid grid-cols-3 gap-2">
          <MetricCard label={t.myKhata.totalBought} value={formatCurrency(bought)} color="blue"  />
          <MetricCard label={t.myKhata.totalPaid}   value={formatCurrency(paid)}   color="green" />
          <MetricCard label={t.myKhata.baki}        value={formatCurrency(baki)}   color="red"   />
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">{t.myKhata.transactionHistory}</h2>
            <span className="text-xs text-gray-400">{transactions.length} {t.myKhata.entries}</span>
          </div>
          {transactions.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-sm font-semibold text-gray-600">{t.myKhata.noTransactions}</p>
              <p className="text-xs text-gray-400 mt-1">{t.myKhata.yourPurchases}</p>
            </div>
          ) : (
            <KhataTimeline transactions={transactions} viewAs="customer" />
          )}
        </div>

        <div className="pt-4 pb-2">
          <button
            onClick={() => shareOnWhatsApp(
              { name, phone, baki, total_purchased: bought, total_paid: paid },
              'My Shop',
              lang
            )}
            className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"
          >
            <WhatsAppIcon /> {t.myKhata.shareWhatsApp}
          </button>
        </div>
      </div>
    </div>
  );
}
