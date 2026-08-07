import { useRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Input OTP berbentuk kotak-kotak, auto-advance ke kotak berikutnya
 * saat 1 digit diisi, mundur ke kotak sebelumnya saat backspace pada
 * kotak kosong, dan mendukung paste kode penuh sekaligus.
 *
 * Controlled component — dipakai lewat react-hook-form `Controller`,
 * BUKAN lewat `register()` spread biasa (lihat VerifyResetCodePage.jsx).
 *
 * Dipakai bersama di VerifyEmailPage dan VerifyResetCodePage.
 *
 * ⚠️ `length` default 6 — rfc.auth.md menyebut OTP "4–8 digit", belum
 * dikonfirmasi backend benar-benar selalu generate 6 digit. Sesuaikan
 * prop ini kalau ternyata berbeda.
 *
 * Styling ikut DESIGN.md v1: border radius `rounded-md` (disamakan
 * dengan input shadcn lain, bukan `rounded-lg` default karena ini
 * elemen input bukan container/card), focus ring `ring-orange-500/40`
 * persis Section 5. Font digit sengaja BUKAN JetBrains Mono — mono
 * di DESIGN.md khusus untuk kolom angka di tabel, bukan input.
 */
export default function OtpInput({
  value = '',
  onChange,
  length = 6,
  disabled = false,
  error,
  autoFocus = false,
}) {
  const inputsRef = useRef([]);
  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  const emitChange = (nextDigits) => {
    onChange?.(nextDigits.join('').replace(/ /g, ''));
  };

  const focusInput = (index) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (index, rawValue) => {
    const char = rawValue.replace(/\D/g, '').slice(-1);

    const nextDigits = [...digits];
    nextDigits[index] = char || ' ';
    emitChange(nextDigits);

    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index].trim() && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);

    if (!pasted) return;

    const nextDigits = pasted
      .padEnd(length, ' ')
      .split('')
      .slice(0, length);

    emitChange(nextDigits);
    focusInput(Math.min(pasted.length, length - 1));
  };

  return (
    <div>
      <div className="flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoFocus={autoFocus && index === 0}
            disabled={disabled}
            value={digit.trim()}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            aria-invalid={Boolean(error)}
            className={cn(
              'h-14 w-12 rounded-md border border-input bg-background text-center text-lg font-semibold text-foreground',
              'transition-colors focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/40',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
