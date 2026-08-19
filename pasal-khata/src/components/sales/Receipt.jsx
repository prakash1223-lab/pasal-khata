import { formatCurrency } from '../../utils/currency';
import { formatNepaliDate } from '../../utils/nepaliDate';
import { CheckCircleIcon, PrinterIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function Receipt({ sale, onClose }) {
  const { user } = useAuth();
  const { t }    = useTranslation();
  const shopName    = user?.shopName ?? user?.shop?.name ?? 'My Shop';
  const shopAddress = user?.shop?.address ?? '';
  const shopPhone   = user?.shop?.phone ?? user?.phone ?? '';

  const date  = sale.sale_date  ?? sale.date  ?? new Date();
  const total = parseFloat(sale.total_amount ?? sale.total ?? 0);
  const paid  = parseFloat(sale.paid_amount  ?? sale.paid  ?? 0);
  const baki  = parseFloat(sale.baki_amount  ?? sale.baki  ?? 0);
  const items = sale.items ?? [];

  const dateInfo = formatNepaliDate(date);

  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-printable { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          #receipt-printable * { display: revert !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div id="receipt-printable" className="w-full max-w-[380px] bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-[#1a56db] px-6 py-5 text-white text-center">
            <div className="flex justify-center mb-2">
              <CheckCircleIcon className="w-10 h-10 text-white/90" />
            </div>
            <h2 className="text-lg font-bold">{t.sales.saleSaved}</h2>
            <p className="text-blue-200 text-sm">{t.sales.receiptNo}{(sale.id ?? '').toString().slice(-8)}</p>
          </div>

          {/* Shop info */}
          <div className="px-5 pt-4 pb-2 text-center border-b border-dashed border-gray-200">
            <p className="text-sm font-bold text-gray-800">{shopName}</p>
            {shopAddress && <p className="text-xs text-gray-500">{shopAddress}</p>}
            {shopPhone   && <p className="text-xs text-gray-500">📞 {shopPhone}</p>}
          </div>

          {/* Meta */}
          <div className="px-5 py-4 border-b border-dashed border-gray-200">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">{t.customers.name}</span>
              <span className="text-xs font-semibold text-gray-800">
                {sale.customer_name ?? sale.customerName ?? '—'}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">{t.sales.dateBS}</span>
              <span className="text-xs font-medium text-gray-600">{dateInfo.bs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">{t.sales.dateAD}</span>
              <span className="text-xs text-gray-400">{dateInfo.ad}</span>
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="px-5 py-3 border-b border-dashed border-gray-200 max-h-48 overflow-y-auto">
              <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1 uppercase">
                <span>{t.sales.item}</span>
                <span>{t.sales.amount}</span>
              </div>
              {items.map((item, idx) => {
                const name      = item.product_name ?? item.name  ?? 'Item';
                const qty       = item.quantity      ?? item.qty   ?? 1;
                const unitPrice = parseFloat(item.unit_price ?? item.unitPrice ?? 0);
                const itemTotal = parseFloat(item.total_price ?? item.total ?? (qty * unitPrice));
                return (
                  <div key={idx} className="flex justify-between py-1">
                    <span className="text-xs text-gray-600">{name} × {qty}</span>
                    <span className="text-xs font-medium text-gray-800">{formatCurrency(itemTotal)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div className="px-5 py-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t.sales.subtotal}</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t.sales.amountPaidLabel}</span>
              <span className="text-sm font-bold text-green-700">{formatCurrency(paid)}</span>
            </div>
            {baki > 0 ? (
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-sm font-bold text-[#e02424]">{t.sales.bakiRemaining}</span>
                <span className="text-base font-black text-[#e02424]">{formatCurrency(baki)}</span>
              </div>
            ) : (
              <div className="bg-green-50 rounded-xl p-2 text-center border-t border-gray-100 pt-3">
                <span className="text-xs font-semibold text-green-700">✅ {t.sales.fullyPaid}</span>
              </div>
            )}
          </div>

          {/* Thank you */}
          <div className="px-5 py-3 bg-gray-50 text-center border-t border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-700">{shopName}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{t.sales.thankyou}</p>
            <p className="text-[10px] text-gray-300">{t.sales.poweredBy}</p>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-3 flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 active:bg-gray-100"
            >
              <PrinterIcon className="w-4 h-4" /> {t.sales.print}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-[#1a56db] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 active:opacity-90"
            >
              {t.sales.done}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
