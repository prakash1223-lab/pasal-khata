import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { formatCurrency } from '../../utils/currency';
import { formatNepaliDate } from '../../utils/nepaliDate';
import { useTranslation } from '../../hooks/useTranslation';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function TopBakiList({ customers = [] }) {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  if (customers.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">{t.dashboard.topBaki}</h2>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-sm text-gray-400">No outstanding baki 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{t.dashboard.topBaki}</h2>
        <button onClick={() => navigate('/customers')} className="text-xs text-[#1a56db] font-medium">
          {t.common.viewAll}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {customers.map(customer => {
          const baki         = parseFloat(customer.baki ?? 0);
          const lastPurchase = customer.last_purchase_date ?? customer.lastPurchase;
          const dateInfo     = lastPurchase ? formatNepaliDate(lastPurchase) : null;

          return (
            <button
              key={customer.id}
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <Avatar name={customer.name} size="md" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                {dateInfo && (
                  <p className="text-[11px] text-gray-400 truncate">{dateInfo.bs}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-[#e02424]">{formatCurrency(baki)}</p>
                <p className="text-[10px] text-gray-400">{t.customers.baki}</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
