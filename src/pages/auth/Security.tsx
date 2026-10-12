import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';

interface Enrolment {
  factorId: string;
  qrCode: string;
  secret: string;
}

/** Lets staff turn on two-step sign-in with an authenticator app (TOTP). */
export default function Security() {
  const queryClient = useQueryClient();
  const factors = useQuery({
    queryKey: ['mfa_factors'],
    queryFn: async () => (await supabase.auth.mfa.listFactors()).data?.totp ?? [],
  });
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const verified = factors.data?.find((f) => f.status === 'verified');

  const start = async () => {
    setError(null);
    // Remove abandoned, unverified attempts first; Supabase refuses duplicates
    for (const f of factors.data ?? []) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error: enrolError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${Date.now()}` });
    if (enrolError || !data) {
      setError(enrolError?.message ?? 'Could not start set-up');
      return;
    }
    setEnrolment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirm = async () => {
    if (!enrolment) return;
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolment.factorId, code });
    if (verifyError) {
      setError('That code is not correct. Check the time on your phone and try the current code.');
      return;
    }
    setEnrolment(null);
    setCode('');
    toast.success('Two-step sign-in is on');
    queryClient.invalidateQueries({ queryKey: ['mfa_factors'] });
  };

  const turnOff = async () => {
    if (!verified) return;
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
    if (removeError) {
      toast.error(removeError.message);
      return;
    }
    toast.success('Two-step sign-in is off');
    queryClient.invalidateQueries({ queryKey: ['mfa_factors'] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Two-step sign-in" description="Protect staff accounts with a code from an authenticator app." />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">{verified ? 'On' : 'Off'}</CardTitle>
          <CardDescription>
            {verified
              ? 'You will be asked for a code from your authenticator app each time you sign in.'
              : 'Recommended for administrators and exam officers. Use Google Authenticator, Microsoft Authenticator or similar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified && !enrolment && (
            <Button variant="outline" onClick={turnOff}>
              Turn off
            </Button>
          )}
          {!verified && !enrolment && <Button onClick={start}>Set up</Button>}
          {enrolment && (
            <div className="space-y-4">
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Open your authenticator app and scan this code.</li>
                <li>Enter the 6-digit code the app shows.</li>
              </ol>
              <img src={enrolment.qrCode} alt="QR code for your authenticator app" className="h-44 w-44 rounded border bg-white p-2" />
              <p className="text-xs text-muted-foreground">
                Can't scan? Enter this key: <code className="break-all">{enrolment.secret}</code>
              </p>
              <div className="flex max-w-xs gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="totp" className="sr-only">Code</Label>
                  <Input id="totp" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
                </div>
                <Button onClick={confirm} disabled={code.length !== 6}>
                  Confirm
                </Button>
              </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
