import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/auth/AuthProvider';
import { HOME_BY_ROLE } from '@/auth/home';
import { isBackendConfigured } from '@/lib/supabase';
import { AuthPageFrame } from './AuthPageFrame';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email, admission number or phone number'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { session, profile, needsMfa, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '' } });
  const from = (location.state as { from?: string } | null)?.from;

  if (session && profile && !needsMfa) return <Navigate to={from ?? HOME_BY_ROLE[profile.role]} replace />;

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const result = await signIn(values.identifier, values.password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.needsMfa) navigate('/mfa', { replace: true, state: { from } });
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthPageFrame>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Staff use their email. Students use their admission number. Parents use their phone number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isBackendConfigured && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>The portal is not connected to its server yet. Sign-in is unavailable.</AlertDescription>
            </Alert>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email, admission number or phone</Label>
              <Input id="identifier" autoComplete="username" autoFocus {...form.register('identifier')} aria-invalid={!!errors.identifier} />
              {errors.identifier && <p className="text-sm text-destructive">{errors.identifier.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-10"
                  {...form.register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting || !isBackendConfigured}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Applying to the school? <Link to="/entrance" className="text-primary hover:underline">Start an entrance application</Link>
      </p>
    </AuthPageFrame>
  );
}
