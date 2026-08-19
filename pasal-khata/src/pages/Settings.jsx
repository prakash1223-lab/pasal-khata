import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingStorefrontIcon, UserCircleIcon, UsersIcon,
  ArrowRightOnRectangleIcon, ChevronRightIcon, LockClosedIcon, EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline';
import TopBar from '../components/common/TopBar';
import BottomNav from '../components/common/BottomNav';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ToastContainer } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { exportService } from '../services/exportService';
import { useTranslation } from '../hooks/useTranslation';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { toasts, showSuccess, showError, remove } = useToast();
  const { t, lang, switchLang } = useTranslation();

  // Shop info
  const [shopName,    setShopName]    = useState(user?.shopName ?? user?.shop?.name ?? 'My Shop');
  const [shopAddress, setShopAddress] = useState(user?.shop?.address ?? '');
  const [shopPhone,   setShopPhone]   = useState(user?.shop?.phone ?? user?.phone ?? '');
  const [editingShop, setEditingShop] = useState(false);
  const [savingShop,  setSavingShop]  = useState(false);

  // Change password
  const [showPwForm,    setShowPwForm]    = useState(false);
  const [currentPw,     setCurrentPw]     = useState('');
  const [newPw,         setNewPw]         = useState('');
  const [confirmPw,     setConfirmPw]     = useState('');
  const [pwError,       setPwError]       = useState('');
  const [savingPw,      setSavingPw]      = useState(false);
  const [showCurrent,   setShowCurrent]   = useState(false);
  const [showNew,       setShowNew]       = useState(false);

  // Staff
  const [staff,        setStaff]        = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Export / Backup
  const [exportingExcel,  setExportingExcel]  = useState(false);
  const [exportingJson,   setExportingJson]   = useState(false);
  const [backupStatus,    setBackupStatus]    = useState(null);
  const [triggeringBackup, setTriggeringBackup] = useState(false);

  useEffect(() => {
    authService.getStaff()
      .then(res => setStaff(res.data ?? []))
      .catch(() => setStaff([]))
      .finally(() => setLoadingStaff(false));

    // Load last backup status
    exportService.getBackupStatus()
      .then(data => setBackupStatus(data))
      .catch(() => setBackupStatus({ exists: false }));
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleExcelExport = async () => {
    setExportingExcel(true);
    try {
      await exportService.excel();
      showSuccess(lang === 'np' ? 'Excel फाइल डाउनलोड भयो' : 'Excel file downloaded');
    } catch (err) {
      showError(lang === 'np' ? 'Export असफल भयो। फेरि प्रयास गर्नुस्।' : 'Export failed. Try again.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleJsonExport = async () => {
    setExportingJson(true);
    try {
      await exportService.json();
      showSuccess(lang === 'np' ? 'JSON ब्याकअप डाउनलोड भयो' : 'JSON backup downloaded');
    } catch (err) {
      showError(lang === 'np' ? 'Export असफल भयो।' : 'Export failed. Try again.');
    } finally {
      setExportingJson(false);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggeringBackup(true);
    try {
      const info = await exportService.triggerBackup();
      setBackupStatus(info);
      showSuccess(lang === 'np' ? 'ब्याकअप सफलतापूर्वक सिर्जना भयो' : 'Backup created successfully');
    } catch (err) {
      showError(lang === 'np' ? 'ब्याकअप असफल भयो।' : 'Backup failed. Try again.');
    } finally {
      setTriggeringBackup(false);
    }
  };

  // Format backup time for display
  const formatBackupTime = (isoString) => {
    if (!isoString) return null;
    const d     = new Date(isoString);
    const now   = new Date();
    const diffH = Math.floor((now - d) / 3600000);
    if (diffH < 1)  return lang === 'np' ? 'अभी भर्खरै' : 'Just now';
    if (diffH < 24) return lang === 'np' ? `${diffH} घण्टा अघि` : `${diffH}h ago`;
    if (diffH < 48) return lang === 'np' ? 'हिजो' : 'Yesterday';
    const days = Math.floor(diffH / 24);
    return lang === 'np' ? `${days} दिन अघि` : `${days} days ago`;
  };

  const handleSaveShop = async () => {
    if (!shopName.trim()) { showError(t.settings.shopNameEmpty); return; }
    setSavingShop(true);
    try {
      await authService.updateShop(user?.shopId, {
        name:    shopName.trim(),
        address: shopAddress || null,
        phone:   shopPhone   || null,
      });
      setEditingShop(false);
      showSuccess(t.settings.shopUpdated);
    } catch (err) {
      showError(err.message || t.errors.serverError);
    } finally {
      setSavingShop(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (!currentPw)          { setPwError(t.errors.currentPwRequired); return; }
    if (newPw.length < 8)    { setPwError(t.errors.passwordTooShort); return; }
    if (newPw !== confirmPw) { setPwError(t.errors.passwordMismatch); return; }
    setSavingPw(true);
    try {
      await authService.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showSuccess(t.settings.passwordChanged);
      setShowPwForm(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err.message || t.errors.serverError);
    } finally {
      setSavingPw(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]';

  return (
    <div className="pb-24 md:pb-0">
      <ToastContainer toasts={toasts} onClose={remove} />

      <div className="md:hidden">
        <TopBar title={t.settings.title} subtitle={t.settings.title} />
      </div>

      <div className="px-4 md:px-7 pt-4 md:pt-6 space-y-5 md:max-w-2xl">

        <div className="hidden md:block mb-2">
          <h1 className="text-xl font-bold text-gray-900">{t.settings.title}</h1>
          <p className="text-sm text-gray-500">{t.settings.title}</p>
        </div>

        {/* ── Shop Information ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.settings.shopInfo}</h2>
            {!editingShop ? (
              <button onClick={() => setEditingShop(true)} className="text-xs text-[#1a56db] font-semibold">
                {t.common.edit}
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditingShop(false)} className="text-xs text-gray-400 font-semibold">
                  {t.common.cancel}
                </button>
                <button onClick={handleSaveShop} disabled={savingShop}
                  className="text-xs text-[#1a56db] font-semibold disabled:opacity-50 flex items-center gap-1">
                  {savingShop ? <><div className="w-3 h-3 border-2 border-[#1a56db] border-t-transparent rounded-full animate-spin" /> {t.common.loading}</> : t.common.save}
                </button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BuildingStorefrontIcon className="w-5 h-5 text-[#1a56db]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{t.settings.shopName}</p>
                {editingShop ? (
                  <input value={shopName} onChange={e => setShopName(e.target.value)}
                    className="text-sm font-semibold text-gray-900 w-full border-b border-[#1a56db] focus:outline-none pb-0.5 bg-transparent" />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{shopName}</p>
                )}
              </div>
            </div>
            {editingShop && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t.settings.shopAddress}</label>
                  <input value={shopAddress} onChange={e => setShopAddress(e.target.value)}
                    placeholder={t.settings.shopAddress} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t.settings.shopPhone}</label>
                  <input value={shopPhone} onChange={e => setShopPhone(e.target.value)}
                    placeholder={t.settings.shopPhone} className={inputCls} />
                </div>
              </>
            )}
            {!editingShop && (
              <>
                {shopAddress && <p className="text-xs text-gray-500 ml-[52px]">📍 {shopAddress}</p>}
                {shopPhone   && <p className="text-xs text-gray-500 ml-[52px]">📞 {shopPhone}</p>}
              </>
            )}
          </div>
        </div>

        {/* ── Language ── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t.settings.language}</h2>
          <p className="text-xs text-gray-400 mb-2">{t.settings.languageDesc}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { code: 'en', label: t.settings.english, sub: t.settings.allEnglish },
              { code: 'np', label: t.settings.nepali,  sub: t.settings.allNepali  },
            ].map(opt => (
              <button
                key={opt.code}
                onClick={() => switchLang(opt.code)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  lang === opt.code
                    ? 'border-[#1a56db] bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className={`text-base font-bold ${lang === opt.code ? 'text-[#1a56db]' : 'text-gray-800'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Account ── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.settings.account}</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? t.common.owner}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email ?? ''}</p>
              </div>
            </div>

            <button
              onClick={() => setShowPwForm(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <LockClosedIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">{t.settings.changePassword}</p>
                <p className="text-xs text-gray-400">{t.settings.updateLoginPassword}</p>
              </div>
              <ChevronRightIcon className={`w-4 h-4 text-gray-300 transition-transform ${showPwForm ? 'rotate-90' : ''}`} />
            </button>

            {showPwForm && (
              <form onSubmit={handleChangePassword} className="px-4 pb-5 pt-2 space-y-3 border-t border-gray-50">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t.settings.currentPassword}</label>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => { setCurrentPw(e.target.value); setPwError(''); }}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-[30px] text-gray-400">
                    {showCurrent ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t.settings.newPasswordHint}</label>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setPwError(''); }}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-[30px] text-gray-400">
                    {showNew ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t.settings.confirmPassword}</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setPwError(''); }}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
                {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                <button type="submit" disabled={savingPw}
                  className="w-full bg-[#1a56db] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingPw
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.common.loading}</>
                    : t.settings.updatePassword}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Staff Accounts ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.settings.staffAccounts}</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loadingStaff ? (
              <div className="py-6 flex justify-center"><LoadingSpinner size="sm" /></div>
            ) : staff.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-400 text-center">{t.settings.noStaffYet}</div>
            ) : (
              staff.filter(s => s.role !== 'owner').map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{s.role} · {s.phone ?? s.email ?? ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? t.settings.active : t.settings.inactive}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Data & Backup ── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {lang === 'np' ? 'डाटा र ब्याकअप' : 'Data & Backup'}
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden space-y-0">

            {/* Backup status line */}
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              {backupStatus === null ? (
                <span className="text-xs text-gray-400">{lang === 'np' ? 'ब्याकअप स्थिति लोड हुँदैछ...' : 'Loading backup status...'}</span>
              ) : backupStatus.exists ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    {lang === 'np' ? 'अन्तिम ब्याकअप:' : 'Last backup:'}{' '}
                    <span className="font-semibold text-gray-800">{formatBackupTime(backupStatus.time)}</span>
                    {backupStatus.sizeKB ? ` · ${backupStatus.sizeKB} KB` : ''}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500">
                    {lang === 'np' ? 'अहिलेसम्म कुनै ब्याकअप छैन — आजराति मध्यरातमा हुनेछ' : 'No backup yet — first backup tonight at midnight'}
                  </span>
                </>
              )}
            </div>

            {/* Download Excel */}
            <button
              onClick={handleExcelExport}
              disabled={exportingExcel}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
            >
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-base">📊</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {exportingExcel
                    ? (lang === 'np' ? 'डाउनलोड हुँदैछ...' : 'Downloading...')
                    : (lang === 'np' ? 'Excel Export डाउनलोड गर्नुस्' : 'Download Excel Export')}
                </p>
                <p className="text-xs text-gray-400">
                  {lang === 'np' ? 'ग्राहक, बिक्री, भुक्तानी, उत्पादन, आपूर्तिकर्ता' : 'Customers, sales, payments, products, suppliers'}
                </p>
              </div>
              {exportingExcel
                ? <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                : <span className="text-gray-400 text-sm flex-shrink-0">↓</span>
              }
            </button>

            {/* Download JSON Backup */}
            <button
              onClick={handleJsonExport}
              disabled={exportingJson}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-base">💾</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {exportingJson
                    ? (lang === 'np' ? 'डाउनलोड हुँदैछ...' : 'Downloading...')
                    : (lang === 'np' ? 'JSON ब्याकअप डाउनलोड गर्नुस्' : 'Download JSON Backup')}
                </p>
                <p className="text-xs text-gray-400">
                  {lang === 'np' ? 'Google Drive मा सेभ गर्नुस्' : 'Save to Google Drive for safekeeping'}
                </p>
              </div>
              {exportingJson
                ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                : <span className="text-gray-400 text-sm flex-shrink-0">↓</span>
              }
            </button>

            {/* Trigger manual backup */}
            <button
              onClick={handleTriggerBackup}
              disabled={triggeringBackup}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-base">🔄</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {triggeringBackup
                    ? (lang === 'np' ? 'ब्याकअप सिर्जना हुँदैछ...' : 'Creating backup...')
                    : (lang === 'np' ? 'अहिले ब्याकअप गर्नुस्' : 'Backup Now')}
                </p>
                <p className="text-xs text-gray-400">
                  {lang === 'np' ? 'सर्भरमा ब्याकअप सिर्जना गर्नुस्' : 'Create a backup on the server immediately'}
                </p>
              </div>
              {triggeringBackup && (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* ── App info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl mb-1">🏪</p>
          <p className="text-sm font-bold text-gray-800">{t.settings.version}</p>
          <p className="text-xs text-gray-400">{t.settings.versionDesc}</p>
          <p className="text-xs text-gray-300 mt-1 select-all">{t.settings.shopId}: {user?.shopId ?? '—'}</p>
        </div>

        {/* ── Danger Zone ── */}
        <div>
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">{t.settings.dangerZone}</h2>
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
            >
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-red-600">{t.common.logout}</p>
                <p className="text-xs text-red-400">{t.settings.signOut}</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-red-300" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
