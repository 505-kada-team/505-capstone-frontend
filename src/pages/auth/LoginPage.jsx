import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import LoginForm from "@/components/shared/LoginForm";
import RegisterForm from "@/components/shared/RegisterForm";
import { useAuth } from "@/context/AuthContext";

const FORM_MODE = {
  LOGIN: "login",
  REGISTER: "register",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const [formMode, setFormMode] = useState(FORM_MODE.LOGIN);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;

    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (user?.role === "kasir") {
      navigate("/kasir", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, user]);

  if (isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FDF5E6] px-4">
        <p className="text-sm text-[#4B3621]/70">Memeriksa sesi...</p>
      </main>
    );
  }

  const isLoginMode = formMode === FORM_MODE.LOGIN;

  return (
    <main className="min-h-screen bg-[#FDF5E6]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden bg-[#4B3621] p-12 text-[#FDF5E6] lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-16 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-md bg-[#F97331] text-lg font-bold text-white">
                AC
              </div>

              <div>
                <p className="text-lg font-semibold">Afternoon Coffee</p>
                <p className="text-sm text-[#D2B48C]">Inventory &amp; Sales System</p>
              </div>
            </div>

            <div className="max-w-lg">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#D2B48C]">
                Operasional lebih teratur
              </p>

              <h1 className="text-4xl font-semibold leading-tight">
                Kelola inventory dan penjualan dalam satu aplikasi.
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-[#FDF5E6]/75">
                Pantau ketersediaan barang, jalankan transaksi, dan kelola aktivitas usaha dengan alur
                yang lebih terstruktur.
              </p>
            </div>
          </div>

          <p className="text-sm text-[#D2B48C]">Sistem operasional F&amp;B untuk Admin dan Kasir.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-[#4B3621] font-bold text-[#FDF5E6]">
                  AC
                </div>

                <div>
                  <p className="font-semibold text-[#4B3621]">Afternoon Coffee</p>
                  <p className="text-sm text-[#4B3621]/60">Inventory &amp; Sales System</p>
                </div>
              </div>
            </div>

            <div className="border border-[#D2B48C]/60 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-[#4B3621]">
                  {isLoginMode ? "Selamat datang" : "Buat akun baru"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isLoginMode
                    ? "Masukkan email dan password untuk melanjutkan."
                    : "Lengkapi informasi berikut untuk membuat akun."}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 border-b border-[#D2B48C]/50">
                <button
                  type="button"
                  onClick={() => setFormMode(FORM_MODE.LOGIN)}
                  className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    isLoginMode
                      ? "border-[#F97331] text-[#4B3621]"
                      : "border-transparent text-muted-foreground hover:text-[#4B3621]"
                  }`}
                >
                  Masuk
                </button>

                <button
                  type="button"
                  onClick={() => setFormMode(FORM_MODE.REGISTER)}
                  className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    !isLoginMode
                      ? "border-[#F97331] text-[#4B3621]"
                      : "border-transparent text-muted-foreground hover:text-[#4B3621]"
                  }`}
                >
                  Daftar
                </button>
              </div>

              {isLoginMode ? (
                <LoginForm onSwitchToRegister={() => setFormMode(FORM_MODE.REGISTER)} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setFormMode(FORM_MODE.LOGIN)} />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

