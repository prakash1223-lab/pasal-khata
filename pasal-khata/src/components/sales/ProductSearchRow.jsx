import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';
import Badge from '../common/Badge';

export default function ProductSearchRow({ product, onAdd }) {
  const stock      = parseInt(product.stock_quantity ?? product.stock ?? 0);
  const isOutOfStock = stock <= 0;
  const isLowStock   = !isOutOfStock && stock <= 10;

  const handleClick = () => {
    if (isOutOfStock) return; // prevent adding out-of-stock items
    onAdd(product);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      className={`w-full flex items-center gap-3 px-4 py-3 bg-white transition-colors border-b border-gray-50 last:border-0
        ${isOutOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-blue-50 active:bg-blue-100'}`}
    >
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{product.name}</p>
          {isOutOfStock
            ? <Badge label="Out of stock" color="red"   size="xs" />
            : isLowStock
            ? <Badge label="Low Stock"    color="amber" size="xs" />
            : null}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {product.category && <Badge label={product.category} color="blue" size="xs" />}
          <p className="text-[11px] text-gray-400">
            Stock: {stock} {product.unit ?? ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="text-sm font-bold text-gray-800">
          {formatCurrency(product.price)}{product.unit ? `/${product.unit}` : ''}
        </p>
        <PlusCircleIcon className={`w-6 h-6 ${isOutOfStock ? 'text-gray-300' : 'text-[#1a56db]'}`} />
      </div>
    </button>
  );
}
