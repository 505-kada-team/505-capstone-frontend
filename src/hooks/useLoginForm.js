// hooks/useLoginForm.js
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { loginSchema } from '@/schemas/authSchema';
import { useAuth } from '@/context/AuthContext';

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  'Login gagal. Silakan coba kembali.';

/**
 * Membungkus logic form login: validasi (Zod), submit ke AuthContext,
 * error handling.
 *
 * Redirect setelah sukses TIDAK dilakukan di sini — itu tanggung jawab
 * useAuthRedirect (dipasang di LoginPage), yang bereaksi terhadap
 * perubahan isAuthenticated. Kalau navigate dipanggil dari dua tempat
 * sekaligus (di sini DAN di useAuthRedirect), keduanya race dan bikin
 * flicker/glitch saat redirect.
 */
export function useLoginForm() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError('');

    try {
      const user = await login(values);

      if (!user) {
        throw new Error('Data pengguna tidak ditemukan pada response login.');
      }
      // Tidak ada navigate() di sini — biarkan useAuthRedirect di
      // LoginPage yang mengambil alih setelah isAuthenticated jadi true.
    } catch (error) {
      // Login gagal karena email belum diverifikasi — arahkan ke
      // verifikasi (ini beda kasus dari redirect sukses di atas, jadi
      // tetap navigate manual di sini karena bukan tugas useAuthRedirect).
      if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setServerError('Email belum diverifikasi.');
        return { redirectToVerify: values.email };
      }

      setServerError(getErrorMessage(error));
    }
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    serverError,
    onSubmit,
  };
}