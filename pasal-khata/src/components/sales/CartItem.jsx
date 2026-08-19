import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';

export default function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
        <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onQtyChange(item.productId, item.qty - 1)}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
        >
          <MinusIcon className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-gray-800">{item.qty}</span>
        <button
          onClick={() => onQtyChange(item.productId, item.qty + 1)}
          className="w-7 h-7 rounded-full bg-[#1a56db] flex items-center justify-center active:opacity-80"
        >
          <PlusIcon className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
      <div className="text-right min-w-[60px]">
        <p className="text-sm font-bold text-gray-800">{formatCurrency(item.qty * item.price)}</p>
      </div>
      <button
        onClick={() => onRemove(item.productId)}
        className="p-1.5 rounded-full hover:bg-red-50 active:bg-red-100"
      >
        <TrashIcon className="w-4 h-4 text-red-400" />
      </button>
    </div>
  );
}
