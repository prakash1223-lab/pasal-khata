import { PencilIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import Badge from '../common/Badge';
import { CubeIcon } from '@heroicons/react/24/outline';

export default function ProductCard({ product, onEdit }) {
  const stock      = parseInt(product.stock_quantity ?? product.stock ?? 0);
  const isLowStock  = stock <= 10 && stock > 0;
  const isOutOfStock = stock <= 0;

  const costPrice = parseFloat(product.cost_price ?? 0);
  const sellPrice = parseFloat(product.price ?? 0);
  const margin    = costPrice > 0 ? Math.round(((sellPrice - costPrice) / costPrice) * 100) : null;

  return (
    <div className="bg-white flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <CubeIcon className="w-5 h-5 text-[#1a56db]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{product.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {product.category && <Badge label={product.category} color="blue" size="xs" />}
          {isOutOfStock ? (
            <Badge label="Out of stock" color="red" size="xs" />
          ) : isLowStock ? (
            <Badge label={`Low: ${stock} left`} color="amber" size="xs" />
          ) : (
            <span className="text-[10px] text-gray-400">Stock: {stock} {product.unit ?? ''}</span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-800">{formatCurrency(sellPrice)}</p>
        {costPrice > 0 ? (
          <p className="text-[10px] text-gray-400">Cost: {formatCurrency(costPrice)}</p>
        ) : (
          <p className="text-[10px] text-amber-500">Cost not set</p>
        )}
        {margin !== null && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            margin >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {margin >= 0 ? '+' : ''}{margin}%
          </span>
        )}
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 flex-shrink-0 ml-1"
          aria-label="Edit product"
        >
          <PencilIcon className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  );
}
