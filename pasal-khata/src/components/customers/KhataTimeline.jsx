import { ShoppingBagIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import { formatNepaliDate } from '../../utils/nepaliDate';
import { useTranslation } from '../../hooks/useTranslation';
import Badge from '../common/Badge';

function normaliseSale(sale) {
  return {
    id:     sale.id,
    date:   sale.sale_date ?? sale.date,
    total:  parseFloat(sale.total_amount ?? sale.total ?? 0),
    paid:   parseFloat(sale.paid_amount  ?? sale.paid  ?? 0),
    baki:   parseFloat(sale.baki_amount  ?? sale.baki  ?? 0),
    status: sale.payment_status ?? sale.status ?? 'partial',
    items:  sale.items ?? [],
  };
}

function normalisePayment(p) {
  return {
    id:     p.id,
    date:   p.payment_date ?? p.date,
    amount: parseFloat(p.amount ?? 0),
    note:   p.note ?? p.notes ?? null,
    method: p.payment_method ?? p.method ?? 'cash',
  };
}

function SaleEntry({ sale: raw }) {
  const sale     = normaliseSale(raw);
  const dateInfo = formatNepaliDate(sale.date);
  const { t }    = useTranslation();

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <ShoppingBagIcon className="w-4 h-4 text-[#1a56db]" />
        </div>
        <div className="w-0.5 bg-gray-100 flex-1 mt-1" />
      </div>
      <div className="flex-1 pb-4">
        <div className="bg-white border-l-4 border-[#1a56db] rounded-r-xl rounded-bl-xl p-3 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-[#1a56db] uppercase tracking-wide">{t.sales.title}</p>
              <p className="text-[11px] text-gray-400">{dateInfo.bs} · {dateInfo.ad}</p>
            </div>
            <Badge
              label={sale.baki > 0 ? t.sales.status.partial : t.sales.status.paid}
              color={sale.baki > 0 ? 'amber' : 'green'}
              size="xs"
            />
          </div>

          {sale.items.length > 0 && (
            <div className="space-y-1 mb-2">
              {sale.items.map((item, idx) => {
                const name  = item.product_name ?? item.name  ?? 'Item';
                const qty   = item.quantity      ?? item.qty   ?? 1;
                const total = parseFloat(item.total_price ?? item.total ?? 0);
                return (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-600">{name} × {qty}</span>
                    <span className="text-gray-700 font-medium">{formatCurrency(total)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-100 pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t.sales.total}</span>
              <span className="font-semibold text-gray-800">{formatCurrency(sale.total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t.sales.amountPaidLabel}</span>
              <span className="font-semibold text-green-700">{formatCurrency(sale.paid)}</span>
            </div>
            {sale.baki > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{t.customers.baki}</span>
                <span className="font-bold text-[#e02424]">{formatCurrency(sale.baki)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentEntry({ payment: raw }) {
  const payment  = normalisePayment(raw);
  const dateInfo = formatNepaliDate(payment.date);
  const { t }    = useTranslation();

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <BanknotesIcon className="w-4 h-4 text-[#057a55]" />
        </div>
        <div className="w-0.5 bg-gray-100 flex-1 mt-1" />
      </div>
      <div className="flex-1 pb-4">
        <div className="bg-white border-l-4 border-[#057a55] rounded-r-xl rounded-bl-xl p-3 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-bold text-[#057a55] uppercase tracking-wide">{t.payments.received}</p>
              <p className="text-[11px] text-gray-400">{dateInfo.bs} · {dateInfo.ad}</p>
            </div>
            <p className="text-base font-bold text-[#057a55]">{formatCurrency(payment.amount)}</p>
          </div>
          {payment.note && (
            <p className="text-xs text-gray-500 mt-1">📝 {payment.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KhataTimeline({ transactions }) {
  const { t } = useTranslation();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400 text-sm">{t.customers.noTransactions}</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      {transactions.map(tx =>
        tx.type === 'sale'
          ? <SaleEntry    key={tx.id} sale={tx}    />
          : <PaymentEntry key={tx.id} payment={tx} />
      )}
      <div className="text-center py-4">
        <p className="text-xs text-gray-300">— End of timeline —</p>
      </div>
    </div>
  );
}
