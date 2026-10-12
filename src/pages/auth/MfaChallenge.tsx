import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/auth/AuthProvider';
import { HOME_BY_ROLE } from '@/auth/home';
import { supabase } from '@/lib/supabase';
import { AuthPageFrame } from './AuthPageFrame';

export default function MfaChallenge() {
  const { session, profile, needsMfa, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session) return <Navigate to="/login" replace />;
  if (!needsMfa && profile) return <Navigate to={from ?? HOME_BY_ROLE[profile.role]} replace />;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((f) => f.status === 'verified');
    if (!factor) {
      setError('No authenticator app is set up for this account.');
      setBusy(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
    setBusy(false);
    if (verifyError) {
      setError('That code is not correct or has expired. Try the current code.');
      return;
    }
    await refreshProfile();
    navigate(from ?? (profile ? HOME_BY_ROLE[profile.role] : '/'), { replace: true });
  };

  return (
    <AuthPageFrame>
      <Card>
        <CardHeader>
          <CardTitle>Two-step sign-in</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Verify'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => signOut()}>
              Use a different account
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthPageFrame>
  );
}
