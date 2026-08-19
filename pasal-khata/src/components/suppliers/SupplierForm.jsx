import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SupplierForm({ supplier = null, onSave, onClose, saving = false }) {
  const [form, setForm] = useState({
    name:         supplier?.name         ?? '',
    company_name: supplier?.company_name ?? '',
    phone:        supplier?.phone        ?? '',
    address:      supplier?.address      ?? '',
    email:        supplier?.email        ?? '',
    notes:        supplier?.notes        ?? '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Supplier name is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const field = (key) => ({
    value:    form[key],
    onChange: (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); },
  });

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl mb-16 flex flex-col max-h-[92vh]">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
              <input {...field('name')} placeholder="e.g. Hari Krishna Shrestha" className={inputClass} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input {...field('company_name')} placeholder="e.g. Shrestha Traders" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...field('phone')} type="tel" placeholder="98XXXXXXXX" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input {...field('address')} placeholder="e.g. Asan, Kathmandu" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...field('email')} type="email" placeholder="supplier@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea {...field('notes')} rows={2} placeholder="Any notes about this supplier..." className={inputClass} />
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                : supplier ? 'Update Supplier' : 'Add Supplier'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
