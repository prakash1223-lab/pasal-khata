/**
 * Bug Condition Exploration Tests — Task 1 (updated post-fix in Task 9)
 *
 * Originally written to assert BUGGY behaviour on unfixed code.
 * Updated in Task 9 to assert CORRECT (fixed) behaviour.
 *
 * All tests PASS on fixed code — confirming all 5 bugs are resolved.
 *
 * Bug 1 — subtitle ≠ h1 (no longer duplicated)
 * Bug 2 — useDashboard/getSummary accept period; Reports.jsx passes period
 * Bug 3 — FAB has bg-[#1a56db], not bg-amber-500
 * Bug 4 — const WA_ICON NOT found; shared WhatsAppIcon import present
 * Bug 5 — caption reflects selected period (not hardcoded to "this month")
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 *            Expected Behavior: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── shared mock utilities ────────────────────────────────────────────────────

// React-Router stubs (no real router needed for these tests)
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams:   () => ({ id: '1' }),
  useLocation: () => ({ pathname: '/payments' }),
  NavLink:     ({ children, to }) => React.createElement('a', { href: to }, typeof children === 'function' ? children({ isActive: false }) : children),
  Link:        ({ children, to }) => React.createElement('a', { href: to }, children),
}));

// Language context — always return 'en' so translations are predictable
vi.mock('../../context/LanguageContext', () => ({
  useLang: () => ({ lang: 'en', switchLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));

// Auth context — provide a minimal logged-in shop owner
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', shopId: 'shop1', role: 'owner', name: 'Test Owner' },
    isAuthenticated: true,
    isOwner: () => true,
    isStaff: () => false,
    isCustomer: () => false,
    isOwnerOrStaff: () => true,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

// Network context — always online, syncVersion = 0
vi.mock('../../context/NetworkContext', () => ({
  useNetwork: () => ({
    isOnline: true,
    syncVersion: 0,
    pendingCount: 0,
    isSyncing: false,
    lastSynced: null,
    performSync: vi.fn(),
    updatePendingCount: vi.fn(),
    fullSyncFromServer: vi.fn(),
  }),
  NetworkProvider: ({ children }) => children,
}));

// ─── Bug 1 — Payments.jsx desktop subtitle duplicates h1 ─────────────────────

vi.mock('../../hooks/usePayments', () => ({
  usePayments: () => ({
    payments: [
      { id: 'p1', amount: '500', customer_name: 'Alice', payment_method: 'cash', payment_date: '2024-01-15' },
      { id: 'p2', amount: '300', customer_name: 'Bob',   payment_method: 'esewa', payment_date: '2024-01-14' },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
    createPayment: vi.fn(),
  }),
}));

vi.mock('../../hooks/useCustomers', () => ({
  useCustomers: () => ({
    customers: [{ id: 'c1', name: 'Alice', baki: '200' }],
    loading: false,
  }),
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    showSuccess: vi.fn(),
    showError: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock('../../utils/nepaliDate', () => ({
  formatNepaliDate: (d) => ({ bs: `BS:${d}`, ad: d }),
}));

vi.mock('../../utils/currency', () => ({
  formatCurrency: (n) => `Rs.${n}`,
}));

vi.mock('../../components/common/BottomNav', () => ({
  default: () => null,
}));

vi.mock('../../components/common/TopBar', () => ({
  default: ({ title, subtitle }) =>
    React.createElement('div', { 'data-testid': 'topbar' },
      React.createElement('span', { 'data-testid': 'topbar-title' }, title),
      subtitle ? React.createElement('span', { 'data-testid': 'topbar-subtitle' }, subtitle) : null,
    ),
}));

vi.mock('../../components/common/Toast', () => ({
  ToastContainer: () => null,
}));

vi.mock('../../components/payments/PaymentForm', () => ({
  default: () => null,
}));

vi.mock('../../components/common/LoadingSpinner', () => ({
  default: () => null,
}));

vi.mock('../../components/common/EmptyState', () => ({
  default: () => null,
}));

vi.mock('../../components/common/Avatar', () => ({
  default: ({ name }) => React.createElement('span', null, name),
}));

describe('Bug 1 — Payments.jsx desktop subtitle no longer duplicates title (FIXED)', () => {
  it('desktop subtitle text differs from h1 text and shows count · filter label (Requirement 2.1)', async () => {
    const { default: Payments } = await import('../Payments.jsx');

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });

    const { container } = render(React.createElement(Payments));

    const desktopSection = container.querySelector('.desktop-page');
    expect(desktopSection, 'desktop-page section must exist').toBeTruthy();

    const desktopH1 = desktopSection.querySelector('h1');
    expect(desktopH1, 'desktop h1 must exist').toBeTruthy();

    const desktopToolbar = desktopSection.querySelector('.desktop-toolbar');
    expect(desktopToolbar, 'desktop-toolbar must exist').toBeTruthy();

    const toolbarTextDiv = desktopToolbar.querySelector('div');
    const subtitleP = toolbarTextDiv.querySelector('p');
    expect(subtitleP, 'desktop subtitle <p> must exist').toBeTruthy();

    const h1Text       = desktopH1.textContent;
    const subtitleText = subtitleP.textContent;

    console.log(`Bug 1 fixed: h1="${h1Text}", subtitle="${subtitleText}"`);

    // FIXED: subtitle must differ from h1 (no longer a duplicate)
    expect(h1Text).not.toBe(subtitleText);

    // h1 still uses t.payments.title (preservation: Requirement 3.1)
    expect(h1Text).toBe('Payments');

    // Subtitle must contain the count and a separator (Requirement 2.1)
    expect(subtitleText).toMatch(/\d+ payments? ·/i);
  });
});

// ─── Bug 2 — Reports filter tabs are cosmetic (no period param sent) ─────────

describe('Bug 2 — dashboardService.getSummary() now accepts period param (FIXED)', () => {
  it('getSummary function accepts a parameter — period is forwarded to API (Requirement 2.3)', async () => {
    const { dashboardService } = await import('../../services/dashboardService.js');

    // FIXED: getSummary now has a declared parameter (period = 'month')
    const fnLength = dashboardService.getSummary.length;
    console.log(`Bug 2 fixed: getSummary.length=${fnLength} (expected 0 because default params don't count in .length)`);

    // Note: JS function.length only counts params before the first default.
    // getSummary: (period = 'month') => ... has length 0 in JS spec.
    // We verify the fix via source code instead.
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const source = readFileSync(
      join(process.cwd(), 'src', 'services', 'dashboardService.js'), 'utf-8'
    );

    // Fixed: getSummary includes period param and passes it to API
    const hasDefaultParam = source.includes("period = 'month'") || source.includes('period = "month"');
    expect(hasDefaultParam).toBe(true);

    // Fixed: params are forwarded to the API call
    expect(source).toContain('params');
    expect(source).toContain('period');
  });

  it('useDashboard hook now accepts period parameter (Requirement 2.2)', async () => {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const source = readFileSync(
      join(process.cwd(), 'src', 'hooks', 'useDashboard.js'), 'utf-8'
    );

    // FIXED: useDashboard now accepts a period param with default 'month'
    const hasDefaultParam = source.includes("period = 'month'") || source.includes('period = "month"');
    console.log(`Bug 2 fixed: useDashboard has default period param: ${hasDefaultParam}`);
    expect(hasDefaultParam).toBe(true);
  });

  it('Reports.jsx calls useDashboard(period) — period state is passed (Requirement 2.2)', async () => {
    const reportsPath = join(process.cwd(), 'src', 'pages', 'Reports.jsx');
    const source = readFileSync(reportsPath, 'utf-8');

    // FIXED: Reports.jsx now passes period to useDashboard
    const hasFixedCall = source.includes('useDashboard(period)');
    console.log(`Bug 2 fixed: Reports.jsx contains useDashboard(period): ${hasFixedCall}`);

    expect(hasFixedCall).toBe(true);

    // The old unfixed call (no args) must be gone
    const hasUnfixedCall = source.includes('useDashboard()');
    expect(hasUnfixedCall).toBe(false);
  });
});

// ─── Bug 3 — Suppliers.jsx FAB uses amber instead of brand blue ───────────────

vi.mock('../../hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    suppliers: [
      { id: 's1', name: 'Supplier A', company_name: 'Acme Ltd', phone: '9800000001', udharo: '1500', total_purchased: '5000', total_paid: '3500' },
      { id: 's2', name: 'Supplier B', company_name: null,       phone: '9800000002', udharo: '0',    total_purchased: '2000', total_paid: '2000' },
    ],
    loading: false,
    error: null,
    search: '',
    setSearch: vi.fn(),
    pagination: { page: 1, total: 2, totalPages: 1 },
    createSupplier: vi.fn(),
  }),
}));

vi.mock('../../components/common/SearchBar', () => ({
  default: () => null,
}));

vi.mock('../../components/suppliers/SupplierCard', () => ({
  default: ({ supplier }) => React.createElement('div', { 'data-testid': 'supplier-card' }, supplier.name),
}));

vi.mock('../../components/suppliers/SupplierForm', () => ({
  default: () => null,
}));

describe('Bug 3 — Suppliers.jsx FAB and add-button now use brand blue (FIXED)', () => {
  it('mobile FAB className contains bg-[#1a56db] (Requirement 2.5)', async () => {
    const { default: Suppliers } = await import('../Suppliers.jsx');

    const { container } = render(React.createElement(Suppliers));

    const allButtons = Array.from(container.querySelectorAll('button'));
    const fab = allButtons.find(btn => {
      const cls = btn.className || '';
      return cls.includes('fixed') && cls.includes('rounded-full');
    });

    expect(fab, 'FAB button must be found in DOM').toBeTruthy();

    const fabClassName = fab.className;
    console.log(`Bug 3 fixed: FAB className="${fabClassName}"`);

    // FIXED: FAB now has brand blue
    expect(fabClassName).toContain('bg-[#1a56db]');

    // Amber is gone from the FAB
    expect(fabClassName).not.toContain('bg-amber-500');
  });

  it('mobile FAB has shadow-blue-200 (Requirement 2.5)', async () => {
    const { default: Suppliers } = await import('../Suppliers.jsx');
    const { container } = render(React.createElement(Suppliers));

    const fab = Array.from(container.querySelectorAll('button')).find(btn => {
      const cls = btn.className || '';
      return cls.includes('fixed') && cls.includes('rounded-full');
    });

    expect(fab, 'FAB button must be found in DOM').toBeTruthy();
    expect(fab.className).toContain('shadow-blue-200');
    expect(fab.className).not.toContain('shadow-amber-200');
  });

  it('desktop add-supplier button has bg-[#1a56db] hover:bg-blue-700 (Requirement 2.6)', async () => {
    const { default: Suppliers } = await import('../Suppliers.jsx');

    const { container } = render(React.createElement(Suppliers));

    const desktopSection = container.querySelector('.desktop-page');
    expect(desktopSection, 'desktop-page section must exist').toBeTruthy();

    const desktopToolbar = desktopSection.querySelector('.desktop-toolbar');
    expect(desktopToolbar, 'desktop-toolbar must exist').toBeTruthy();

    const allButtons = Array.from(desktopToolbar.querySelectorAll('button'));
    const addBtn = allButtons.find(btn => btn.className.includes('bg-[#1a56db]'));

    expect(addBtn, 'desktop add-supplier button with bg-[#1a56db] must exist').toBeTruthy();

    const btnClassName = addBtn.className;
    console.log(`Bug 3 fixed: desktop add-button className="${btnClassName}"`);

    // FIXED: brand blue classes present, amber gone
    expect(btnClassName).toContain('bg-[#1a56db]');
    expect(btnClassName).not.toContain('bg-amber-500');
    expect(btnClassName).not.toContain('hover:bg-amber-600');
  });
});

// ─── Bug 4 — WA_ICON removed; shared WhatsAppIcon now used ──────────────────

describe('Bug 4 — inline const WA_ICON removed; shared WhatsAppIcon imported (FIXED)', () => {
  it('CustomerDetail.jsx does NOT contain "const WA_ICON" (Requirement 2.8)', () => {
    const filePath = join(process.cwd(), 'src', 'pages', 'CustomerDetail.jsx');
    const source = readFileSync(filePath, 'utf-8');

    const hasInlineWaIcon = source.includes('const WA_ICON');
    console.log(`Bug 4 fixed: CustomerDetail.jsx contains const WA_ICON: ${hasInlineWaIcon} (expected false)`);

    // FIXED: inline duplicate is gone
    expect(hasInlineWaIcon).toBe(false);

    // FIXED: now imports from shared component (Requirement 2.8)
    const hasSharedImport = source.includes('WhatsAppIcon');
    expect(hasSharedImport).toBe(true);
  });

  it('MyKhata.jsx does NOT contain "const WA_ICON" (Requirement 2.9)', () => {
    const filePath = join(process.cwd(), 'src', 'pages', 'MyKhata.jsx');
    const source = readFileSync(filePath, 'utf-8');

    const hasInlineWaIcon = source.includes('const WA_ICON');
    console.log(`Bug 4 fixed: MyKhata.jsx contains const WA_ICON: ${hasInlineWaIcon} (expected false)`);

    // FIXED: inline duplicate is gone
    expect(hasInlineWaIcon).toBe(false);

    // FIXED: now imports from shared component (Requirement 2.9)
    const hasSharedImport = source.includes('WhatsAppIcon');
    expect(hasSharedImport).toBe(true);
  });

  it('both files import from components/common/WhatsAppIcon (Requirement 2.7)', () => {
    const detailSource = readFileSync(
      join(process.cwd(), 'src', 'pages', 'CustomerDetail.jsx'), 'utf-8'
    );
    const myKhataSource = readFileSync(
      join(process.cwd(), 'src', 'pages', 'MyKhata.jsx'), 'utf-8'
    );

    // Both must import from the shared WhatsAppIcon component path
    expect(detailSource).toContain('components/common/WhatsAppIcon');
    expect(myKhataSource).toContain('components/common/WhatsAppIcon');

    console.log('Bug 4 fixed: both CustomerDetail.jsx and MyKhata.jsx import from shared WhatsAppIcon component');
  });
});

// ─── Bug 5 — Reports mobile caption always shows "this month" ────────────────

// Mock useDashboard so Reports renders without API calls
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: () => ({
    data: {
      thisMonthSales:      { total: 10000, count: 5 },
      totalBaki:           { amount: 2000 },
      todaySales:          { total: 500, cashAmount: 300, creditAmount: 200 },
      profitSummary:       null,
      topBakiCustomers:    [],
      recentTransactions:  [],
      purchaseSummary:     null,
      topUdharoSuppliers:  [],
      totalCustomers:      10,
      totalProducts:       20,
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('Bug 5 — Reports mobile caption now reflects selected period (FIXED)', () => {
  it('clicking Year tab shows showingThisYear caption (Requirement 2.12)', async () => {
    const { default: Reports } = await import('../Reports.jsx');
    const { translations }     = await import('../../utils/translations.js');

    const t = translations.en;
    const showingThisYearText  = t.reports.showingThisYear;
    const showingThisMonthText = t.reports.showingThisMonth;

    const { container } = render(React.createElement(Reports));

    const captionBeforeClick = container.querySelector('p.text-\\[10px\\].text-gray-400.text-center.mt-1');
    expect(captionBeforeClick, 'mobile period caption must be in DOM').toBeTruthy();

    // Initial state still shows "this month" (preservation: Requirement 3.12)
    expect(captionBeforeClick.textContent).toBe(showingThisMonthText);

    // Click the "Year" period tab in the mobile section
    const mobileSection = container.querySelector('.md\\:hidden');
    expect(mobileSection, 'mobile section must exist').toBeTruthy();

    const filterTabsInMobile = mobileSection.querySelectorAll('.flex.bg-gray-100.rounded-xl');
    const mobilePeriodTabs = filterTabsInMobile[0];
    expect(mobilePeriodTabs, 'mobile period tabs must exist').toBeTruthy();

    const yearButtonInMobile = Array.from(mobilePeriodTabs.querySelectorAll('button'))
      .find(btn => btn.textContent.trim() === t.reports.period.year);
    expect(yearButtonInMobile, 'Year button in mobile tabs must exist').toBeTruthy();

    await act(async () => {
      fireEvent.click(yearButtonInMobile);
    });

    // FIXED: caption now shows "this year" after clicking Year
    const captionAfterClick = container.querySelector('p.text-\\[10px\\].text-gray-400.text-center.mt-1');
    expect(captionAfterClick, 'mobile period caption must still be in DOM after click').toBeTruthy();

    const captionText = captionAfterClick.textContent;
    console.log(`Bug 5 fixed: after clicking Year, caption="${captionText}" (expected "${showingThisYearText}")`);

    expect(captionText).toBe(showingThisYearText);
    expect(captionText).not.toBe(showingThisMonthText);
  });

  it('clicking Week tab shows showingThisWeek caption (Requirement 2.10)', async () => {
    const { default: Reports } = await import('../Reports.jsx');
    const { translations }     = await import('../../utils/translations.js');

    const t = translations.en;

    const { container } = render(React.createElement(Reports));

    // Click the "Week" tab in the mobile section
    const mobileSection = container.querySelector('.md\\:hidden');
    const filterTabsInMobile = mobileSection.querySelectorAll('.flex.bg-gray-100.rounded-xl');
    const mobilePeriodTabs = filterTabsInMobile[0];

    const weekButtonInMobile = Array.from(mobilePeriodTabs.querySelectorAll('button'))
      .find(btn => btn.textContent.trim() === t.reports.period.week);
    expect(weekButtonInMobile, 'Week button in mobile tabs must exist').toBeTruthy();

    await act(async () => {
      fireEvent.click(weekButtonInMobile);
    });

    const captionAfterClick = container.querySelector('p.text-\\[10px\\].text-gray-400.text-center.mt-1');
    const captionText = captionAfterClick.textContent;

    console.log(`Bug 5 fixed: after clicking Week, caption="${captionText}" (expected "${t.reports.showingThisWeek}")`);

    // FIXED: caption now reflects the selected period
    expect(captionText).toBe(t.reports.showingThisWeek);
    expect(captionText).not.toBe(t.reports.showingThisMonth);
  });
});
