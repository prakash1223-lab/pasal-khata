import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }       from './context/AuthContext';
import { LanguageProvider }            from './context/LanguageContext';
import { NetworkProvider }             from './context/NetworkContext';
import AppLayout                       from './components/layout/AppLayout';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import InstallPrompt  from './components/common/InstallPrompt';

// Pages
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Customers      from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import NewSale        from './pages/NewSale';
import Sales          from './pages/Sales';
import Products       from './pages/Products';
import Payments       from './pages/Payments';
import Reports        from './pages/Reports';
import MyKhata        from './pages/MyKhata';
import Settings       from './pages/Settings';
import Suppliers      from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import Purchases      from './pages/Purchases';
import NewPurchase    from './pages/NewPurchase';

// ── Root redirect based on role ───────────────────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading)        return null;
  if (!isAuthenticated) return <Login />;
  return <Navigate to={user?.role === 'customer' ? '/my-khata' : '/dashboard'} replace />;
}

// ── App routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />

      {/* Owner + Staff */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Dashboard /></ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Customers /></ProtectedRoute>
      } />
      <Route path="/customers/:id" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><CustomerDetail /></ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Sales /></ProtectedRoute>
      } />
      <Route path="/sales/new" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><NewSale /></ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Products /></ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Payments /></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Reports /></ProtectedRoute>
      } />
      <Route path="/suppliers" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Suppliers /></ProtectedRoute>
      } />
      <Route path="/suppliers/:id" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><SupplierDetail /></ProtectedRoute>
      } />
      <Route path="/purchases" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><Purchases /></ProtectedRoute>
      } />
      <Route path="/purchases/new" element={
        <ProtectedRoute allowedRoles={['owner', 'staff']}><NewPurchase /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['owner']}><Settings /></ProtectedRoute>
      } />

      {/* Customer only */}
      <Route path="/my-khata" element={
        <ProtectedRoute allowedRoles={['customer']}><MyKhata /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <NetworkProvider>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
            <InstallPrompt />
          </NetworkProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
