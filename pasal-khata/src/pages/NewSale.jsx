import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import TopBar from '../components/common/TopBar';
import SearchBar from '../components/common/SearchBar';
import Avatar from '../components/common/Avatar';
import CartItem from '../components/sales/CartItem';
import ProductSearchRow from '../components/sales/ProductSearchRow';
import Receipt from '../components/sales/Receipt';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ToastContainer } from '../components/common/Toast';
import { useCustomers } from '../hooks/useCustomers';
import { useProducts } from '../hooks/useProducts';
import { useToast }        from '../hooks/useToast';
import { offlineDB }       from '../db/offlineDataLayer';
import { useAuth }         from '../context/AuthContext';
import { useNetwork }      from '../context/NetworkContext';
import { useTranslation }  from '../hooks/useTranslation';
import { formatCurrency } from '../utils/currency';

export default function NewSale() {
  const navigate = useNavigate();
  const { customers, search: custSearch, setSearch: setCustSearch } = useCustomers();
  const { products, search: prodSearch, setSearch: setProdSearch }  = useProducts();
  const { toasts, showError, showSuccess, remove } = useToast();
  const { user }               = useAuth();
  const { isOnline, updatePendingCount } = useNetwork();
  const { t, lang }            = useTranslation();

  const STEPS = [t.sales.step1, t.sales.step2, t.sales.step3];

  const [step,             setStep]             = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart,             setCart]             = useState([]);
  const [amountPaid,       setAmountPaid]       = useState('');
  const [notes,            setNotes]            = useState('');
  const [savedSale,        setSavedSale]        = useState(null);
  const [saving,           setSaving]           = useState(false);

  const cartTotal  = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const paidAmount = Math.min(parseFloat(amountPaid) || 0, cartTotal);
  const baki       = Math.max(0, cartTotal - paidAmount);

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: parseFloat(product.price), qty: 1 }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.productId !== productId));
    else setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const handleSaveSale = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    setSaving(true);
    try {
      const clampedPaid = Math.min(Math.max(parseFloat(amountPaid) || 0, 0), cartTotal);
      const saleData = {
        customerId:    selectedCustomer.id,
        items:         cart.map(i => ({
          productId:   i.productId,
          productName: i.name,
          quantity:    i.qty,
          unitPrice:   i.price,
        })),
        paidAmount:    clampedPaid,
        notes:         notes || undefined,
        paymentMethod: 'cash',
      };

      const sale = await offlineDB.sales.create(saleData, user.shopId, user.id);
      await updatePendingCount();

      setSavedSale({
        id:           sale.id,
        customerName: selectedCustomer.name,
        items:        cart.map(i => ({ name: i.name, qty: i.qty, unitPrice: i.price, total: i.qty * i.price })),
        total_amount: cartTotal,
        paid_amount:  clampedPaid,
        baki_amount:  Math.max(0, cartTotal - clampedPaid),
        date:         sale.sale_date || new Date().toISOString(),
        _isOffline:   !isOnline,
      });

      if (!isOnline) {
        showSuccess(lang === 'np'
          ? 'बिक्री स्थानीय रूपमा सुरक्षित। इन्टरनेट आएपछि sync हुनेछ।'
          : 'Sale saved offline. Will sync when online.');
      }
    } catch (err) {
      showError(err.message || t.errors?.serverError || 'Failed to save sale');
    } finally {
      setSaving(false);
    }
  };

  if (savedSale) {
    return <Receipt sale={savedSale} onClose={() => navigate('/sales')} />;
  }

  // ── Quick-fill buttons for payment ──────────────────────────────────────────
  const quickFills = [cartTotal, Math.floor(cartTotal / 2), 500, 1000]
    .filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
    .slice(0, 4);

  return (
    <>
      <ToastContainer toasts={toasts} onClose={remove} />

      {/* ═══════════════════════════════════════════════════
          MOBILE: step-by-step wizard (unchanged)
      ═══════════════════════════════════════════════════ */}
      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col">
        <TopBar title={t.sales.newSale} showBack />

        {/* Step indicator */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-[#057a55] text-white' : i === step ? 'bg-[#1a56db] text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ml-1.5 truncate ${i === step ? 'text-[#1a56db]' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded min-w-[8px] ${i < step ? 'bg-[#057a55]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* STEP 0: Customer */}
          {step === 0 && (
            <div className="px-4 pt-4 pb-32 space-y-3">
              <p className="text-sm font-semibold text-gray-700">{t.sales.selectCustomer}</p>
              <SearchBar value={custSearch} onChange={setCustSearch} placeholder={t.sales.searchCustomer} />
              {selectedCustomer && (
                <div className="bg-blue-50 border-2 border-[#1a56db] rounded-2xl p-3 flex items-center gap-3">
                  <Avatar name={selectedCustomer.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1a56db] truncate">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-xs text-red-400 font-medium flex-shrink-0">Change</button>
                </div>
              )}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                {customers.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustSearch(c.name); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 active:bg-blue-50 ${selectedCustomer?.id === c.id ? 'bg-blue-50' : ''}`}>
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </div>
                    {parseFloat(c.baki ?? 0) > 0 && (
                      <span className="text-xs text-[#e02424] font-medium flex-shrink-0">{formatCurrency(c.baki)} baki</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Items */}
          {step === 1 && (
            <div className="px-4 pt-4 pb-32 space-y-3">
              <p className="text-sm font-semibold text-gray-700">{t.sales.addItems}</p>
              <SearchBar value={prodSearch} onChange={setProdSearch} placeholder={t.sales.searchProduct} />
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                {products.map(p => <ProductSearchRow key={p.id} product={p} onAdd={addToCart} />)}
              </div>
              {cart.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cart</p>
                  {cart.map(item => <CartItem key={item.productId} item={item} onQtyChange={updateQty} onRemove={removeFromCart} />)}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="text-lg font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 2 && (
            <div className="px-4 pt-4 pb-32 space-y-4">
              <p className="text-sm font-semibold text-gray-700">{t.sales.step3}</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                  <Avatar name={selectedCustomer.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-xs">
                    <span className="text-gray-600">{item.name} × {item.qty}</span>
                    <span className="text-gray-700 font-medium">{formatCurrency(item.qty * item.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-700">Order Total</span>
                  <span className="text-base font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.sales.amountPaid}</label>
                  <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                    placeholder="0" max={cartTotal}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quickFills.map(v => (
                    <button key={v} onClick={() => setAmountPaid(String(v))}
                      className="flex-1 bg-blue-50 text-[#1a56db] text-xs font-semibold py-2 rounded-lg border border-blue-100 active:bg-blue-100">
                      {formatCurrency(v)}
                    </button>
                  ))}
                </div>
                <div className={`rounded-xl p-3 ${baki > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${baki > 0 ? 'text-[#e02424]' : 'text-[#057a55]'}`}>
                      {baki > 0 ? `⚠️ ${t.customers.baki}` : `✅ ${t.sales.fullyPaid}`}
                    </span>
                    <span className={`text-lg font-black ${baki > 0 ? 'text-[#e02424]' : 'text-[#057a55]'}`}>
                      {formatCurrency(baki)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.sales.notes}</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder={t.sales.notesPlaceholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom actions */}
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
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 0 ? !selectedCustomer : cart.length === 0}
              className="flex-1 bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40">
              {step === 0 ? `${t.sales.addItems} →` : `${t.sales.step3} →`}
            </button>
          ) : (
            <button onClick={handleSaveSale} disabled={saving}
              className="flex-1 bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2">
              {saving ? <><LoadingSpinner size="sm" color="white" /> {t.sales.saving}</> : `💾 ${t.sales.saveSale}`}
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP: 3-panel layout
      ═══════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Desktop header */}
        <div className="flex items-center justify-between px-7 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t.sales.newSale}</h1>
              <p className="text-xs text-gray-500">{t.sales.newSale}</p>
            </div>
          </div>
        </div>

        {/* 3-panel grid */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>

          {/* LEFT: Customer selection (280px) */}
          <div className="w-[280px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.sales.step1}</p>
              <SearchBar value={custSearch} onChange={setCustSearch} placeholder={t.sales.searchCustomer} />
            </div>
            {selectedCustomer && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <Avatar name={selectedCustomer.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1a56db] truncate">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)}>
                    <XMarkIcon className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {customers.map(c => (
                <button key={c.id} onClick={() => setSelectedCustomer(c)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50' : ''}`}>
                  <Avatar name={c.name} size="sm" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </div>
                  {parseFloat(c.baki ?? 0) > 0 && (
                    <span className="text-[10px] text-[#e02424] font-medium flex-shrink-0">{formatCurrency(c.baki)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: Products + Cart (flex 1) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            <div className="px-5 py-3 bg-white border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.sales.step2}</p>
              <SearchBar value={prodSearch} onChange={setProdSearch} placeholder={t.sales.searchProduct} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Products list */}
              <div className="bg-white border-b border-gray-100">
                {products.map(p => <ProductSearchRow key={p.id} product={p} onAdd={addToCart} />)}
              </div>
              {/* Cart */}
              {cart.length > 0 && (
                <div className="m-4 bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cart</p>
                  {cart.map(item => (
                    <CartItem key={item.productId} item={item} onQtyChange={updateQty} onRemove={removeFromCart} />
                  ))}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-700">Subtotal</span>
                    <span className="text-lg font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Payment summary (300px) */}
          <div className="w-[300px] flex-shrink-0 bg-white border-l border-gray-100 flex flex-col">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.sales.step3}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Selected customer summary */}
              {selectedCustomer ? (
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={selectedCustomer.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1a56db] truncate">{selectedCustomer.name}</p>
                      <p className="text-xs text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">{t.sales.selectCustomer}</p>
                </div>
              )}

              {/* Items summary */}
              {cart.length > 0 && (
                <div className="space-y-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-600 truncate">{item.name} × {item.qty}</span>
                      <span className="text-gray-700 font-medium flex-shrink-0 ml-2">{formatCurrency(item.qty * item.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
                    <span className="text-gray-700">Total</span>
                    <span className="text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              )}

              {/* Amount paid input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.sales.amountPaid}</label>
                <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                  placeholder="0" max={cartTotal}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {quickFills.slice(0, 4).map(v => (
                    <button key={v} onClick={() => setAmountPaid(String(v))}
                      className="bg-blue-50 text-[#1a56db] text-xs font-semibold py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                      {formatCurrency(v)}
                    </button>
                  ))}
                </div>
              </div>

              {cart.length > 0 && (
                <div className={`rounded-xl p-3 ${baki > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${baki > 0 ? 'text-[#e02424]' : 'text-[#057a55]'}`}>
                      {baki > 0 ? `⚠️ ${t.customers.baki}` : `✅ ${t.sales.fullyPaid}`}
                    </span>
                    <span className={`text-lg font-black ${baki > 0 ? 'text-[#e02424]' : 'text-[#057a55]'}`}>
                      {formatCurrency(baki)}
                    </span>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.sales.notes}</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={t.sales.notesPlaceholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              </div>
            </div>

            {/* Save button */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleSaveSale}
                disabled={saving || !selectedCustomer || cart.length === 0}
                className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                {saving ? <><LoadingSpinner size="sm" color="white" /> {t.sales.saving}</> : `💾 ${t.sales.saveSale}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
