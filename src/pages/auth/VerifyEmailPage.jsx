import { Link } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Mail, ShieldCheck } from "lucide-react";

import FormInput from "@/components/shared/FormInput";
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
import { useVerifyEmailForm } from "@/hooks/useVerifyEmailForm";

export default function VerifyEmailPage() {
  const {
    register,
    errors,
    loading,
    isSubmitting,
    isResending,
    countdown,
    successMessage,
    code,
    setCode,
    onSubmit,
    resendCode,
  } = useVerifyEmailForm();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <ShieldCheck className="size-6" />
          </div>

          <div className="space-y-2">
            <CardTitle className="font-heading text-2xl">Verifikasi email</CardTitle>

            <CardDescription className="leading-6">
              Masukkan kode verifikasi yang dikirim ke email akunmu. Kode ini digunakan untuk
              mengaktifkan akun sebelum login.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form noValidate className="space-y-5" onSubmit={onSubmit}>
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
              id="verify-email"
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Kode verifikasi</label>

              <OtpInput
                length={6}
                value={code}
                onChange={setCode}
                disabled={loading}
                error={errors.code?.message}
              />
            </div>

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
                "Verifikasi email"
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
              onClick={resendCode}
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