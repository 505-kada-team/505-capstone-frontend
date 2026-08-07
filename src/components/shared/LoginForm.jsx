import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginForm } from '@/hooks/useLoginForm';

export default function LoginForm({ onSwitchToRegister }) {
  const navigate = useNavigate();
  const { register, errors, isSubmitting, serverError, onSubmit } = useLoginForm();

  const handleFormSubmit = async (e) => {
    const result = await submit(e);
    if (result?.redirectToVerify) {
      navigate('/verify-email', { state: { email: result.redirectToVerify } });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>

        <Input
          id="login-email"
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
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="login-password">Password</Label>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm font-medium text-[#F97331] hover:underline"
          >
            Lupa password?
          </button>
        </div>

        <Input
          id="login-password"
          type="password"
          placeholder="Masukkan password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />

        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
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
        {isSubmitting ? 'Memproses login...' : 'Masuk'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Belum memiliki akun?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-[#F97331] hover:underline"
        >
          Daftar sekarang
        </button>
      </p>
    </form>
  );
}