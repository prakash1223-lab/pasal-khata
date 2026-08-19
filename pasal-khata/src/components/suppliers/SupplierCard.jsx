import { useNavigate } from 'react-router-dom';
import { PhoneIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';
import { formatCurrency } from '../../utils/currency';
import { formatNepaliDate } from '../../utils/nepaliDate';

export default function SupplierCard({ supplier }) {
  const navigate  = useNavigate();
  const udharo    = parseFloat(supplier.udharo ?? 0);
  const lastDate  = supplier.last_purchase_date ? formatNepaliDate(supplier.last_purchase_date) : null;
  const initials  = supplier.company_name
    ? supplier.company_name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (supplier.name || '?').substring(0, 2).toUpperCase();

  return (
    <button
      onClick={() => navigate(`/suppliers/${supplier.id}`)}
      className="w-full bg-white flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0"
    >
      {/* Company avatar */}
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-amber-700">{initials}</span>
      </div>

      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{supplier.name}</p>
        {supplier.company_name && (
          <p className="text-xs text-gray-500 truncate">{supplier.company_name}</p>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <PhoneIcon className="w-3 h-3 text-gray-400" />
          <p className="text-xs text-gray-500">{supplier.phone ?? '—'}</p>
        </div>
        {lastDate && <p className="text-[10px] text-gray-400 mt-0.5">{lastDate.bs}</p>}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {udharo > 0 ? (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {formatCurrency(udharo)}
          </span>
        ) : (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
            Clear
          </span>
        )}
        <p className="text-[10px] text-gray-400">{udharo > 0 ? 'उधारो' : 'no उधारो'}</p>
      </div>

      <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </button>
  );
}
