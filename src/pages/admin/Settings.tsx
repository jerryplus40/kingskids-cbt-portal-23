import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/PageHeader';
import { useSchoolSettings } from '@/hooks/useReferenceData';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import type { SchoolSettings } from '@/types/db';

type Editable = Pick<SchoolSettings, 'school_name' | 'address' | 'motto' | 'phone' | 'email' | 'ca_weight' | 'exam_weight'>;

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings } = useSchoolSettings();
  const [values, setValues] = useState<Editable | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && !values) setValues(settings);
  }, [settings, values]);

  if (!values) return null;

  const save = async () => {
    if (values.ca_weight + values.exam_weight !== 100) {
      toast.error('CA and exam weights must add up to 100');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('school_settings')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Settings saved');
    queryClient.invalidateQueries({ queryKey: ['school_settings'] });
  };

  const uploadLogo = async (file: File) => {
    try {
      const url = await uploadImage('branding', file, file.name);
      const { error } = await supabase.from('school_settings').update({ logo_url: url }).eq('id', 1);
      if (error) throw new Error(error.message);
      toast.success('Logo updated');
      queryClient.invalidateQueries({ queryKey: ['school_settings'] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const text = (key: keyof Editable) => ({
    value: (values[key] as string | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues({ ...values, [key]: e.target.value }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="School details printed on report cards, exam slips and login slips." />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">School</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="School logo" className="h-16 w-16 rounded border object-contain" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded border text-xs text-muted-foreground">No logo</div>
            )}
            <div className="space-y-1">
              <Label htmlFor="logo">Logo</Label>
              <Input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              <p className="text-xs text-muted-foreground">PNG or JPG, up to 2 MB.</p>
            </div>
          </div>
          <div className="space-y-1"><Label>School name</Label><Input {...text('school_name')} /></div>
          <div className="space-y-1"><Label>Motto</Label><Input {...text('motto')} /></div>
          <div className="space-y-1"><Label>Address</Label><Textarea rows={2} {...text('address')} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Phone</Label><Input {...text('phone')} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" {...text('email')} /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Score weighting</CardTitle>
          <CardDescription>How continuous assessment and the end-of-term exam combine into the term total.</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-sm grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>CA (%)</Label>
            <Input type="number" min={0} max={100} value={values.ca_weight} onChange={(e) => setValues({ ...values, ca_weight: Number(e.target.value), exam_weight: 100 - Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>Exam (%)</Label>
            <Input type="number" min={0} max={100} value={values.exam_weight} onChange={(e) => setValues({ ...values, exam_weight: Number(e.target.value), ca_weight: 100 - Number(e.target.value) })} />
          </div>
        </CardContent>
      </Card>
      <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
    </div>
  );
}
