import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import { useTranslation } from '../hooks/useTranslation';
import MetricCard from '../components/common/MetricCard';
import QuickActions from '../components/dashboard/QuickActions';
import TopBakiList from '../components/dashboard/TopBakiList';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import { getTodayBs } from '../utils/nepaliDate';
import dayjs from 'dayjs';

export default function Dashboard() {
  const { data, loading, error } = useDashboard();
  const { user } = useAuth();
  const { t } = useTranslation();
  const todayBs  = getTodayBs();

  const dateRight = (
    <div className="flex flex-col items-end gap-0.5">
      <span className="bg-[#1a56db] text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
        {todayBs.bs}
      </span>
      <span className="text-gray-400 text-[10px]">{dayjs().format('MMM D, YYYY')}</span>
    </div>
  );

  return (
    /* Mobile: pb-24 for bottom nav. Desktop: no extra padding */
    <div className="pb-24 md:pb-0">

      {/* TopBar — hidden on desktop (sidebar handles nav) */}
      <div className="md:hidden">
        <TopBar
          title={user?.shopName ?? 'My Shop'}
          subtitle="पसल खाता"
          rightElement={dateRight}
        />
      </div>

      {/* Desktop page header */}
      <div className="hidden md:flex items-center justify-between px-7 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user?.shopName ?? 'My Shop'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">पसल खाता Dashboard</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="bg-[#1a56db] text-white text-xs font-medium px-3 py-1 rounded-full">
            {todayBs.bs}
          </span>
          <span className="text-gray-400 text-xs">{dayjs().format('MMM D, YYYY')}</span>
        </div>
      </div>

      {loading && !data && (
        <div className="flex justify-center pt-16"><LoadingSpinner size="lg" /></div>
      )}

      {error && !data && (
        <div className="mx-4 md:mx-7 mt-4 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* ── MOBILE layout ── */}
          <div className="md:hidden px-4 pt-4 space-y-5">
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <MetricCard label={t.dashboard.todaySales}   value={formatCurrency(data.todaySales?.total ?? 0)}      color="blue"  icon="📦" />
                <MetricCard label={t.dashboard.cashReceived} value={formatCurrency(data.todaySales?.cashAmount ?? 0)} color="green" icon="💵" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label={t.dashboard.thisMonth}  value={formatCurrency(data.thisMonthSales?.total ?? 0)}              color="blue"  icon="📅" />
                <MetricCard label={t.dashboard.totalBaki}  value={formatCurrency(data.totalBaki?.amount ?? 0)}                  color="red"   icon="⚠️" />
              </div>
              {(data.purchaseSummary?.totalUdharo?.amount ?? 0) > 0 && (
                <div className="mt-3">
                  <MetricCard
                    label={t.dashboard.supplierUdharo}
                    value={formatCurrency(data.purchaseSummary?.totalUdharo?.amount ?? 0)}
                    color="amber"
                    icon="🏭"
                    fullWidth
                  />
                </div>
              )}
            </div>
            <QuickActions />
            <TopBakiList customers={data.topBakiCustomers ?? []} />
            <RecentTransactions
              sales={data.recentTransactions?.filter(t => t.type === 'sale') ?? []}
              payments={data.recentTransactions?.filter(t => t.type === 'payment') ?? []}
            />
          </div>

          {/* ── DESKTOP layout ── */}
          <div className="hidden md:block px-7 pb-8">
            {/* 4-metric row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <MetricCard label={t.dashboard.todaySales}   value={formatCurrency(data.todaySales?.total ?? 0)}         color="blue"  icon="📦" />
              <MetricCard label={t.dashboard.cashReceived} value={formatCurrency(data.todaySales?.cashAmount ?? 0)}    color="green" icon="💵" />
              <MetricCard label={t.dashboard.thisMonth}    value={formatCurrency(data.thisMonthSales?.total ?? 0)}     color="blue"  icon="📅" />
              <MetricCard label={t.dashboard.totalBaki}    value={formatCurrency(data.totalBaki?.amount ?? 0)}         color="red"   icon="⚠️" />
            </div>

            {/* 2-column grid */}
            <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 320px' }}>
              {/* Left column */}
              <div className="space-y-5">
                {/* Quick actions — 4 across on desktop */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">{t.dashboard.quickActions}</h2>
                  <QuickActions desktop />
                </div>

                {/* Recent transactions */}
                <RecentTransactions
                  sales={data.recentTransactions?.filter(t => t.type === 'sale') ?? []}
                  payments={data.recentTransactions?.filter(t => t.type === 'payment') ?? []}
                />
              </div>

              {/* Right column */}
              <div className="space-y-5">
                {/* Top udharo suppliers */}
                {(data.topUdharoSuppliers ?? []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">{t.dashboard.supplierUdharo}</p>
                      <span className="text-xs font-bold text-amber-700">
                        {formatCurrency(data.purchaseSummary?.totalUdharo?.amount ?? 0)}
                      </span>
                    </div>
                    {(data.topUdharoSuppliers ?? []).map(s => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-amber-700">
                            {(s.companyName || s.name || '?').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                          {s.companyName && <p className="text-xs text-gray-400 truncate">{s.companyName}</p>}
                        </div>
                        <span className="text-sm font-bold text-amber-700 flex-shrink-0">
                          {formatCurrency(s.udharo)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <TopBakiList customers={data.topBakiCustomers ?? []} />
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
