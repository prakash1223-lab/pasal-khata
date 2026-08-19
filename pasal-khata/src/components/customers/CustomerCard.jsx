import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { formatCurrency } from '../../utils/currency';
import { formatNepaliDate } from '../../utils/nepaliDate';
import { PhoneIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

export default function CustomerCard({ customer }) {
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const lastDate = customer.lastPurchase ? formatNepaliDate(customer.lastPurchase) : null;

  return (
    <button
      onClick={() => navigate(`/customers/${customer.id}`)}
      className="w-full bg-white flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0"
    >
      <Avatar name={customer.name} size="md" />
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <PhoneIcon className="w-3 h-3 text-gray-400" />
          <p className="text-xs text-gray-500">{customer.phone}</p>
        </div>
        {lastDate && (
          <p className="text-[10px] text-gray-400 mt-0.5">{lastDate.bs}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        {customer.baki > 0 ? (
          <span className="bg-red-100 text-[#e02424] text-xs font-bold px-2.5 py-1 rounded-full">
            {formatCurrency(customer.baki)}
          </span>
        ) : (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {t.customers.clear}
          </span>
        )}
        <p className="text-[10px] text-gray-400">{customer.baki > 0 ? t.customers.baki : t.customers.noBaki}</p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </button>
  );
}
