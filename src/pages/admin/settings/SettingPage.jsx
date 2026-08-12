import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from "@/context/AuthContext";
import { changePasswordSchema } from '@/schemas/authSchema';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, role, changePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const userName = user?.name ?? 'User';
  const userEmail = user?.email ?? '—';
  const userRole = role ?? user?.role ?? '—';
  const initial = userName.charAt(0).toUpperCase();

  const handleChangePassword = async (values) => {
    setIsSubmitting(true);

    try {
      const res = await changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });

      toast.success(res?.message ?? 'Password changed successfully');
      form.reset();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[CHANGE PASSWORD ERROR]', error);
      console.error('[CHANGE PASSWORD RESPONSE]', error.response?.data);

      toast.error(error.response?.data?.message ?? 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" />

      {/* Profile */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <UserRound size={20} strokeWidth={2} className="text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">
            {initial}
          </div>

          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">{userName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>

            <span className="mt-3 inline-flex rounded-md bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">
              {userRole}
            </span>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck size={20} strokeWidth={2} className="text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
        </div>

        <form onSubmit={form.handleSubmit(handleChangePassword)} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="oldPassword">Current Password</Label>
            <Input id="oldPassword" type="password" autoComplete="current-password" placeholder="Enter current password" {...form.register('oldPassword')} />

            {form.formState.errors.oldPassword && (
              <p className="text-xs text-destructive">{form.formState.errors.oldPassword.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" placeholder="Enter new password" {...form.register('newPassword')} />

              {form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Confirm new password" {...form.register('confirmPassword')} />

              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-accent text-white hover:bg-accent/90">
              <LockKeyhole size={20} strokeWidth={2} />
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </section>

      {/* About */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <Info size={20} strokeWidth={2} className="text-accent" />
          <h2 className="text-lg font-semibold text-foreground">About</h2>
        </div>

        <dl className="grid max-w-xl grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="font-medium text-muted-foreground">Application</dt>
          <dd className="text-foreground">Artisan Inventory</dd>

          <dt className="font-medium text-muted-foreground">Version</dt>
          <dd className="text-foreground">v1.0.0</dd>

          <dt className="font-medium text-muted-foreground">Developer</dt>
          <dd className="text-foreground">505 KADA Team</dd>
        </dl>
      </section>
    </div>
  );
}