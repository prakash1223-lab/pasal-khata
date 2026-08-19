import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

export default function CustomerForm({ customer = null, onSave, onClose, saving = false }) {
  const isEdit = !!customer;
  const { t }  = useTranslation();

  const [form,   setForm]   = useState({
    name:    customer?.name    ?? '',
    phone:   customer?.phone   ?? '',
    address: customer?.address ?? '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t.errors.nameRequired;
    if (!form.phone.trim()) {
      e.phone = t.errors.phoneRequired;
    } else if (!/^9[6-9]\d{8}$/.test(form.phone)) {
      e.phone = t.errors.invalidNepalPhone;
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() || undefined });
  };

  const field = (key) => ({
    value:    form[key],
    onChange: e => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      setErrors(er => ({ ...er, [key]: '' }));
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl mb-16 flex flex-col max-h-[85vh]">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? t.customers.editCustomer : t.customers.addCustomer}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.name} *</label>
              <input
                {...field('name')}
                placeholder={t.customers.namePlaceholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.phone} *</label>
              <input
                {...field('phone')}
                placeholder={t.customers.phonePlaceholder}
                type="tel"
                maxLength={10}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.address}</label>
              <input
                {...field('address')}
                placeholder={t.customers.addressPlaceholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.common.loading}</>
                : isEdit ? t.common.update : t.common.save}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
