import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

const categories = ['Grain', 'Pulse', 'Oil', 'Beverage', 'Sweetener', 'Spice', 'Instant Food', 'Snack', 'Other'];
const units = ['kg', 'ltr', 'packet', 'piece', 'dozen', 'bag'];

export default function ProductForm({ onSave, onClose, saving = false, inline = false, product = null }) {
  const isEdit = !!product;
  const { t }  = useTranslation();

  const [form, setForm] = useState({
    name:              product?.name              ?? '',
    nameNepali:        product?.name_nepali       ?? '',
    category:          product?.category          ?? 'Grain',
    price:             product?.price             ?? '',
    costPrice:         product?.cost_price        ?? '',
    unit:              product?.unit              ?? 'kg',
    stock:             product?.stock_quantity    ?? '',
    lowStockThreshold: product?.low_stock_threshold ?? '10',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name  = t.errors.productNameRequired;
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0)
      e.price = t.errors.priceInvalid;
    if (form.stock === '' || isNaN(parseInt(form.stock)) || parseInt(form.stock) < 0)
      e.stock = t.errors.stockInvalid;
    if (form.costPrice !== '' && (!isNaN(parseFloat(form.costPrice)) && parseFloat(form.costPrice) <= 0))
      e.costPrice = t.errors.priceInvalid;
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      name:          form.name.trim(),
      category:      form.category,
      price:         parseFloat(form.price),
      costPrice:     form.costPrice !== '' ? parseFloat(form.costPrice) : undefined,
      stock:         parseInt(form.stock),
      stockQuantity: parseInt(form.stock),
      unit:          form.unit,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
    });
  };

  const field = (key) => ({
    value: form[key],
    onChange: e => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      setErrors(er => ({ ...er, [key]: '' }));
    },
  });

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]';

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.name} *</label>
        <input {...field('name')} placeholder={t.products.namePlaceholder} className={inputCls} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.category}</label>
          <select {...field('category')} className={`${inputCls} bg-white`}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.unit}</label>
          <select {...field('unit')} className={`${inputCls} bg-white`}>
            {units.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.price} *</label>
          <input {...field('price')} type="number" min="0" step="0.01" placeholder="0" className={inputCls} />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.costPrice}</label>
          <input {...field('costPrice')} type="number" min="0" step="0.01" placeholder={t.common.optional} className={inputCls} />
          {errors.costPrice && <p className="text-xs text-red-500 mt-1">{errors.costPrice}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.stock} *</label>
          <input {...field('stock')} type="number" min="0" placeholder="0" className={inputCls} />
          {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
          <input {...field('lowStockThreshold')} type="number" min="0" placeholder="10" className={inputCls} />
        </div>
      </div>

      {/* Margin preview */}
      {form.costPrice && form.price && !isNaN(parseFloat(form.costPrice)) && !isNaN(parseFloat(form.price)) && (
        <div className={`rounded-xl p-3 text-center ${
          parseFloat(form.price) >= parseFloat(form.costPrice) ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <p className={`text-sm font-semibold ${
            parseFloat(form.price) >= parseFloat(form.costPrice) ? 'text-green-700' : 'text-red-600'
          }`}>
            {t.products.margin}: {parseFloat(form.costPrice) > 0
              ? `${Math.round(((parseFloat(form.price) - parseFloat(form.costPrice)) / parseFloat(form.costPrice)) * 100)}%`
              : '—'}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {saving
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.common.loading}</>
          : isEdit ? t.products.editProduct : t.products.addProduct}
      </button>
    </form>
  );

  if (inline) return formContent;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl mb-16 flex flex-col max-h-[92vh]">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? t.products.editProduct : t.products.addNewProduct}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          {formContent}
        </div>
      </div>
    </div>
  );
}
