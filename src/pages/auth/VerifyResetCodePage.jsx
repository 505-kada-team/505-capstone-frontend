import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, LoaderCircle, Mail } from "lucide-react";
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
import { verifyResetCodeSchema } from "@/schemas/authSchema";
import { forgotPassword, verifyResetCode } from "@/services/authApi";

const RESEND_COOLDOWN = 60;

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
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");

  const {
    register,
    handleSubmit,
    watch,
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

  const email = watch("email");
  const loading = isSubmitting || isResending;

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setCountdown((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  if (!emailFromState) return <Navigate to="/forgot-password" replace />;

  const handleVerifyResetCodeSubmit = async ({ email, code }) => {
    clearErrors("root.server");
    setSuccessMessage("");

    try {
      const result = await verifyResetCode({ email, code });
      const resetToken = result?.resetToken;

      if (!resetToken) throw new Error("Reset token tidak tersedia.");

      navigate("/forgot-password/reset", {
        state: { resetToken },
      });
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: getErrorMessage(
          error,
          "Kode reset password tidak valid. Silakan periksa kembali kode yang dimasukkan.",
        ),
      });
    }
  };

  const handleResendCode = async () => {
    clearErrors("root.server");
    setSuccessMessage("");

    const trimmedEmail = email?.trim();

    if (!trimmedEmail) {
      setError("email", {
        type: "manual",
        message: "Email wajib tersedia sebelum meminta kode baru.",
      });
      return;
    }

    setIsResending(true);

    try {
      const result = await forgotPassword(trimmedEmail);

      setSuccessMessage(result?.message || "Kode reset password berhasil dikirim ulang.");
      setCountdown(RESEND_COOLDOWN);
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: getErrorMessage(
          error,
          "Kode reset password gagal dikirim ulang. Silakan coba kembali.",
        ),
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <KeyRound className="size-6" />
          </div>

          <div className="space-y-2">
            <CardTitle className="font-heading text-2xl">Verifikasi kode reset</CardTitle>

            <CardDescription className="leading-6">
              Masukkan kode reset password yang dikirim ke email akunmu untuk melanjutkan pembuatan
              password baru.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form
            noValidate
            className="space-y-5"
            onSubmit={handleSubmit(handleVerifyResetCodeSubmit)}
          >
            {errors.root?.server && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {errors.root.server.message}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
              >
                {successMessage}
              </div>
            )}

            <FormInput
              id="reset-email"
              label="Email"
              type="email"
              required
              icon={Mail}
              autoComplete="email"
              placeholder="nama@email.com"
              disabled={loading}
              error={errors.email?.message}
              {...register("email")}
            />

            <FormInput
              id="reset-code"
              label="Kode reset password"
              type="text"
              required
              icon={KeyRound}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Contoh: 654321"
              maxLength={8}
              disabled={loading}
              error={errors.code?.message}
              {...register("code")}
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Verifikasi kode"
              )}
            </Button>
          </form>

          <div className="mt-5 rounded-md border bg-muted/40 px-4 py-3 text-center">
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
                  <LoaderCircle className="size-4 animate-spin" />
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
