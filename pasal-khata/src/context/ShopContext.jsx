/**
 * ShopContext — kept as a thin shell for backward-compatibility.
 * All real data is now fetched directly by the individual page hooks
 * (useCustomers, useSales, useProducts, usePayments, useDashboard).
 *
 * This context is no longer the primary data store; it can be removed
 * once all pages have been confirmed to use the API hooks.
 */
import { createContext, useContext } from 'react';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  return (
    <ShopContext.Provider value={{}}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext) ?? {};
}
