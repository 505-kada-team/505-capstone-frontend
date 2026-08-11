import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";

import FormInput from "@/components/shared/FormInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetPasswordSchema } from "@/schemas/authSchema";
import { resetPassword } from "@/services/authApi";

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Password gagal direset. Silakan coba kembali.";

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = location.state?.resetToken;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetToken: resetToken || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (!resetToken) return <Navigate to="/forgot-password" replace />;

  const handleResetPasswordSubmit = async ({ resetToken, newPassword }) => {
    try {
      const result = await resetPassword({ resetToken, newPassword });

      navigate("/login", {
        replace: true,
        state: {
          message: result?.message || "Password berhasil diubah. Silakan login kembali.",
        },
      });
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: getErrorMessage(error),
      });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-heading text-2xl">Buat password baru</CardTitle>

          <CardDescription className="leading-6">
            Masukkan password baru untuk akunmu. Gunakan minimal 8 karakter agar akun lebih aman.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            noValidate
            className="space-y-5"
            onSubmit={handleSubmit(handleResetPasswordSubmit)}
          >
            {errors.root?.server && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {errors.root.server.message}
              </div>
            )}

            <input type="hidden" {...register("resetToken")} />

            <FormInput
              id="reset-new-password"
              label="Password baru"
              type={showPassword ? "text" : "password"}
              required
              icon={LockKeyhole}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              disabled={isSubmitting}
              error={errors.newPassword?.message}
              endAdornment={
                <button
                  type="button"
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
              {...register("newPassword")}
            />

            <FormInput
              id="reset-confirm-password"
              label="Konfirmasi password"
              type={showConfirmPassword ? "text" : "password"}
              required
              icon={LockKeyhole}
              autoComplete="new-password"
              placeholder="Masukkan ulang password"
              disabled={isSubmitting}
              error={errors.confirmPassword?.message}
              endAdornment={
                <button
                  type="button"
                  disabled={isSubmitting}
                  aria-label={
                    showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
                  onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Menyimpan password...
                </>
              ) : (
                "Simpan password baru"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t px-6 py-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke login
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
