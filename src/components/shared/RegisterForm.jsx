import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterForm } from '@/hooks/useRegisterForm';

export default function RegisterForm({ onSwitchToLogin }) {
  const { register, errors, isSubmitting, serverError, onSubmit } =
    useRegisterForm({ onSwitchToLogin });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label
          htmlFor="register-name"
          className="text-sm font-medium text-foreground"
        >
          Full Name
        </Label>

        <Input
          id="register-name"
          type="text"
          placeholder="Enter your full name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
          className="h-10 rounded-lg border-border bg-background px-3 shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
        />

        {errors.name && (
          <p className="text-xs leading-5 text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label
          htmlFor="register-email"
          className="text-sm font-medium text-foreground"
        >
          Email
        </Label>

        <Input
          id="register-email"
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
        <Label
          htmlFor="register-password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </Label>

        <Input
          id="register-password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
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

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="register-confirm-password"
          className="text-sm font-medium text-foreground"
        >
          Confirm Password
        </Label>

        <Input
          id="register-confirm-password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
          className="h-10 rounded-lg border-border bg-background px-3 shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
        />

        {errors.confirmPassword && (
          <p className="text-xs leading-5 text-destructive">
            {errors.confirmPassword.message}
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
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </Button>

      {/* Switch to Login */}
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-accent transition-colors hover:text-accent/80"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}