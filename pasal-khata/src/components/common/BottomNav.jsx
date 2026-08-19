import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, ShoppingCartIcon, TruckIcon, EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon         as HomeIconSolid,
  UsersIcon        as UsersIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  TruckIcon        as TruckIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useLang } from '../../context/LanguageContext';

// Routes where BottomNav should NOT appear
const HIDDEN_ON = ['/my-khata', '/login', '/'];

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { lang, switchLang } = useLang();

  // Hide on login, customer view, and unauthenticated routes
  if (!isAuthenticated) return null;
  if (user?.role === 'customer') return null;
  if (HIDDEN_ON.some(r => pathname === r)) return null;

  const mainNav = [
    { to: '/dashboard', label: t.nav.dashboard, Icon: HomeIcon,         IconActive: HomeIconSolid         },
    { to: '/customers', label: t.nav.customers, Icon: UsersIcon,        IconActive: UsersIconSolid        },
    { to: '/sales',     label: t.nav.sales,     Icon: ShoppingCartIcon, IconActive: ShoppingCartIconSolid },
    { to: '/suppliers', label: t.nav.suppliers, Icon: TruckIcon,        IconActive: TruckIconSolid        },
  ];

  const moreItems = [
    { to: '/products',  label: `📦 ${t.nav.products}`  },
    { to: '/purchases', label: `🛒 ${t.nav.purchases}` },
    { to: '/payments',  label: `💵 ${t.nav.payments}`  },
    { to: '/reports',   label: `📊 ${t.nav.reports}`   },
    { to: '/settings',  label: `⚙️ ${t.nav.settings}`  },
  ];

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-40 flex items-end justify-center"
          onClick={() => setShowMore(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[430px] bg-white rounded-t-2xl pb-24 z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-2">More</p>
            {moreItems.map(item => (
              <button
                key={item.to}
                onClick={() => { navigate(item.to); setShowMore(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <span className="text-base">{item.label.split(' ')[0]}</span>
                <span className="text-sm font-semibold text-gray-800">{item.label.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
            {/* Language toggle inside More sheet */}
            <div className="px-5 py-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t.settings.language}</p>
              <div className="flex gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'np', label: 'नेपाली'  },
                ].map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => { switchLang(opt.code); setShowMore(false); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      lang === opt.code
                        ? 'bg-[#F5F3FF] text-[#5b21b6] border-[#ede9fe]'
                        : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {mainNav.map(({ to, label, Icon, IconActive }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-h-[44px] justify-center ${
                  isActive ? 'text-[#1a56db]' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <IconActive className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  <span className={`text-[10px] font-medium ${isActive ? 'text-[#1a56db]' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMore(m => !m)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-h-[44px] justify-center ${
              showMore ? 'text-[#1a56db]' : 'text-gray-400'
            }`}
          >
            <EllipsisHorizontalIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
