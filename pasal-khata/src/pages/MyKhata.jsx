import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
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

const WA_ICON = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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
            <KhataTimeline transactions={transactions} />
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
            {WA_ICON} {t.myKhata.shareWhatsApp}
          </button>
        </div>
      </div>
    </div>
  );
}
