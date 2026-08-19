import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api                    from '../services/api';
import { initLocalDB }        from '../db/localDB';
import { clearAllLocalData }  from '../db/localDB';
import { fullSyncFromServer } from '../db/syncEngine';

const AuthContext = createContext(null);

const TOKEN_KEY = 'pasal_khata_token';
const USER_KEY  = 'pasal_khata_user';

// ── helpers ──────────────────────────────────────────────────────────────────

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, String(token));
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);
    if (token && raw) return { token, user: JSON.parse(raw) };
  } catch { /* corrupted — ignore */ }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading,       setIsLoading]       = useState(true);

  // ── Startup: restore session + init local DB ────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      // Always init local DB so IndexedDB is ready even offline
      await initLocalDB();

      const session = readSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Optimistically restore so UI doesn't flash to /login
      setUser(session.user);
      setIsAuthenticated(true);

      // If online — verify token + pull fresh data
      if (navigator.onLine) {
        try {
          const res       = await api.get('/auth/me');
          const freshUser = res.data ?? res;
          setUser(freshUser);
          saveSession(session.token, freshUser);
          setIsAuthenticated(true);
          // Await full sync so IndexedDB is populated BEFORE hooks render
          await fullSyncFromServer(freshUser.shopId);
        } catch {
          // Token expired or invalid
          clearSession();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      // If offline — stay logged in from localStorage; local DB already has data

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // ── loginAsOwner ────────────────────────────────────────────────────────────
  const loginAsOwner = useCallback(async (email, password) => {
    // Offline login: allow re-entry if credentials match saved user
    if (!navigator.onLine) {
      const session = readSession();
      if (session && session.user.email === email) {
        setUser(session.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return {
        success: false,
        message: 'No internet. Please login online at least once first.',
      };
    }

    try {
      const res      = await api.post('/auth/login', { email, password });
      const data     = res.data ?? res;
      const userData = {
        id:       data.user.id,
        name:     data.user.name,
        email:    data.user.email,
        phone:    data.user.phone,
        role:     data.user.role,
        shopId:   data.user.shopId,
        shopName: data.shop?.name ?? 'My Shop',
      };
      saveSession(data.token, userData);
      setUser(userData);
      setIsAuthenticated(true);
      // Await full sync so IndexedDB is populated before the dashboard renders
      await initLocalDB();
      await fullSyncFromServer(userData.shopId);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // ── loginAsCustomer ─────────────────────────────────────────────────────────
  const loginAsCustomer = useCallback(async (phone, shopId) => {
    try {
      const res      = await api.post('/auth/customer-login', { phone, shopId });
      const data     = res.data ?? res;
      const userData = {
        id:         data.customer.id,
        customerId: data.customer.id,
        name:       data.customer.name,
        phone:      data.customer.phone,
        role:       'customer',
        shopId:     data.customer.shopId ?? shopId,
      };
      saveSession(data.token, userData);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // ── logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    // Clear local DB so next user gets a fresh sync
    clearAllLocalData().catch(console.error);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ── role helpers ────────────────────────────────────────────────────────────
  const isOwner        = () => user?.role === 'owner';
  const isStaff        = () => user?.role === 'staff';
  const isCustomer     = () => user?.role === 'customer';
  const isOwnerOrStaff = () => user?.role === 'owner' || user?.role === 'staff';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      loginAsOwner,
      loginAsCustomer,
      logout,
      isOwner,
      isStaff,
      isCustomer,
      isOwnerOrStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
