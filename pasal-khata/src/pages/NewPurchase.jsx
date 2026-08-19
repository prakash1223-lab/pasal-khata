import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import TopBar from '../components/common/TopBar';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ToastContainer } from '../components/common/Toast';
import { useSuppliers } from '../hooks/useSuppliers';
import { useProducts } from '../hooks/useProducts';
import { usePurchases } from '../hooks/usePurchases';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';

const STEPS = ['Supplier', 'Items', 'Payment'];

const METHODS = [
  { value: 'cash',   label: '💵 Cash'   },
  { value: 'esewa',  label: '🟢 eSewa'  },
  { value: 'khalti', label: '🟣 Khalti' },
  { value: 'bank',   label: '🏦 Bank'   },
  { value: 'cheque', label: '📄 Cheque' },
];

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white';

// ── New-product inline form (extracted so it's stable, not re-mounted) ────────
function NewProductForm({ onAdd, onCancel }) {
  const [prod, setProd] = useState({ productName: '', unit: 'piece', qty: 1, costPrice: '' });
  const [err,  setErr]  = useState('');

  const handleAdd = () => {
    if (!prod.productName.trim()) { setErr('Product name is required'); return; }
    if (!prod.costPrice || parseFloat(prod.costPrice) <= 0) { setErr('Cost price is required'); return; }
    onAdd({
      productName: prod.productName.trim(),
      unit:        prod.unit || 'piece',
      qty:         parseFloat(prod.qty) || 1,
      costPrice:   parseFloat(prod.costPrice),
    });
    setProd({ productName: '', unit: 'piece', qty: 1, costPrice: '' });
    setErr('');
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">New Product</p>
        <button onClick={onCancel} className="p-1 rounded-full hover:bg-amber-100">
          <XMarkIcon className="w-4 h-4 text-amber-600" />
        </button>
      </div>
      <div>
        <input
          value={prod.productName}
          onChange={e => { setProd(f => ({ ...f, productName: e.target.value })); setErr(''); }}
          placeholder="Product name *"
          className={inputCls}
          style={{ fontSize: '16px' }}
        />
        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Qty</label>
          <input
            type="number" min={1}
            value={prod.qty}
            onChange={e => setProd(f => ({ ...f, qty: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            style={{ fontSize: '16px' }}
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Unit</label>
          <input
            value={prod.unit}
            onChange={e => setProd(f => ({ ...f, unit: e.target.value }))}
            placeholder="piece"
            className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            style={{ fontSize: '16px' }}
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Cost ₨ *</label>
          <input
            type="number" min={0}
            value={prod.costPrice}
            onChange={e => { setProd(f => ({ ...f, costPrice: e.target.value })); setErr(''); }}
            placeholder="0"
            className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>
      <button
        onClick={handleAdd}
        className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
      >
        + Add to Cart
      </button>
    </div>
  );
}

// ── Cart row ──────────────────────────────────────────────────────────────────
function CartRow({ item, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
        <p className="text-[10px] text-gray-400">{item.unit}{item.isNew ? ' · new product' : ''}</p>
      </div>
      <input
        type="number" value={item.qty} min={1}
        onChange={e => onUpdate(item.productId, 'qty', parseFloat(e.target.value) || 1)}
        className="w-14 border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
        style={{ fontSize: '16px' }}
      />
      <span className="text-xs text-gray-300">×</span>
      <input
        type="number" value={item.costPrice} min={0}
        onChange={e => onUpdate(item.productId, 'costPrice', parseFloat(e.target.value) || 0)}
        className="w-20 border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
        style={{ fontSize: '16px' }}
      />
      <span className="text-xs text-gray-500 w-16 text-right font-medium flex-shrink-0">
        {formatCurrency(item.qty * item.costPrice)}
      </span>
      <button onClick={() => onRemove(item.productId)} className="p-1 flex-shrink-0">
        <TrashIcon className="w-4 h-4 text-red-400" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function NewPurchase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSupplier = searchParams.get('supplierId');

  const { suppliers, search: supSearch, setSearch: setSupSearch } = useSuppliers();
  const { products,  search: prodSearch, setSearch: setProdSearch } = useProducts();
  const { createPurchase } = usePurchases();
  const { toasts, showError, remove } = useToast();
  const { t } = useTranslation();

  const STEPS = [t.purchases.selectSupplier.split(' ')[0], t.purchases.addItems.split(' ')[0], t.purchases.payment];

  const [step,             setStep]             = useState(preSupplier ? 1 : 0);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [cartItems,        setCartItems]        = useState([]);
  const [invoiceNumber,    setInvoiceNumber]    = useState('');
  const [paidAmount,       setPaidAmount]       = useState('');
  const [paymentMethod,    setPaymentMethod]    = useState('cash');
  const [notes,            setNotes]            = useState('');
  const [saving,           setSaving]           = useState(false);
  const [success,          setSuccess]          = useState(false);
  const [showNewProd,      setShowNewProd]      = useState(false);

  // Pre-select supplier from URL param
  useEffect(() => {
    if (preSupplier && suppliers.length > 0) {
      const found = suppliers.find(s => s.id === preSupplier);
      if (found) { setSelectedSupplier(found); setStep(1); }
    }
  }, [preSupplier, suppliers]);

  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.costPrice, 0);
  const paid      = Math.min(parseFloat(paidAmount) || 0, cartTotal);
  const udharo    = Math.max(0, cartTotal - paid);

  // ── cart helpers ────────────────────────────────────────────────────────────
  const addExistingProduct = (product) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        productId:   product.id,
        productName: product.name,
        unit:        product.unit ?? 'piece',
        qty:         1,
        costPrice:   parseFloat(product.cost_price ?? product.price ?? 0),
        isNew:       false,
      }];
    });
  };

  const addNewProduct = ({ productName, unit, qty, costPrice }) => {
    const tempId = `new-${Date.now()}`;
    setCartItems(prev => [...prev, { productId: tempId, productName, unit, qty, costPrice, isNew: true }]);
    setShowNewProd(false);
  };

  const updateItem = (productId, field, value) => {
    setCartItems(prev => prev.map(i => i.productId === productId ? { ...i, [field]: value } : i));
  };

  const removeItem = (productId) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSave = async () => {
    if (!selectedSupplier) { showError(t.errors.selectSupplier); return; }
    if (cartItems.length === 0) { showError(t.errors.addOneItem); return; }
    setSaving(true);
    try {
      await createPurchase({
        supplierId:    selectedSupplier.id,
        invoiceNumber: invoiceNumber || undefined,
        items:         cartItems.map(i => ({
          productId:   i.isNew ? undefined : i.productId,
          productName: i.productName,
          quantity:    i.qty,
          unit:        i.unit,
          costPrice:   i.costPrice,
        })),
        paidAmount:    paid,
        paymentMethod,
        notes:         notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/purchases'), 1500);
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-lg font-bold text-gray-900">{t.purchases.purchaseSaved}</p>
        <p className="text-sm text-gray-500">{t.purchases.stockUpdatedDesc}</p>
      </div>
    );
  }

  // ── Quick-fill amounts ────────────────────────────────────────────────────
  const quickFills = [cartTotal, Math.floor(cartTotal / 2), 1000, 5000]
    .filter((v, i, a) => a.indexOf(v) === i && v > 0)
    .slice(0, 4);

  // ── Shared cart section (used in both mobile & desktop) ───────────────────
  const CartSection = () => (
    cartItems.length > 0 ? (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cart ({cartItems.length})</p>
        {cartItems.map(item => (
          <CartRow key={item.productId} item={item} onUpdate={updateItem} onRemove={removeItem} />
        ))}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-700">Total Cost</span>
          <span className="text-lg font-black text-gray-900">{formatCurrency(cartTotal)}</span>
        </div>
      </div>
    ) : null
  );

  // ── Payment summary (used in both mobile & desktop right panel) ──────────
  const PaymentPanel = ({ isDesktop = false }) => (
    <div className={isDesktop ? 'space-y-4' : 'space-y-4'}>
      {/* Invoice */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.purchases.invoiceNumber}</label>
        <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
          placeholder="e.g. INV-2025-001" className={inputCls} />
      </div>

      {/* Amount paid */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.purchases.paidAmount}</label>
        <input
          type="number" value={paidAmount}
          onChange={e => setPaidAmount(e.target.value)}
          placeholder="0" max={cartTotal}
          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#1a56db] bg-white"
          style={{ fontSize: '16px' }}
        />
        {quickFills.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {quickFills.map(v => (
              <button key={v} onClick={() => setPaidAmount(String(v))}
                className="bg-blue-50 text-[#1a56db] text-xs font-semibold py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                {formatCurrency(v)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Udharo indicator */}
      {cartTotal > 0 && (
        <div className={`rounded-xl p-3 ${udharo > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
          <div className="flex justify-between items-center">
            <span className={`text-sm font-semibold ${udharo > 0 ? 'text-amber-700' : 'text-[#057a55]'}`}>
              {udharo > 0 ? `⚠️ ${t.suppliers.udharo}` : `✅ ${t.sales.fullyPaid}`}
            </span>
            <span className={`text-lg font-black ${udharo > 0 ? 'text-amber-700' : 'text-[#057a55]'}`}>
              {formatCurrency(udharo)}
            </span>
          </div>
        </div>
      )}

      {/* Payment method */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">{t.payments.method}</label>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(m => (
            <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
              className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                paymentMethod === m.value ? 'bg-[#1a56db] text-white border-[#1a56db]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.payments.note}</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Partial delivery" className={inputCls} />
      </div>

      {isDesktop && (
        <button
          onClick={handleSave}
          disabled={saving || !selectedSupplier || cartItems.length === 0}
          className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
        >
          {saving ? <><LoadingSpinner size="sm" color="white" /> {t.purchases.savingPurchase}</> : `💾 ${t.purchases.savePurchase}`}
        </button>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  MOBILE: 3-step wizard
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <ToastContainer toasts={toasts} onClose={remove} />

      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col">
        <TopBar title={t.purchases.newPurchase} showBack />

        {/* Step indicator */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-[#057a55] text-white' : i === step ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ml-1.5 truncate ${i === step ? 'text-amber-600' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded min-w-[8px] ${i < step ? 'bg-[#057a55]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-3">

          {/* STEP 0 — Supplier */}
          {step === 0 && (
            <>
              <p className="text-sm font-semibold text-gray-700">{t.purchases.selectSupplier}</p>
              <SearchBar value={supSearch} onChange={setSupSearch} placeholder={t.purchases.searchSupplier} />
              {selectedSupplier && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-800">
                      {(selectedSupplier.company_name || selectedSupplier.name).substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-800 truncate">{selectedSupplier.name}</p>
                    {selectedSupplier.company_name && <p className="text-xs text-amber-600">{selectedSupplier.company_name}</p>}
                  </div>
                  <button onClick={() => setSelectedSupplier(null)} className="text-xs text-red-400 font-medium">Change</button>
                </div>
              )}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                {suppliers.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">No suppliers found</p>
                ) : suppliers.map(s => (
                  <button key={s.id} onClick={() => { setSelectedSupplier(s); setSupSearch(s.name); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-amber-50 active:bg-amber-100 ${selectedSupplier?.id === s.id ? 'bg-amber-50' : ''}`}>
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-amber-700">
                        {(s.company_name || s.name).substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                      {s.company_name && <p className="text-xs text-gray-500 truncate">{s.company_name}</p>}
                    </div>
                    {parseFloat(s.udharo ?? 0) > 0 && (
                      <span className="text-xs text-amber-700 font-medium flex-shrink-0">{formatCurrency(s.udharo)} उधारो</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 1 — Items */}
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-gray-700">{t.purchases.addItems}</p>
              <SearchBar value={prodSearch} onChange={setProdSearch} placeholder={t.products.searchPlaceholder} />

              {/* Existing products list */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                {products.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">No products found. Add one below.</p>
                ) : products.map(p => (
                  <button key={p.id} onClick={() => addExistingProduct(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-amber-50 active:bg-amber-100">
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">Cost: {formatCurrency(p.cost_price ?? 0)} · Stock: {p.stock_quantity ?? 0} {p.unit}</p>
                    </div>
                    <PlusIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Add new product toggle */}
              {!showNewProd && (
                <button
                  onClick={() => setShowNewProd(true)}
                  className="w-full border-2 border-dashed border-amber-300 text-amber-600 text-sm font-medium py-3 rounded-xl hover:bg-amber-50 transition-colors"
                >
                  {t.purchases.addProductNotInSystem}
                </button>
              )}
              {showNewProd && (
                <NewProductForm onAdd={addNewProduct} onCancel={() => setShowNewProd(false)} />
              )}

              {/* Cart */}
              <CartSection />
            </>
          )}

          {/* STEP 2 — Payment */}
          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-gray-700">{t.purchases.payment}</p>
              {/* Order summary */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">
                      {(selectedSupplier?.company_name || selectedSupplier?.name || '??').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedSupplier?.name}</p>
                    <p className="text-xs text-gray-400">{cartItems.length} {cartItems.length !== 1 ? t.purchases.items : t.purchases.items}</p>
                  </div>
                </div>
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-xs">
                    <span className="text-gray-600">{item.productName} × {item.qty} {item.unit}</span>
                    <span className="text-gray-700 font-medium">{formatCurrency(item.qty * item.costPrice)}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-700">{t.purchases.totalCost}</span>
                  <span className="text-base font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
              <PaymentPanel />
            </>
          )}
        </div>

        {/* Bottom nav */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm active:bg-gray-50">
              ← {t.common.back}
            </button>
          ) : (
            <button onClick={() => navigate(-1)}
              className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm active:bg-gray-50">
              {t.common.cancel}
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 ? !selectedSupplier : cartItems.length === 0}
              className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-amber-600"
            >
              {step === 0 ? `${t.purchases.addItems} →` : `${t.purchases.payment} →`}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || cartItems.length === 0}
              className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving ? <><LoadingSpinner size="sm" color="white" /> {t.purchases.savingPurchase}</> : `💾 ${t.purchases.savePurchase}`}
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          DESKTOP: 3-panel layout
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t.purchases.newPurchase}</h1>
              <p className="text-xs text-gray-500">{t.purchases.newPurchase}</p>
            </div>
          </div>
        </div>

        {/* 3 panels */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>

          {/* LEFT: Supplier (260px) */}
          <div className="w-[260px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.purchases.selectSupplier}</p>
              <SearchBar value={supSearch} onChange={setSupSearch} placeholder={t.purchases.searchSupplier} />
            </div>
            {selectedSupplier && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-amber-800">
                      {(selectedSupplier.company_name || selectedSupplier.name).substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-800 truncate">{selectedSupplier.name}</p>
                    {selectedSupplier.company_name && <p className="text-[10px] text-amber-600">{selectedSupplier.company_name}</p>}
                  </div>
                  <button onClick={() => setSelectedSupplier(null)}>
                    <XMarkIcon className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {suppliers.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">No suppliers found</p>
              ) : suppliers.map(s => (
                <button key={s.id} onClick={() => setSelectedSupplier(s)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-amber-50 transition-colors ${selectedSupplier?.id === s.id ? 'bg-amber-50' : ''}`}>
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-amber-700">
                      {(s.company_name || s.name).substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    {s.company_name && <p className="text-xs text-gray-500 truncate">{s.company_name}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: Products + "Add not in system" + Cart */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            <div className="px-5 py-3 bg-white border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.purchases.addItems}</p>
              <SearchBar value={prodSearch} onChange={setProdSearch} placeholder={t.products.searchPlaceholder} />
            </div>
            <div className="flex-1 overflow-y-auto">

              {/* Existing products */}
              <div className="bg-white border-b border-gray-100">
                {products.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-gray-400">No products yet. Add one below.</p>
                ) : products.map(p => (
                  <button key={p.id} onClick={() => addExistingProduct(p)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 last:border-0 hover:bg-amber-50 transition-colors">
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">Cost: {formatCurrency(p.cost_price ?? 0)} · Stock: {p.stock_quantity ?? 0} {p.unit}</p>
                    </div>
                    <PlusIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* ── Add product not in system — DESKTOP ── */}
              <div className="px-5 py-4 space-y-3">
                {!showNewProd ? (
                  <button
                    onClick={() => setShowNewProd(true)}
                    className="w-full border-2 border-dashed border-amber-300 text-amber-600 text-sm font-medium py-3 rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    {t.purchases.addProductNotInSystem}
                  </button>
                ) : (
                  <NewProductForm onAdd={addNewProduct} onCancel={() => setShowNewProd(false)} />
                )}

                {/* Cart */}
                {cartItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.purchases.cart} ({cartItems.length})</p>
                    {cartItems.map(item => (
                      <CartRow key={item.productId} item={item} onUpdate={updateItem} onRemove={removeItem} />
                    ))}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-700">{t.purchases.subtotal}</span>
                      <span className="text-lg font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Payment panel (300px) */}
          <div className="w-[300px] flex-shrink-0 bg-white border-l border-gray-100 flex flex-col">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.purchases.payment}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selectedSupplier ? (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-sm font-bold text-amber-800 truncate">{selectedSupplier.name}</p>
                  <p className="text-xs text-amber-600">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">{t.purchases.selectSupplier}</p>
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="space-y-1">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-600 truncate">{item.productName} × {item.qty}</span>
                      <span className="text-gray-700 font-medium flex-shrink-0 ml-2">{formatCurrency(item.qty * item.costPrice)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
                    <span>{t.purchases.totalCost}</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              )}

              <PaymentPanel isDesktop />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
