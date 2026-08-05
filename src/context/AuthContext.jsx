import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshToken as refreshTokenRequest,
} from '@/services/authApi';

import {
  clearAccessToken,
  setAccessToken,
  setAuthHandlers,
} from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] =
    useState(true);

  useEffect(() => {
    setAuthHandlers({
      onRefreshed: (newToken) => {
        setAccessToken(newToken);
      },
      onExpired: () => {
        clearAccessToken();
        setUser(null);
      },
    });

    return () => {
      setAuthHandlers({
        onRefreshed: null,
        onExpired: null,
      });
    };
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const refreshResult =
          await refreshTokenRequest();

        const token =
          refreshResult?.accessToken ??
          refreshResult?.token;

        if (token) {
          setAccessToken(token);
        }

        const meResult = await getMe();

        const restoredUser =
          meResult?.user ?? meResult;

        setUser(restoredUser);
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    const result = await loginRequest(credentials);

    const authenticatedUser =
      result?.user ?? result;

    setUser(authenticatedUser);

    return authenticatedUser;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isAuthLoading,
      login,
      logout,
    }),
    [user, isAuthLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth harus digunakan di dalam AuthProvider.',
    );
  }

  return context;
}