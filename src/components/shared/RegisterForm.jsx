import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterForm } from '@/hooks/useRegisterForm';

export default function RegisterForm({ onSwitchToLogin }) {
  const { register, errors, isSubmitting, serverError, onSubmit } =
    useRegisterForm({ onSwitchToLogin });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="register-name">Nama lengkap</Label>

        <Input
          id="register-name"
          type="text"
          placeholder="Masukkan nama lengkap"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />

        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>

        <Input
          id="register-email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />

        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>

        <Input
          id="register-password"
          type="password"
          placeholder="Buat password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />

        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Konfirmasi password</Label>

        <Input
          id="register-confirm-password"
          type="password"
          placeholder="Ulangi password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />

        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#F97331] text-white hover:bg-[#F97331]/90"
      >
        {isSubmitting ? 'Mendaftarkan akun...' : 'Daftar'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Sudah memiliki akun?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[#F97331] hover:underline"
        >
          Masuk
        </button>
      </p>
    </form>
  );
}