import { useState } from 'react';
import { PlusIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import ProductCard from '../components/products/ProductCard';
import ProductForm from '../components/products/ProductForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import { ToastContainer } from '../components/common/Toast';
import { useProducts } from '../hooks/useProducts';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';

export default function Products() {
  const { products, loading, error, search, setSearch, createProduct, updateProduct } = useProducts();
  const [showForm,      setShowForm]      = useState(null);
  const [showSlideOver, setShowSlideOver] = useState(null);
  const [saving,        setSaving]        = useState(false);
  const { toasts, showSuccess, showError, remove } = useToast();
  const { t } = useTranslation();

  const isEditing      = showForm && showForm !== 'add';
  const isEditingSlide = showSlideOver && showSlideOver !== 'add';

  const lowStock   = products.filter(p => {
    const stock = parseInt(p.stock_quantity ?? 0);
    return stock <= 10 && stock > 0;
  });
  const outOfStock = products.filter(p => parseInt(p.stock_quantity ?? 0) <= 0);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (isEditing || isEditingSlide) {
        const editingProduct = isEditing || isEditingSlide;
        await updateProduct(editingProduct.id, {
          name:          data.name,
          category:      data.category,
          price:         data.price,
          costPrice:     data.costPrice,
          stockQuantity: data.stockQuantity,
          unit:          data.unit,
        });
        showSuccess(t.toast.productUpdated);
      } else {
        await createProduct({
          name:          data.name,
          category:      data.category,
          price:         data.price,
          costPrice:     data.costPrice,
          stockQuantity: data.stockQuantity,
          unit:          data.unit,
        });
        showSuccess(t.toast.productAdded);
      }
      setShowForm(null);
      setShowSlideOver(null);
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 md:pb-0">
      <ToastContainer toasts={toasts} onClose={remove} />

      {/* ── MOBILE TopBar ── */}
      <div className="md:hidden">
        <TopBar title={t.products.title} subtitle={`${products.length} ${t.purchases.items}`} />
      </div>

      {/* ── MOBILE layout ── */}
      <div className="md:hidden">
        <div className="px-4 pt-3 pb-2">
          <SearchBar value={search} onChange={setSearch} placeholder={t.products.searchPlaceholder} />
        </div>
        {outOfStock.length > 0 && (
          <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <span>🚨</span>
            <p className="text-sm text-red-700"><span className="font-bold">{outOfStock.length}</span> {t.products.outOfStockCount}</p>
          </div>
        )}
        {lowStock.length > 0 && (
          <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
            <span>⚠️</span>
            <p className="text-sm text-amber-700"><span className="font-bold">{lowStock.length}</span> {t.products.lowStockCount}</p>
          </div>
        )}
        {error && (
          <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <div className="mx-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading && products.length === 0 ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : products.length === 0 ? (
            <EmptyState icon="📦" title={t.products.noProducts} subtitle={t.products.noProductsDesc}
              actionLabel={t.products.addProduct} onAction={() => setShowForm('add')} />
          ) : (
            products.map(p => (
              <ProductCard key={p.id} product={p} onEdit={() => setShowForm(p)} />
            ))
          )}
        </div>
        <button
          onClick={() => setShowForm('add')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-[#1a56db] rounded-full shadow-lg shadow-blue-300 flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <PlusIcon className="w-7 h-7 text-white" />
        </button>
        {showForm && (
          <ProductForm
            product={showForm !== 'add' ? showForm : null}
            onSave={handleSave}
            onClose={() => setShowForm(null)}
            saving={saving}
          />
        )}
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:flex desktop-page gap-6">
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="desktop-toolbar">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t.products.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{products.length} {t.products.itemsInInventory}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-64">
                <SearchBar value={search} onChange={setSearch} placeholder={t.products.searchPlaceholder} />
              </div>
              <button
                onClick={() => setShowSlideOver('add')}
                className="flex items-center gap-2 bg-[#1a56db] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <PlusIcon className="w-4 h-4" />
                {t.products.addProduct}
              </button>
            </div>
          </div>

          {/* Alerts */}
          {outOfStock.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <span>🚨</span>
              <p className="text-sm text-red-700"><span className="font-bold">{outOfStock.length}</span> {t.products.outOfStockCount}</p>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
              <span>⚠️</span>
              <p className="text-sm text-amber-700"><span className="font-bold">{lowStock.length}</span> {t.products.lowStockCount}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Table */}
          <div className="desktop-card overflow-hidden">
            {loading && products.length === 0 ? (
              <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
            ) : products.length === 0 ? (
              <EmptyState icon="📦" title={t.products.noProducts} subtitle={t.products.noProductsDesc}
                actionLabel={t.products.addProduct} onAction={() => setShowSlideOver('add')} />
            ) : (
              <table className="resp-table">
                <thead>
                  <tr>
                    <th>{t.products.name}</th>
                    <th>{t.products.category}</th>
                    <th>{t.products.costPriceLabel}</th>
                    <th>{t.products.sellPrice}</th>
                    <th>{t.products.margin}</th>
                    <th>{t.products.stockQty}</th>
                    <th>{t.products.unit}</th>
                    <th>{t.purchases.status}</th>
                    <th>{t.products.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const stock     = parseInt(p.stock_quantity ?? 0);
                    const isOut     = stock <= 0;
                    const isLow     = !isOut && stock <= 10;
                    const costPrice = parseFloat(p.cost_price ?? 0);
                    const sellPrice = parseFloat(p.price ?? 0);
                    const margin    = costPrice > 0
                      ? Math.round(((sellPrice - costPrice) / costPrice) * 100)
                      : null;

                    return (
                      <tr key={p.id}>
                        <td>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                        </td>
                        <td><Badge label={p.category ?? '—'} color="blue" size="xs" /></td>
                        <td>
                          {costPrice > 0
                            ? <span className="text-gray-500 text-sm">{formatCurrency(costPrice)}</span>
                            : <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">{t.products.notSet}</span>
                          }
                        </td>
                        <td className="font-semibold">{formatCurrency(sellPrice)}</td>
                        <td>
                          {margin !== null
                            ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${margin >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {margin >= 0 ? '+' : ''}{margin}%
                              </span>
                            : <span className="text-gray-300 text-xs">—</span>
                          }
                        </td>
                        <td className={isOut ? 'text-[#e02424] font-bold' : isLow ? 'text-amber-600 font-semibold' : 'text-gray-700'}>
                          {stock}
                        </td>
                        <td className="text-gray-500">{p.unit ?? '—'}</td>
                        <td>
                          {isOut  ? <Badge label={t.products.status.outOfStock} color="red"   size="xs" />
                          : isLow ? <Badge label={t.products.status.lowStock}    color="amber" size="xs" />
                          :         <Badge label={t.products.status.inStock}     color="green" size="xs" />}
                        </td>
                        <td>
                          <button
                            onClick={() => setShowSlideOver(p)}
                            className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                          >
                            <PencilIcon className="w-3.5 h-3.5" /> {t.common.edit}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Slide-over panel */}
        {showSlideOver && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowSlideOver(null)} />
            <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {showSlideOver !== 'add' ? t.products.editProduct : t.products.addProduct}
                </h2>
                <button onClick={() => setShowSlideOver(null)} className="p-2 rounded-xl hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 px-6 py-5">
                <ProductForm
                  product={showSlideOver !== 'add' ? showSlideOver : null}
                  onSave={handleSave}
                  onClose={() => setShowSlideOver(null)}
                  saving={saving}
                  inline
                />
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
