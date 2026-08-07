import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { registerSchema } from '@/schemas/authSchema';
import { register as registerRequest } from '@/services/authApi';

const DUPLICATE_EMAIL_CODES = ['EMAIL_ALREADY_REGISTERED', 'DUPLICATE_FIELD'];

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  'Registrasi gagal. Silakan coba kembali.';

/**
 * Membungkus seluruh logic form registrasi: validasi (Zod), submit ke
 * authApi, error handling (termasuk kasus email sudah terdaftar), dan
 * redirect ke verifikasi email setelah sukses.
 *
 * Komponen RegisterForm.jsx tinggal render — tidak menyimpan logic apa pun.
 */
export function useRegisterForm({ onSwitchToLogin } = {}) {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError('');

    try {
      await registerRequest({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      navigate('/verify-email', {
        replace: true,
        state: { email: values.email },
      });
    } catch (error) {
      const code = error.response?.data?.code;

      // Email sudah terdaftar — arahkan ke tab login, bukan cuma
      // tampilkan pesan error pasif. Dua code karena race condition
      // konkuren bisa muncul sebagai DUPLICATE_FIELD (lihat
      // error.handling.md Finding 5), bukan cuma EMAIL_ALREADY_REGISTERED.
      if (DUPLICATE_EMAIL_CODES.includes(code)) {
        setServerError('Email sudah terdaftar. Silakan masuk.');
        onSwitchToLogin?.();
        return;
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