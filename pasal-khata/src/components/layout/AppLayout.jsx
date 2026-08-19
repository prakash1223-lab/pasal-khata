import { useLocation } from 'react-router-dom';
import Sidebar    from './Sidebar';
import OfflineBar from '../common/OfflineBar';
import { useAuth } from '../../context/AuthContext';

// Routes that always get a full-screen layout (no sidebar)
const FULLSCREEN_ROUTES = ['/my-khata', '/login', '/'];

export default function AppLayout({ children }) {
  const { pathname }                         = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading)        return <>{children}</>;
  if (!isAuthenticated) return <>{children}</>;
  if (user?.role === 'customer') return <>{children}</>;

  const isFullscreen = FULLSCREEN_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/')
  );
  if (isFullscreen) return <>{children}</>;

  // Owner / Staff: sidebar + content layout with offline bar
  return (
    <>
      <Sidebar />
      <div className="md:ml-60 md:min-h-screen md:bg-[#F0F2F5]">
        {/* Offline / sync status bar — visible on every owner/staff page */}
        <OfflineBar />
        <div className="max-w-[430px] mx-auto md:max-w-none md:mx-0">
          {children}
        </div>
      </div>
    </>
  );
}
