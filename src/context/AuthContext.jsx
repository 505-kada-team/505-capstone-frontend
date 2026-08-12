import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  restoreSession as restoreSessionRequest,
  changePassword as changePasswordRequest,
} from "@/services/authApi";
import { clearAccessToken, setAuthHandlers } from "@/services/api";

const AuthContext = createContext(null);

const ALLOWED_ROLES = ["admin", "cashier"];

const isValidAuthUser = (user) => {
  return Boolean(
    user &&
    typeof user === "object" &&
    (user.id || user._id) &&
    user.email &&
    ALLOWED_ROLES.includes(user.role),
  );
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    setAuthHandlers({
      onRefreshed: () => {},
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
    let isActive = true;

    const restoreSession = async () => {
      try {
        const restoredUser = await restoreSessionRequest();

        if (!isValidAuthUser(restoredUser)) {
          throw new Error("Response restoreSession tidak memiliki user yang valid.");
        }

        if (isActive) {
          setUser(restoredUser);
        }
      } catch {
        clearAccessToken();

        if (isActive) {
          setUser(null);
        }
      } finally {
        if (isActive) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const login = async (credentials) => {
    const result = await loginRequest(credentials);
    const authenticatedUser = result?.user ?? null;

    if (!isValidAuthUser(authenticatedUser)) {
      clearAccessToken();
      setUser(null);

      throw new Error("Response login tidak memiliki data user yang valid.");
    }

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

  const changePassword = async ({ oldPassword, newPassword }) => {
    const result = await changePasswordRequest({ oldPassword, newPassword });

    clearAccessToken();
    setUser(null);

    return result;
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: isValidAuthUser(user),
      isAuthLoading,
      login,
      logout,
      changePassword,
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
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }

  return context;
}