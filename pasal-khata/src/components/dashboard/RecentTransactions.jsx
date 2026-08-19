import { useNavigate } from 'react-router-dom';
import { ShoppingBagIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import { formatNepaliDate } from '../../utils/nepaliDate';
import { useTranslation } from '../../hooks/useTranslation';
import Badge from '../common/Badge';

export default function RecentTransactions({ sales = [], payments = [] }) {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  const METHOD_LABELS = {
    cash:    t.payments.methods.cash,
    esewa:   t.payments.methods.esewa,
    khalti:  t.payments.methods.khalti,
    bank:    t.payments.methods.bank,
    banking: t.payments.methods.bank,
    cheque:  t.payments.methods.cheque,
  };

  const normaliseSale = s => ({
    id:           s.id,
    type:         'sale',
    customerName: s.customer_name ?? s.customerName ?? '—',
    description:  s.description ?? (
      Array.isArray(s.items)
        ? s.items.map(i => i.product_name ?? i.name).join(', ')
        : `${s.items_count ?? 0} ${t.purchases.items}`
    ),
    // dashboard pre-processes into `amount`; direct sale API uses `total_amount`
    amount: parseFloat(s.total_amount ?? s.amount ?? s.total ?? 0),
    baki:   parseFloat(s.baki_amount  ?? s.baki  ?? 0),
    date:   s.sale_date ?? s.date,
  });

  const normalisePayment = p => {
    const method      = p.payment_method ?? p.method ?? 'cash';
    const methodLabel = METHOD_LABELS[method] ?? method;
    const noteStr     = p.note ? ` · ${p.note}` : '';
    return {
      id:           p.id,
      type:         'payment',
      customerName: p.customer_name ?? p.customerName ?? '—',
      description:  p.description ?? `${t.payments.paymentVia} ${methodLabel}${noteStr}`,
      amount:       parseFloat(p.amount ?? 0),
      baki:         0,
      date:         p.payment_date ?? p.date,
    };
  };

  const recent = [
    ...sales.slice(0, 3).map(normaliseSale),
    ...payments.slice(0, 3).map(normalisePayment),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{t.dashboard.recentTransactions}</h2>
        <button onClick={() => navigate('/sales')} className="text-xs text-[#1a56db] font-medium">
          {t.common.viewAll}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {recent.map(item => {
          const isSale   = item.type === 'sale';
          const dateInfo = item.date ? formatNepaliDate(item.date) : null;

          return (
            <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 p-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSale ? 'bg-blue-50' : 'bg-green-50'
              }`}>
                {isSale
                  ? <ShoppingBagIcon className="w-5 h-5 text-[#1a56db]" />
                  : <BanknotesIcon   className="w-5 h-5 text-[#057a55]" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.customerName}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                {dateInfo && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{dateInfo.bs}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <p className={`text-sm font-bold ${isSale ? 'text-gray-800' : 'text-[#057a55]'}`}>
                  {isSale ? formatCurrency(item.amount) : `+${formatCurrency(item.amount)}`}
                </p>
                {isSale && (
                  <Badge
                    label={item.baki > 0 ? `${t.customers.baki} ${formatCurrency(item.baki)}` : t.sales.status.paid}
                    color={item.baki > 0 ? 'red' : 'green'}
                    size="xs"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
