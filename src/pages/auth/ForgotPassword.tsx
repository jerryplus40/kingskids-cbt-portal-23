import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { AuthPageFrame } from './AuthPageFrame';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'office'>('idle');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = identifier.trim();
    // Students and parents sign in with numbers, so they have no inbox to reset through
    if (!value.includes('@')) {
      setState('office');
      return;
    }
    setState('sending');
    await supabase.auth.resetPasswordForEmail(value.toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
    // Same message whether or not the account exists, so the form cannot be used to find accounts
    setState('sent');
  };

  return (
    <AuthPageFrame>
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Staff can reset by email. Students and parents should contact the school office.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === 'sent' ? (
            <Alert>
              <AlertDescription>If that email belongs to a staff account, a reset link is on its way. Check your inbox and spam folder.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email, admission number or phone</Label>
                <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
              </div>
              {state === 'office' && (
                <Alert>
                  <AlertDescription>
                    Students and parents: ask the school office or your class teacher to reset your password. They will give you a temporary one.
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
          <Link to="/login" className="block text-center text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </AuthPageFrame>
  );
}
