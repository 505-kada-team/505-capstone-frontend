import {Navigate, Outlet,} from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({allowedRoles,}) {
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

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRoles?.length &&
    !allowedRoles.includes(role)
  ) {
    const target =
      role === 'admin'
        ? '/admin'
        : '/kasir';

    return (
      <Navigate
        to={target}
        replace
      />
    );
  }

  return <Outlet />;
}