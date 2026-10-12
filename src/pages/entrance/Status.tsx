import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDateTime } from '@/features/exams/types';
import { STATUS_LABELS, fetchStatus, naira, startPayment, statusPath, verifyPayment } from '@/features/entrance/api';

export default function Status() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const no = params.get('no') ?? '';
  const token = params.get('token') ?? '';
  const [form, setForm] = useState({ no: '', token: '' });
  const [paying, setPaying] = useState(false);

  // Offer the application saved on this device, if any
  useEffect(() => {
    if (no) return;
    try {
      const saved = JSON.parse(localStorage.getItem('kk-last-application') ?? 'null');
      if (saved) setForm({ no: saved.no, token: saved.token });
    } catch {
      // ignore
    }
  }, [no]);

  const status = useQuery({
    queryKey: ['application_status', no, token],
    enabled: !!no && !!token,
    queryFn: () => fetchStatus(no, token),
  });

  // Returning from Paystack: confirm the payment straight away rather than waiting for the webhook
  const reference = params.get('reference') ?? params.get('trxref');
  useEffect(() => {
    if (!reference || !no || !token) return;
    verifyPayment(no, token)
      .then(({ paid }) => {
        if (paid) toast.success('Payment confirmed');
        queryClient.invalidateQueries({ queryKey: ['application_status'] });
      })
      .catch(() => undefined);
  }, [reference, no, token, queryClient]);

  const pay = async () => {
    setPaying(true);
    try {
      const { authorization_url, paid } = await startPayment(no, token);
      if (paid) queryClient.invalidateQueries({ queryKey: ['application_status'] });
      else if (authorization_url) window.location.assign(authorization_url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  const s = status.data;

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-center text-2xl font-semibold">Application status</h1>
        {!no || !token ? (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="space-y-1">
                <Label>Application number</Label>
                <Input placeholder="ENT/2026/0001" value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Access code (from your status link)</Label>
                <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
              </div>
              <Button className="w-full" disabled={!form.no || !form.token} onClick={() => setParams({ no: form.no.trim(), token: form.token.trim() })}>
                Check
              </Button>
              <p className="text-xs text-muted-foreground">Lost your link? Contact the school office with the child's name and your phone number.</p>
            </CardContent>
          </Card>
        ) : status.isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Checking…</p>
        ) : !s ? (
          <Alert variant="destructive">
            <AlertDescription>
              We could not find that application. Check the number and code, or <Link to="/entrance/status" className="underline">try again</Link>.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{s.name}</CardTitle>
              <CardDescription>{s.application_no} · {s.cycle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Badge className={s.status === 'admitted' ? 'bg-green-600 hover:bg-green-600' : undefined} variant={s.status === 'rejected' ? 'destructive' : 'default'}>
                {STATUS_LABELS[s.status]}
              </Badge>
              {s.status === 'submitted' && s.fee_kobo > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <p>Application fee: <b>{naira(s.fee_kobo)}</b></p>
                  <Button className="w-full" onClick={pay} disabled={paying}>{paying ? 'Opening Paystack…' : 'Pay online with Paystack'}</Button>
                  <p className="text-xs text-muted-foreground">Or pay at the school office with the application number.</p>
                </div>
              )}
              {s.status === 'paid' && <p>Payment received. The school will send the exam date and login details to your phone.</p>}
              {s.exam && s.status === 'scheduled' && (
                <div className="space-y-1 rounded-md border p-3">
                  <p className="font-medium">{s.exam.title}</p>
                  {s.exam.opens_at && <p>From {formatDateTime(s.exam.opens_at)}{s.exam.closes_at && ` to ${formatDateTime(s.exam.closes_at)}`}</p>}
                  <p>{s.exam.duration_minutes} minutes. Sign in with the application number and the password sent by SMS.</p>
                  <Button asChild className="mt-2"><Link to="/login">Sign in to take the exam</Link></Button>
                </div>
              )}
              {s.decision === 'admitted' && <p>Congratulations. The school will contact you about the admission letter and next steps.</p>}
              {s.decision === 'rejected' && <p>Thank you for applying. We are unable to offer a place this time.</p>}
              {s.instructions && <p className="whitespace-pre-wrap text-muted-foreground">{s.instructions}</p>}
              <p className="text-xs text-muted-foreground">Bookmark this page: {window.location.origin}{statusPath(s.application_no, token)}</p>
            </CardContent>
          </Card>
        )}
        <p className="text-center text-sm"><Link to="/entrance" className="text-primary hover:underline">New application</Link></p>
      </div>
    </div>
  );
}
