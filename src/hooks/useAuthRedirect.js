import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { getRoleHomePath } from '@/lib/roleRedirect';

/**
 * Redirect ke dashboard sesuai role kalau user sudah authenticated.
 * Dipakai di halaman publik (LoginPage) supaya user yang sesinya masih
 * valid tidak nyangkut di form login.
 *
 * Kalau role tidak dikenali, sengaja TIDAK redirect — biarkan halaman
 * ini render seperti biasa daripada diam-diam macet tanpa penjelasan.
 */
export function useAuthRedirect() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const role = user?.role ?? null;

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;

    const target = getRoleHomePath(user?.role);

    if (!target) return;

    navigate(target, { replace: true });
  }, [isAuthenticated, isAuthLoading, navigate, role]);

  return { isAuthLoading };
}