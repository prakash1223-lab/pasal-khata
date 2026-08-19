import { ShoppingCartIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import { formatNepaliDate } from '../../utils/nepaliDate';
import Badge from '../common/Badge';

const METHOD_ICONS = { cash: '💵', esewa: '🟢', khalti: '🟣', bank: '🏦', cheque: '📄' };

function PurchaseEntry({ entry }) {
  const dateInfo = formatNepaliDate(entry.date);
  const total    = parseFloat(entry.total_amount ?? 0);
  const paid     = parseFloat(entry.paid_amount  ?? 0);
  const udharo   = parseFloat(entry.udharo_amount ?? 0);
  const items    = entry.items ?? [];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <ShoppingCartIcon className="w-4 h-4 text-amber-700" />
        </div>
        <div className="w-0.5 bg-gray-100 flex-1 mt-1" />
      </div>
      <div className="flex-1 pb-4">
        <div className="bg-white border-l-4 border-amber-400 rounded-r-xl rounded-bl-xl p-3 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Purchase</p>
              <p className="text-[11px] text-gray-400">{dateInfo.bs} · {dateInfo.ad}</p>
              {entry.invoice_number && (
                <p className="text-[10px] text-gray-400">Invoice: {entry.invoice_number}</p>
              )}
            </div>
            <Badge
              label={udharo > 0 ? 'Partial' : 'Paid'}
              color={udharo > 0 ? 'amber' : 'green'}
              size="xs"
            />
          </div>
          {items.length > 0 && (
            <div className="space-y-1 mb-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-600">{item.name} × {item.qty} {item.unit ?? ''}</span>
                  <span className="text-gray-700 font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-800">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Paid</span>
              <span className="font-semibold text-green-700">{formatCurrency(paid)}</span>
            </div>
            {udharo > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">उधारो</span>
                <span className="font-bold text-amber-700">{formatCurrency(udharo)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentEntry({ entry }) {
  const dateInfo = formatNepaliDate(entry.date);
  const method   = entry.payment_method ?? 'cash';

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
              <p className="text-xs font-bold text-[#057a55] uppercase tracking-wide">Payment Made</p>
              <p className="text-[11px] text-gray-400">{dateInfo.bs} · {dateInfo.ad}</p>
            </div>
            <p className="text-base font-bold text-[#057a55]">{formatCurrency(entry.amount)}</p>
          </div>
          <p className="text-xs text-gray-500">
            {METHOD_ICONS[method] ?? '💵'} {method.charAt(0).toUpperCase() + method.slice(1)}
            {entry.note ? ` · ${entry.note}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UdharoTimeline({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400 text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      {transactions.map(t =>
        t.type === 'purchase'
          ? <PurchaseEntry key={`p-${t.id}`} entry={t} />
          : <PaymentEntry  key={`pay-${t.id}`} entry={t} />
      )}
      <div className="text-center py-4">
        <p className="text-xs text-gray-300">— End of timeline —</p>
      </div>
    </div>
  );
}
