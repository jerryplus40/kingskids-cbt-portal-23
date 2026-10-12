import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useGradeScale } from './queries';
import { validateScale, type GradeBandDraft as Draft } from './grades';

export function GradeScaleEditor() {
  const queryClient = useQueryClient();
  const { data } = useGradeScale();
  const [bands, setBands] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) setBands(data);
  }, [data]);

  const set = (index: number, patch: Partial<Draft>) => setBands((b) => b.map((band, i) => (i === index ? { ...band, ...patch } : band)));

  const save = async () => {
    const problem = validateScale(bands);
    if (problem) return toast.error(problem);
    setSaving(true);
    // Replace the whole scale so removed bands disappear
    const removed = (data ?? []).filter((d) => !bands.some((b) => b.id === d.id)).map((d) => d.id);
    if (removed.length) await supabase.from('grade_scales').delete().in('id', removed);
    const { error } = await supabase.from('grade_scales').upsert(
      bands.map((b) => ({ ...(b.id ? { id: b.id } : {}), min_score: Number(b.min_score), max_score: Number(b.max_score), grade: b.grade.trim(), remark: b.remark.trim() })),
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Grade scale saved');
    queryClient.invalidateQueries({ queryKey: ['grade_scales'] });
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-base">Grade scale</CardTitle>
        <CardDescription>Bands must cover 0 to 100. Write the upper end as 74.99 when the next band starts at 75.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-[80px_80px_80px_1fr_40px] gap-2 text-xs font-medium text-muted-foreground">
          <span>From</span><span>To</span><span>Grade</span><span>Remark</span><span />
        </div>
        {bands.map((b, i) => (
          <div key={b.id ?? i} className="grid grid-cols-[80px_80px_80px_1fr_40px] gap-2">
            <Input type="number" step={0.01} value={b.min_score} onChange={(e) => set(i, { min_score: Number(e.target.value) })} aria-label="From" />
            <Input type="number" step={0.01} value={b.max_score} onChange={(e) => set(i, { max_score: Number(e.target.value) })} aria-label="To" />
            <Input value={b.grade} onChange={(e) => set(i, { grade: e.target.value })} aria-label="Grade" />
            <Input value={b.remark} onChange={(e) => set(i, { remark: e.target.value })} aria-label="Remark" />
            <Button variant="ghost" size="icon" onClick={() => setBands(bands.filter((_, j) => j !== i))} aria-label="Remove band"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setBands([...bands, { min_score: 0, max_score: 0, grade: '', remark: '' }])}><Plus className="mr-2 h-4 w-4" />Add band</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save grade scale'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
