import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, ShoppingCartIcon, CubeIcon, ChartBarIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon, BuildingStorefrontIcon,
  TruckIcon, CurrencyDollarIcon, BanknotesIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon         as HomeIconSolid,
  UsersIcon        as UsersIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  CubeIcon         as CubeIconSolid,
  ChartBarIcon     as ChartBarIconSolid,
  Cog6ToothIcon    as Cog6ToothIconSolid,
  TruckIcon        as TruckIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  BanknotesIcon    as BanknotesIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useLang } from '../../context/LanguageContext';
import Avatar from '../common/Avatar';

function NavItem({ to, label, Icon, IconActive }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
          isActive
            ? 'bg-blue-50 text-[#1d4ed8]'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive
            ? <IconActive className="w-5 h-5 flex-shrink-0 text-[#1d4ed8]" />
            : <Icon       className="w-5 h-5 flex-shrink-0 text-gray-400" />
          }
          {label}
        </>
      )}
    </NavLink>
  );
}

function NavSection({ label, items }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1">{label}</p>
      <div className="space-y-0.5">
        {items.map(item => <NavItem key={item.to} {...item} />)}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { t }            = useTranslation();
  const { lang, switchLang } = useLang();

  const MAIN_NAV = [
    { to: '/dashboard', label: t.nav.dashboard, Icon: HomeIcon,          IconActive: HomeIconSolid          },
    { to: '/customers', label: t.nav.customers, Icon: UsersIcon,         IconActive: UsersIconSolid         },
    { to: '/sales',     label: t.nav.sales,     Icon: ShoppingCartIcon,  IconActive: ShoppingCartIconSolid  },
    { to: '/suppliers', label: t.nav.suppliers, Icon: TruckIcon,         IconActive: TruckIconSolid         },
    { to: '/purchases', label: t.nav.purchases, Icon: CurrencyDollarIcon,IconActive: CurrencyDollarIconSolid},
  ];

  const INVENTORY_NAV = [
    { to: '/products', label: t.nav.products, Icon: CubeIcon,      IconActive: CubeIconSolid      },
    { to: '/payments', label: t.nav.payments, Icon: BanknotesIcon, IconActive: BanknotesIconSolid },
  ];

  const INSIGHTS_NAV = [
    { to: '/reports', label: t.nav.reports, Icon: ChartBarIcon, IconActive: ChartBarIconSolid },
  ];

  const ACCOUNT_NAV = [
    { to: '/settings', label: t.nav.settings, Icon: Cog6ToothIcon, IconActive: Cog6ToothIconSolid },
  ];

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 flex-col z-30">
      {/* Shop header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BuildingStorefrontIcon className="w-5 h-5 text-[#1a56db]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.shopName ?? 'My Shop'}</p>
            <p className="text-[11px] text-gray-400">पसल खाता</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <NavSection label={t.nav.main}      items={MAIN_NAV}      />
        <NavSection label={t.nav.inventory} items={INVENTORY_NAV} />
        <NavSection label={t.nav.insights}  items={INSIGHTS_NAV}  />
        <NavSection label={t.nav.account}   items={ACCOUNT_NAV}   />
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={user?.name ?? 'User'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? t.common.owner}</p>
            <span className="text-[10px] bg-blue-100 text-[#1a56db] font-medium px-2 py-0.5 rounded-full capitalize">
              {user?.role === 'owner' ? t.common.owner : user?.role === 'staff' ? t.common.staff : user?.role ?? t.common.owner}
            </span>
          </div>
        </div>

        {/* Language toggle */}
        <div className="flex gap-1.5 mb-2.5">
          {[
            { code: 'en', label: 'EN' },
            { code: 'np', label: 'ने' },
          ].map(opt => (
            <button
              key={opt.code}
              onClick={() => switchLang(opt.code)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                lang === opt.code
                  ? 'bg-[#F5F3FF] text-[#5b21b6] border-[#ede9fe]'
                  : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
          <ArrowRightOnRectangleIcon className="w-4 h-4" /> {t.common.logout}
        </button>
      </div>
    </aside>
  );
}
