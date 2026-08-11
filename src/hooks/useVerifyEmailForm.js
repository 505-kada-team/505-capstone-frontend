import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { verifyEmailSchema } from '@/schemas/authSchema';
import {
  confirmVerificationEmail,
  sendVerificationEmail,
} from '@/services/authApi';

const RESEND_COOLDOWN = 60;

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallbackMessage;

/**
 * Membungkus seluruh logic halaman verifikasi email: form (Zod), submit
 * konfirmasi kode, resend kode + cooldown, dan redirect ke login setelah
 * sukses.
 *
 * Komponen VerifyEmailPage.jsx tinggal render — tidak menyimpan logic apa pun.
 */
export function useVerifyEmailForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || '';

  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || '',
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      code: '',
    },
  });

  const email = watch('email');
  const code = watch('code');
  const loading = isSubmitting || isResending;

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setCountdown((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root.server');
    setSuccessMessage('');

    try {
      const result = await confirmVerificationEmail(values);

      navigate('/login', {
        replace: true,
        state: {
          message: result?.message || 'Email berhasil diverifikasi. Silakan login.',
        },
      });
    } catch (error) {
      setError('root.server', {
        type: 'server',
        message: getErrorMessage(
          error,
          'Verifikasi email gagal. Silakan periksa kembali kode yang dimasukkan.',
        ),
      });
    }
  });

  const resendCode = async () => {
    clearErrors('root.server');
    setSuccessMessage('');

    const trimmedEmail = email?.trim();

    if (!trimmedEmail) {
      setError('email', {
        type: 'manual',
        message: 'Email wajib diisi sebelum meminta kode baru.',
      });
      return;
    }

    setIsResending(true);

    try {
      const result = await sendVerificationEmail(trimmedEmail);

      setSuccessMessage(result?.message || 'Kode verifikasi baru berhasil dikirim.');
      setCountdown(RESEND_COOLDOWN);
    } catch (error) {
      setError('root.server', {
        type: 'server',
        message: getErrorMessage(
          error,
          'Kode verifikasi gagal dikirim. Silakan coba kembali.',
        ),
      });
    } finally {
      setIsResending(false);
    }
  };

  return {
    register,
    errors,
    loading,
    isSubmitting,
    isResending,
    countdown,
    successMessage,
    code,
    setCode: (value) => setValue('code', value, { shouldValidate: true }),
    onSubmit,
    resendCode,
  };
}