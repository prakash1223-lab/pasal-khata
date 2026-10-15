import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

export default function Login() {
  const [activeTab, setActiveTab] = useState('owner');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const shopId = import.meta.env.VITE_SHOP_ID ?? '';

  const { loginAsOwner, loginAsCustomer } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleTabSwitch = (newTab) => {
    setActiveTab(newTab);
    setError('');
    setEmail('');
    setPassword('');
    setPhone('');
  };

  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError(t.errors.required); return; }
    setLoading(true);
    setError('');
    const result = await loginAsOwner(email.trim(), password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || t.auth.wrongCredentials);
    }
    setLoading(false);
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    if (!/^9[6-9]\d{8}$/.test(phone)) {
      setError(t.errors.invalidNepalPhone);
      return;
    }
    if (!shopId) {
      setError(t.auth.shopNotConfigured);
      return;
    }
    setLoading(true);
    setError('');
    const result = await loginAsCustomer(phone, shopId);
    if (result.success) {
      navigate('/my-khata');
    } else {
      setError(result.message || t.auth.customerNotFound);
    }
    setLoading(false);
  };

  const TABS = [
    { key: 'owner',    label: t.auth.ownerLoginTab },
    { key: 'customer', label: t.auth.myKhataTab    },
  ];

  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6 py-12">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#1a56db] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
          <span className="text-3xl">🏪</span>
        </div>
        <h1 className="text-3xl font-black text-[#1a56db] tracking-tight">पसल खाता</h1>
        <p className="text-gray-500 text-sm mt-1">{t.auth.tagline}</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabSwitch(key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4" role="alert">
            {error}
          </div>
        )}

        {activeTab === 'owner' ? (
          <form onSubmit={handleOwnerLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.email}
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder={t.auth.emailPlaceholder}
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.password}
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
                style={{ fontSize: '16px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              {loading ? <><Spinner /> {t.auth.loggingIn}</> : t.auth.loginAsOwner}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCustomerLogin} className="space-y-4" noValidate>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-700 font-medium">{t.auth.khataPrivate}</p>
              <p className="text-xs text-blue-500 mt-1">{t.auth.khataPrivateDesc}</p>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.phone}
              </label>
              <div className="flex gap-2">
                <div className="bg-gray-100 rounded-xl px-3 flex items-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">🇳🇵 +977</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                    setError('');
                  }}
                  placeholder={t.auth.phonePlaceholder}
                  maxLength={10}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a56db] text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-70 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              {loading ? <><Spinner /> {t.auth.loadingKhata}</> : t.auth.getMyKhata}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">पसल खाता v1.0 · Made for Nepal 🇳🇵</p>
    </div>
  );
}