import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return user?.role === 'customer'
      ? <Navigate to="/my-khata" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return children;
}
