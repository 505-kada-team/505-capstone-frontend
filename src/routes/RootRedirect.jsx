import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/**
 * Redirect "/" berdasarkan status auth, bukan statis ke /login.
 * Menunggu isAuthLoading selesai supaya tidak flicker/salah lempar
 * saat restoreSession() masih berjalan di AuthContext.
 */
export default function RootRedirect() {
  const { isAuthenticated, isAuthLoading, role } = useAuth()

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Memuat sesi...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const target = getRoleHomePath(role) ?? '/login'
  return <Navigate to={target} replace />
}