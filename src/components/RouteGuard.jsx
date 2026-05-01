import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';

export function AuthGuard({ children }) {
  const user = useSessionStore((s) => s.user);
  const loading = useSessionStore((s) => s.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100svh]">
        <div className="text-gray-400 animate-pulse text-lg">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function GuestGuard({ children }) {
  const user = useSessionStore((s) => s.user);
  const loading = useSessionStore((s) => s.loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100svh]">
        <div className="text-gray-400 animate-pulse text-lg">Loading…</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
