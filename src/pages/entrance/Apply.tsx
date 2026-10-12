import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalisePhone } from '@/lib/login-id';
import { isBackendConfigured } from '@/lib/supabase';
import { useSchoolSettings } from '@/hooks/useReferenceData';
import { apply, naira, startPayment, statusPath, useOpenCycles } from '@/features/entrance/api';

const schema = z.object({
  cycle_id: z.string().min(1, 'Choose the class'),
  first_name: z.string().trim().min(1, 'Required'),
  last_name: z.string().trim().min(1, 'Required'),
  other_name: z.string().trim(),
  gender: z.enum(['', 'male', 'female']),
  date_of_birth: z.string(),
  previous_school: z.string().trim(),
  address: z.string().trim(),
  guardian_name: z.string().trim().min(1, 'Required'),
  guardian_phone: z.string().refine((v) => !!normalisePhone(v), 'Enter a Nigerian mobile number, e.g. 0803 123 4567'),
  guardian_email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please agree to continue' }) }),
  website: z.string(), // honeypot, hidden from people
});
type FormValues = z.infer<typeof schema>;

export default function Apply() {
  const { data: settings } = useSchoolSettings();
  const cycles = useOpenCycles();
  const [done, setDone] = useState<{ application_no: string; token: string; fee_kobo: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cycle_id: '', first_name: '', last_name: '', other_name: '', gender: '', date_of_birth: '', previous_school: '', address: '',
      guardian_name: '', guardian_phone: '', guardian_email: '', consent: false as unknown as true, website: '',
    },
  });
  const { errors, isSubmitting } = form.formState;
  const cycle = cycles.data?.find((c) => c.id === form.watch('cycle_id'));

  const onSubmit = async (values: FormValues) => {
    setError(null);
    if (cycle && cycle.fee_kobo > 0 && !values.guardian_email) {
      form.setError('guardian_email', { message: 'An email is needed for the payment receipt' });
      return;
    }
    try {
      const result = await apply(values);
      setDone(result);
      try {
        localStorage.setItem('kk-last-application', JSON.stringify({ no: result.application_no, token: result.token }));
      } catch {
        // ignore
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const pay = async () => {
    if (!done) return;
    setPaying(true);
    try {
      const { authorization_url } = await startPayment(done.application_no, done.token);
      if (authorization_url) window.location.assign(authorization_url);
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
  };

  const field = (name: keyof FormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...props} {...form.register(name)} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">{settings?.school_name ?? "King's Kids"}</h1>
          <p className="text-muted-foreground">Entrance examination application</p>
        </div>

        {done ? (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <CardTitle>Application received</CardTitle>
              <CardDescription>Keep the application number and link below. You need them to pay and to check progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="font-mono text-3xl font-semibold">{done.application_no}</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={`${window.location.origin}${statusPath(done.application_no, done.token)}`} className="text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy link"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${statusPath(done.application_no, done.token)}`).then(() => toast.success('Link copied'))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {done.fee_kobo > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm">Application fee: <b>{naira(done.fee_kobo)}</b></p>
                  <Button size="lg" className="w-full" onClick={pay} disabled={paying}>{paying ? 'Opening Paystack…' : 'Pay online with Paystack'}</Button>
                  <p className="text-xs text-muted-foreground">Or pay at the school office with your application number.</p>
                </div>
              ) : (
                <p className="text-sm">No fee is due. The school will send exam details to your phone.</p>
              )}
              <Button variant="link" asChild><Link to={statusPath(done.application_no, done.token)}>Check application status</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Apply</CardTitle>
              <CardDescription>
                Already applied? Use the status link you received, or <Link to="/entrance/status" className="text-primary hover:underline">look up your application</Link>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isBackendConfigured && (
                <Alert variant="destructive" className="mb-4"><AlertDescription>Applications are not open yet.</AlertDescription></Alert>
              )}
              {cycles.data?.length === 0 && (
                <Alert className="mb-4"><AlertDescription>Applications are closed at the moment. Please check back later.</AlertDescription></Alert>
              )}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-1">
                  <Label>Class applying for</Label>
                  <Select value={form.watch('cycle_id')} onValueChange={(v) => form.setValue('cycle_id', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      {cycles.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}{c.fee_kobo > 0 && ` · ${naira(c.fee_kobo)}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cycle_id && <p className="text-xs text-destructive">{errors.cycle_id.message}</p>}
                  {cycle?.instructions && <p className="whitespace-pre-wrap rounded bg-muted p-2 text-sm">{cycle.instructions}</p>}
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">The child</legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {field('first_name', 'First name', { autoComplete: 'off' })}
                    {field('other_name', 'Other name')}
                    {field('last_name', 'Surname')}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Gender</Label>
                      <Select value={form.watch('gender')} onValueChange={(v) => form.setValue('gender', v as FormValues['gender'])}>
                        <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {field('date_of_birth', 'Date of birth', { type: 'date' })}
                  </div>
                  {field('previous_school', 'Current or previous school')}
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Parent or guardian</legend>
                  {field('guardian_name', 'Full name')}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field('guardian_phone', 'Phone number', { inputMode: 'tel' })}
                    {field('guardian_email', 'Email', { type: 'email' })}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address">Home address</Label>
                    <Textarea id="address" rows={2} {...form.register('address')} />
                  </div>
                </fieldset>

                <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...form.register('website')} />

                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" {...form.register('consent')} />
                  <span>
                    I am the child's parent or guardian. I agree that the school may use these details to process this application, as
                    described in the <Link to="/privacy" className="text-primary hover:underline" target="_blank">privacy notice</Link>.
                  </span>
                </label>
                {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}

                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !isBackendConfigured}>
                  {isSubmitting ? 'Submitting…' : 'Submit application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
