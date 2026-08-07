import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import OtpInput from "@/components/shared/OtpInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { verifyResetCodeSchema } from "@/schemas/authSchema";
import { forgotPassword, verifyResetCode } from "@/services/authApi";

const RESEND_COOLDOWN = 60;
// ⚠️ Samakan dengan panjang OTP yang benar-benar dikirim backend
// (lihat catatan di OtpInput.jsx).
const CODE_LENGTH = 6;

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallbackMessage;

export default function VerifyResetCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email;

  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyResetCodeSchema),
    defaultValues: {
      email: emailFromState || "",
      code: "",
    },
  });

  const loading = isSubmitting || isResending;

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setCountdown((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  if (!emailFromState) return <Navigate to="/forgot-password" replace />;

  const handleVerifyResetCodeSubmit = async ({ code }) => {
    clearErrors("code");

    try {
      const result = await verifyResetCode({ email: emailFromState, code });
      const resetToken = result?.resetToken;

      if (!resetToken) throw new Error("Reset token tidak tersedia.");

      navigate("/forgot-password/reset", {
        state: { resetToken },
      });
    } catch (error) {
      // DESIGN.md 5b: error yang terikat 1 field spesifik (kode salah,
      // 400/409 dari validasi) tampil inline di bawah field itu.
      // Error tanpa respons (network) tidak terikat field → toast.
      const message = getErrorMessage(
        error,
        "Kode reset password tidak valid. Silakan periksa kembali kode yang dimasukkan.",
      );

      if (error.response) {
        setError("code", { type: "server", message });
      } else {
        toast.error(message);
      }
    }
  };

  const handleResendCode = async () => {
    const trimmedEmail = emailFromState?.trim();

    if (!trimmedEmail) {
      toast.error("Email wajib tersedia sebelum meminta kode baru.");
      return;
    }

    setIsResending(true);

    try {
      const result = await forgotPassword(trimmedEmail);

      toast.success(result?.message || "Kode reset password berhasil dikirim ulang.");
      setCountdown(RESEND_COOLDOWN);
    } catch (error) {
      // Bukan error 1 field spesifik → toast (DESIGN.md 5b).
      toast.error(
        getErrorMessage(error, "Kode reset password gagal dikirim ulang. Silakan coba kembali."),
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-heading text-2xl font-bold">
            Verifikasi Kode Reset
          </CardTitle>

          <CardDescription className="text-sm leading-6">
            Masukkan kode 6 digit yang kami kirim ke
            <br />
            <span className="font-medium text-foreground">{emailFromState}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            noValidate
            className="space-y-6"
            onSubmit={handleSubmit(handleVerifyResetCodeSubmit)}
          >
            <div className="space-y-2">
              <p className="text-center text-sm font-medium text-foreground">
                Kode Verifikasi
              </p>

              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <OtpInput
                    length={CODE_LENGTH}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={loading}
                    error={errors.code?.message}
                    autoFocus
                  />
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Verifikasi Kode"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Belum menerima kode?</p>

            <Button
              type="button"
              variant="link"
              disabled={loading || countdown > 0}
              className="mt-1 h-auto p-0 font-medium text-accent hover:text-accent/90"
              onClick={handleResendCode}
            >
              {isResending ? (
                <>
                  <LoaderCircle className="size-5 animate-spin" />
                  Mengirim ulang...
                </>
              ) : countdown > 0 ? (
                `Kirim ulang dalam ${countdown} detik`
              ) : (
                "Kirim ulang kode"
              )}
            </Button>
          </div>
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
