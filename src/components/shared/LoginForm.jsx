import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema } from '@/schemas/authSchema';
import { useAuth } from '@/context/AuthContext';

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  'Login gagal. Silakan coba kembali.';

export default function LoginForm({ onSwitchToRegister }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (values) => {
    setServerError('');

    try {
      const user = await login({
        email: values.email,
        password: values.password,
      });

      if (!user) {
        throw new Error(
          'Data pengguna tidak ditemukan pada response login.',
        );
      }

      if (user.role === 'admin') {
        navigate('/admin', {
          replace: true,
        });
        return;
      }

      if (user.role === 'kasir') {
        navigate('/kasir', {
          replace: true,
        });
        return;
      }

      throw new Error(
        'Role pengguna tidak dikenali.',
      );
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleLogin)}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="login-email">
          Email
        </Label>

        <Input
          id="login-email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />

        {errors.email && (
          <p className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="login-password">
            Password
          </Label>

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
          <p className="text-sm text-destructive">
            {errors.password.message}
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
        {isSubmitting
          ? 'Memproses login...'
          : 'Masuk'}
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