import { useState } from 'react';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useDashboard } from '../hooks/useDashboard';
import { useTranslation } from '../hooks/useTranslation';
import { formatCurrency } from '../utils/currency';

export default function Reports() {
  const [period, setPeriod] = useState('month');
  const { data, loading }   = useDashboard();
  const { t }               = useTranslation();

  const PERIODS = [
    { key: 'week',  label: t.reports.period.week  },
    { key: 'month', label: t.reports.period.month },
    { key: 'year',  label: t.reports.period.year  },
  ];

  const month      = data?.thisMonthSales     ?? { total: 0, count: 0 };
  const baki       = data?.totalBaki          ?? { amount: 0 };
  const today      = data?.todaySales         ?? { total: 0, cashAmount: 0, creditAmount: 0 };
  const profit     = data?.profitSummary?.thisMonth;
  const totalSales = parseFloat(month.total   ?? 0);
  const cashSales  = parseFloat(today.cashAmount ?? 0);
  const creditSales = Math.max(0, totalSales - cashSales);
  const topBaki    = data?.topBakiCustomers   ?? [];
  const recentTx   = data?.recentTransactions ?? [];

  // Gross profit — use real data if available, else null
  const grossProfit       = parseFloat(profit?.grossProfit ?? 0);
  const profitMargin      = parseFloat(profit?.profitMarginPercent ?? 0);
  const isLoss            = grossProfit < 0;

  const SummaryCard = ({ label, value, sub, bg, border, text, subColor }) => (
    <div className={`${bg} border ${border} rounded-2xl p-4`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-lg font-black ${text} mt-1`}>{value}</p>
      {sub && <p className={`text-[10px] ${subColor} mt-1`}>{sub}</p>}
    </div>
  );

  const productQtyMap = {};
  recentTx.filter(t => t.type === 'sale').forEach(t => {
    if (Array.isArray(t.items)) {
      t.items.forEach(i => {
        const name = i.product_name ?? i.name ?? 'Item';
        productQtyMap[name] = (productQtyMap[name] ?? 0) + parseFloat(i.quantity ?? i.qty ?? 1);
      });
    }
    if (!t.items && t.description) {
      productQtyMap[t.description] = (productQtyMap[t.description] ?? 0) + 1;
    }
  });
  const topProducts = Object.entries(productQtyMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const safePercent = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0;

  const FilterTabs = ({ className = '' }) => (
    <div className={`flex bg-gray-100 rounded-xl p-1 gap-1 ${className}`}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => setPeriod(p.key)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            period === p.key ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-500'
          }`}>
          {p.label}
        </button>
      ))}
    </div>
  );

  const summaryCards = [
    { label: t.reports.cashSales,   value: formatCurrency(totalSales),  sub: `${month.count} ${t.dashboard.transactions}`, bg: 'bg-blue-50',  border: 'border-blue-100',  text: 'text-blue-700',   subColor: 'text-blue-400'  },
    { label: t.payments.totalReceived, value: formatCurrency(cashSales), sub: t.payments.methods.cash,                      bg: 'bg-green-50', border: 'border-green-100', text: 'text-[#057a55]',  subColor: 'text-green-400' },
    { label: `${t.customers.baki} (${t.customers.baki})`, value: formatCurrency(baki.amount), sub: t.reports.totalOutstanding, bg: 'bg-red-50', border: 'border-red-100', text: 'text-[#e02424]', subColor: 'text-red-400' },
    {
      label: isLoss ? t.reports.netLoss : t.reports.grossProfit,
      value: formatCurrency(Math.abs(grossProfit)),
      sub:   profit ? `${profitMargin}% ${t.reports.margin}` : t.reports.topProducts,
      bg:    isLoss ? 'bg-red-50'   : 'bg-amber-50',
      border:isLoss ? 'border-red-100' : 'border-amber-100',
      text:  isLoss ? 'text-[#e02424]' : 'text-amber-700',
      subColor: isLoss ? 'text-red-400' : 'text-amber-400',
    },
  ];

  return (
    <div className="pb-24 md:pb-0">
      {/* MOBILE TopBar */}
      <div className="md:hidden">
        <TopBar title={t.reports.title} subtitle={t.reports.businessAnalysis} />
        <div className="px-4 pt-3">
          <FilterTabs />
          <p className="text-[10px] text-gray-400 text-center mt-1">{t.reports.showingThisMonth}</p>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center pt-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* ── MOBILE layout ── */}
          <div className="md:hidden px-4 pt-4 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.reports.overview}</h2>
              <div className="grid grid-cols-2 gap-3">
                {summaryCards.map(c => <SummaryCard key={c.label} {...c} />)}
              </div>
            </div>

            {topProducts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.reports.topSelling}</h2>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {topProducts.map(([name, qty], idx) => (
                    <div key={name} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-500'
                      }`}>{idx + 1}</div>
                      <p className="flex-1 text-sm font-semibold text-gray-900">{name}</p>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#1a56db]">{qty}</span>
                        <span className="text-xs text-gray-400 ml-1">{t.reports.sold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topBaki.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.reports.highestBaki}</h2>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {topBaki.map((c, idx) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600 flex-shrink-0">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone}</p>
                      </div>
                      <span className="text-sm font-bold text-[#e02424] flex-shrink-0">{formatCurrency(c.baki)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalSales > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.reports.salesBreakdown}</h2>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  {[
                    { label: t.reports.cash,   pct: safePercent(cashSales,   totalSales), color: 'bg-[#057a55]', textColor: 'text-[#057a55]' },
                    { label: t.reports.credit, pct: safePercent(creditSales, totalSales), color: 'bg-[#e02424]', textColor: 'text-[#e02424]' },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{bar.label}</span>
                        <span className={`font-medium ${bar.textColor}`}>{bar.pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${bar.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profit & Loss */}
            {profit && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.reports.profitLoss}</h2>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{t.reports.grossRevenue}</span>
                    <span className="text-xs font-semibold text-blue-700">{formatCurrency(profit.totalRevenue ?? 0)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{t.reports.totalCost}</span>
                    <span className="text-xs font-semibold text-red-600">{formatCurrency(profit.totalCost ?? 0)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-700">{isLoss ? t.reports.netLoss : t.reports.grossProfit}</span>
                    <span className={`text-xs font-black ${isLoss ? 'text-[#e02424]' : 'text-green-700'}`}>
                      {isLoss ? '-' : ''}{formatCurrency(Math.abs(grossProfit))}
                    </span>
                  </div>
                  <div className={`rounded-xl p-2 flex items-center justify-between ${isLoss ? 'bg-red-50' : 'bg-green-50'}`}>
                    <span className={`text-xs font-semibold ${isLoss ? 'text-red-700' : 'text-green-700'}`}>
                      {isLoss ? t.reports.loss : t.reports.margin}
                    </span>
                    <span className={`text-sm font-black ${isLoss ? 'text-[#e02424]' : 'text-green-700'}`}>
                      {isLoss ? '-' : ''}{Math.abs(profitMargin)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier उधारो */}
            {(data?.purchaseSummary?.totalUdharo?.amount ?? 0) > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.reports.supplierUdharo}</h2>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-600 font-medium">{t.reports.totalOutstanding}</span>
                  <span className="text-base font-black text-amber-700">{formatCurrency(data.purchaseSummary.totalUdharo.amount)}</span>
                </div>
                {(data?.topUdharoSuppliers ?? []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {(data.topUdharoSuppliers ?? []).slice(0, 3).map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                          {s.companyName && <p className="text-xs text-gray-400">{s.companyName}</p>}
                        </div>
                        <span className="text-sm font-bold text-amber-700">{formatCurrency(s.udharo)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── DESKTOP layout ── */}
          <div className="hidden md:block desktop-page">
            <div className="desktop-toolbar">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t.reports.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{t.reports.businessAnalysis} · {t.reports.showingThisMonth}</p>
              </div>
              <div className="w-72">
                <FilterTabs />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {summaryCards.map(c => <SummaryCard key={c.label} {...c} />)}
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>
              <div className="space-y-5">
                {totalSales > 0 && (
                  <div className="desktop-card p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">{t.reports.salesBreakdown}</h2>
                    <div className="space-y-4">
                      {[
                        { label: t.reports.cash,   pct: safePercent(cashSales,   totalSales), color: 'bg-[#057a55]', textColor: 'text-[#057a55]', value: formatCurrency(cashSales) },
                        { label: t.reports.credit, pct: safePercent(creditSales, totalSales), color: 'bg-[#e02424]', textColor: 'text-[#e02424]', value: formatCurrency(creditSales) },
                      ].map(bar => (
                        <div key={bar.label}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 font-medium">{bar.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500">{bar.value}</span>
                              <span className={`font-bold ${bar.textColor}`}>{bar.pct}%</span>
                            </div>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${bar.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profit && (
                  <div className="desktop-card p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">{t.reports.profitLoss} ({t.common.thisMonth})</h2>
                    <div className="space-y-3">
                      {[
                        { label: t.reports.grossRevenue, value: formatCurrency(profit.totalRevenue ?? 0), color: 'text-blue-700' },
                        { label: t.reports.totalCost,    value: formatCurrency(profit.totalCost ?? 0),    color: 'text-red-600' },
                        { label: isLoss ? t.reports.netLoss : t.reports.grossProfit, value: (isLoss ? '-' : '') + formatCurrency(Math.abs(grossProfit)), color: isLoss ? 'text-[#e02424]' : 'text-green-700', bold: true },
                      ].map(row => (
                        <div key={row.label} className={`flex justify-between items-center py-2 ${row.bold ? 'border-t border-gray-200 pt-3' : 'border-b border-gray-50'}`}>
                          <span className="text-sm text-gray-600">{row.label}</span>
                          <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                      <div className={`rounded-xl p-3 flex items-center justify-between ${isLoss ? 'bg-red-50' : 'bg-green-50'}`}>
                        <span className={`text-sm font-semibold ${isLoss ? 'text-red-700' : 'text-green-700'}`}>
                          {isLoss ? t.reports.lossMarg : t.reports.profitMarg}
                        </span>
                        <span className={`text-lg font-black ${isLoss ? 'text-[#e02424]' : 'text-green-700'}`}>
                          {isLoss ? '-' : ''}{Math.abs(profitMargin)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {topProducts.length > 0 && (
                  <div className="desktop-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                      <h2 className="text-sm font-semibold text-gray-700">{t.reports.topSelling}</h2>
                    </div>
                    {topProducts.map(([name, qty], idx) => (
                      <div key={name} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-500'
                        }`}>{idx + 1}</div>
                        <p className="flex-1 text-sm font-semibold text-gray-900">{name}</p>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[#1a56db]">{qty}</span>
                          <span className="text-xs text-gray-400 ml-1">{t.reports.sold}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {(data?.purchaseSummary?.totalUdharo?.amount ?? 0) > 0 && (
                  <div className="desktop-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-700">{t.reports.supplierUdharo}</h2>
                      <span className="text-sm font-bold text-amber-700">
                        {formatCurrency(data.purchaseSummary.totalUdharo.amount)}
                      </span>
                    </div>
                    {(data?.topUdharoSuppliers ?? []).slice(0, 3).map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
                        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-amber-700">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                          {s.companyName && <p className="text-xs text-gray-400">{s.companyName}</p>}
                        </div>
                        <span className="text-sm font-bold text-amber-700">{formatCurrency(s.udharo)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {topBaki.length > 0 && (
                  <div className="desktop-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                      <h2 className="text-sm font-semibold text-gray-700">{t.reports.highestBaki}</h2>
                    </div>
                    {topBaki.map((c, idx) => (
                      <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600 flex-shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.phone}</p>
                        </div>
                        <span className="text-sm font-bold text-[#e02424] flex-shrink-0">{formatCurrency(c.baki)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="desktop-card p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">{t.reports.quickStats}</h2>
                  {[
                    { label: t.reports.transactions,         value: `${month.count}` },
                    { label: t.reports.avgSaleValue,         value: month.count > 0 ? formatCurrency(totalSales / month.count) : '—' },
                    { label: t.reports.thisMonthPurchases,   value: formatCurrency(data?.purchaseSummary?.thisMonthPurchases?.total ?? 0) },
                    { label: t.reports.totalCustomers,       value: `${data?.totalCustomers ?? 0}` },
                    { label: t.reports.totalProducts,        value: `${data?.totalProducts ?? 0}` },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{s.label}</span>
                      <span className="text-sm font-bold text-gray-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
