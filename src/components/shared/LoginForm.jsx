import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginForm } from '@/hooks/useLoginForm';

export default function LoginForm({ onSwitchToRegister }) {
  const navigate = useNavigate();
  const { register, errors, isSubmitting, serverError, onSubmit } = useLoginForm();

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Email */}
      <div className="space-y-1.5">
        <Label
          htmlFor="login-email"
          className="text-sm font-medium text-foreground"
        >
          Email
        </Label>

        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
          className="h-10 rounded-lg border-border bg-background px-3 shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
        />

        {errors.email && (
          <p className="text-xs leading-5 text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <Label
            htmlFor="login-password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </Label>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-medium text-accent transition-colors hover:text-accent/80"
          >
            Forgot password?
          </button>
        </div>

        <Input
          id="login-password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
          className="h-10 rounded-lg border-border bg-background px-3 shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
        />

        {errors.password && (
          <p className="text-xs leading-5 text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Server Error */}
      {serverError && (
        <div
          role="alert"
          className="border-l-2 border-destructive bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive"
        >
          {serverError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full rounded-lg bg-accent font-semibold text-white shadow-sm transition-colors hover:bg-accent/90"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Register */}
      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-accent transition-colors hover:text-accent/80"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}