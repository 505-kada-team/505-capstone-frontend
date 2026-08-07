import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({
  allowedRoles = [],
}) {
  const {
    isAuthenticated,
    isAuthLoading,
    role,
  } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Memuat sesi...
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const isRoleAllowed =
    allowedRoles.length === 0 ||
    allowedRoles.includes(role);

  if (!isRoleAllowed) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}