import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
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
import { forgotPasswordSchema } from "@/schemas/authSchema";
import { forgotPassword } from "@/services/authApi";

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Permintaan reset password gagal. Silakan coba kembali.";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleForgotPasswordSubmit = async ({ email }) => {
    try {
      const result = await forgotPassword(email);

      navigate("/forgot-password/verify", {
        state: {
          email,
          message: result?.message || "Kode reset password telah dikirim.",
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
          <CardTitle className="font-heading text-2xl">Lupa password?</CardTitle>

          <CardDescription className="leading-6">
            Masukkan email akunmu. Jika email terdaftar, kode reset password akan dikirim ke email
            tersebut.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            noValidate
            className="space-y-5"
            onSubmit={handleSubmit(handleForgotPasswordSubmit)}
          >
            {errors.root?.server && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {errors.root.server.message}
              </div>
            )}

            <FormInput
              id="forgot-password-email"
              label="Email"
              type="email"
              required
              icon={Mail}
              autoComplete="email"
              placeholder="nama@email.com"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Mengirim kode...
                </>
              ) : (
                "Kirim kode reset"
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

