import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../hooks/useTranslation';
import Avatar from '../common/Avatar';

export default function PaymentForm({ customer, onSave, onClose, saving = false }) {
  const [amount, setAmount] = useState('');
  const [note,   setNote]   = useState('');
  const [method, setMethod] = useState('cash');
  const [error,  setError]  = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError(t.errors.validAmount); return; }
    const baki = parseFloat(customer.baki ?? 0);
    if (amt > baki && baki > 0) { setError(`${t.errors.amountInvalid} (${formatCurrency(baki)})`); return; }
    onSave({ customerId: customer.id, customerName: customer.name, amount: amt, paymentMethod: method, note });
  };

  const methods = [
    { value: 'cash',    label: `💵 ${t.payments.methods.cash}`    },
    { value: 'esewa',   label: `🟢 ${t.payments.methods.esewa}`   },
    { value: 'banking', label: `🏦 ${t.payments.methods.bank}`    },
    { value: 'khalti',  label: `🟣 ${t.payments.methods.khalti}`  },
  ];

  const baki = parseFloat(customer.baki ?? 0);
  const quickAmounts = [500, 1000, 2000, baki]
    .filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
    .slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl mb-16 flex flex-col max-h-[90vh]">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{t.payments.receivePayment}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-5">
            <Avatar name={customer.name} size="md" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
              <p className="text-xs text-[#e02424] font-medium">{t.customers.baki}: {formatCurrency(baki)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.payments.amount}</label>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <div className="flex gap-2">
              {quickAmounts.map(v => (
                <button key={v} type="button"
                  onClick={() => { setAmount(String(v)); setError(''); }}
                  className="flex-1 bg-blue-50 text-[#1a56db] text-xs font-semibold py-2 rounded-lg border border-blue-100 active:bg-blue-100">
                  {formatCurrency(v)}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.payments.method}</label>
              <div className="grid grid-cols-2 gap-2">
                {methods.map(m => (
                  <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      method === m.value ? 'bg-[#1a56db] text-white border-[#1a56db]' : 'bg-white text-gray-700 border-gray-200'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.payments.note}</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder={t.sales.notesPlaceholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-[#057a55] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.common.loading}</>
                : t.payments.savePayment}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
