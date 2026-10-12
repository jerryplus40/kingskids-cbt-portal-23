import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import { HOME_BY_ROLE } from '@/auth/home';
import { supabase } from '@/lib/supabase';
import { AuthPageFrame } from './AuthPageFrame';
import { passwordSchema } from '@/lib/validation';

const schema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'The passwords do not match' });
type FormValues = z.infer<typeof schema>;

export default function ChangePassword() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });
  const forced = profile?.must_change_password;

  const onSubmit = async ({ password }: FormValues) => {
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message.includes('different') ? 'Choose a password you have not used before.' : updateError.message);
      return;
    }
    await supabase.rpc('password_changed');
    await refreshProfile();
    toast.success('Password changed');
    navigate(profile ? HOME_BY_ROLE[profile.role] : '/', { replace: true });
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthPageFrame>
      <Card>
        <CardHeader>
          <CardTitle>{forced ? 'Choose your own password' : 'Change password'}</CardTitle>
          <CardDescription>
            {forced
              ? 'You signed in with a temporary password. Choose a new one to continue.'
              : 'At least 8 characters, with letters and numbers.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...form.register('confirm')} />
              {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              {!forced && (
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthPageFrame>
  );
}
