import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichText } from '@/components/RichText';
import { useSubjects } from '@/hooks/useReferenceData';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import { hasMathErrors } from '@/lib/richtext';
import { saveQuestion, usePassages } from './queries';
import { OPTION_LABELS, type Difficulty, type OptionLabel, type Question, type QuestionType } from './types';

const NONE = '__none__';
const NEW_PASSAGE = '__new__';

interface Draft {
  subject_id: string;
  class_level: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  body: string;
  image_url: string | null;
  passage_id: string;
  marks: number;
  explanation: string;
  options: Record<OptionLabel, { body: string; image_url: string | null }>;
  answer: OptionLabel | '';
}

const blankOptions = () =>
  Object.fromEntries(OPTION_LABELS.map((l) => [l, { body: '', image_url: null }])) as Draft['options'];

function toDraft(question: Question | null, defaults: Partial<Draft>): Draft {
  if (!question) {
    return {
      subject_id: '', class_level: '', topic: '', difficulty: 'medium', type: 'mcq', body: '', image_url: null,
      passage_id: '', marks: 1, explanation: '', options: blankOptions(), answer: '', ...defaults,
    };
  }
  const options = blankOptions();
  for (const o of question.options) options[o.label] = { body: o.body, image_url: o.image_url };
  return {
    subject_id: question.subject_id,
    class_level: question.class_level ?? '',
    topic: question.topic ?? '',
    difficulty: question.difficulty,
    type: question.type,
    body: question.body,
    image_url: question.image_url,
    passage_id: question.passage_id ?? '',
    marks: Number(question.marks),
    explanation: question.explanation ?? '',
    options,
    answer: question.options.find((o) => o.is_correct)?.label ?? '',
  };
}

function ImageField({ url, onChange, label }: { url: string | null; onChange: (url: string | null) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (file: File) => {
    setUploading(true);
    try {
      onChange(await uploadImage('question-media', file, file.name));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  };
  if (url) {
    return (
      <div className="relative inline-block">
        <img src={url} alt="" className="max-h-32 rounded border" />
        <Button type="button" size="icon" variant="secondary" className="absolute -right-2 -top-2 h-6 w-6" onClick={() => onChange(null)} aria-label={`Remove ${label}`}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline">
      <ImagePlus className="h-3.5 w-3.5" />
      {uploading ? 'Uploading…' : `Add ${label}`}
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
    </label>
  );
}

interface QuestionEditorProps {
  open: boolean;
  question: Question | null;
  defaults?: Partial<Draft>;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

export function QuestionEditor({ open, question, defaults = {}, onClose, onSaved }: QuestionEditorProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit question' : 'New question'}</DialogTitle>
        </DialogHeader>
        {open && <EditorForm question={question} defaults={defaults} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function EditorForm({ question, defaults, onClose, onSaved }: Omit<QuestionEditorProps, 'open'> & { defaults: Partial<Draft> }) {
  const queryClient = useQueryClient();
  const { data: subjects } = useSubjects();
  const [draft, setDraft] = useState<Draft>(() => toDraft(question, defaults));
  const { data: passages } = usePassages(draft.subject_id || undefined);
  const [newPassage, setNewPassage] = useState<{ title: string; body: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setOption = (label: OptionLabel, patch: Partial<Draft['options'][OptionLabel]>) =>
    setDraft((d) => ({ ...d, options: { ...d.options, [label]: { ...d.options[label], ...patch } } }));

  const filled = OPTION_LABELS.filter((l) => draft.options[l].body.trim() || draft.options[l].image_url);
  const passage = passages?.find((p) => p.id === draft.passage_id);

  const save = async () => {
    if (!draft.subject_id) return toast.error('Choose a subject');
    if (!draft.body.trim()) return toast.error('Write the question');
    if (draft.type === 'mcq') {
      if (filled.length < 2) return toast.error('Give at least two options');
      if (!draft.answer || !filled.includes(draft.answer)) return toast.error('Choose the correct option');
    }
    if (!(draft.marks > 0)) return toast.error('Marks must be more than 0');
    setSaving(true);
    try {
      let passageId = draft.passage_id === NEW_PASSAGE ? '' : draft.passage_id;
      if (newPassage) {
        if (!newPassage.body.trim()) throw new Error('Write the passage text');
        const { data, error } = await supabase
          .from('passages')
          .insert({ subject_id: draft.subject_id, title: newPassage.title.trim(), body: newPassage.body.trim() })
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        passageId = data.id;
      }
      const id = await saveQuestion(
        {
          id: question?.id,
          subject_id: draft.subject_id,
          class_level: draft.class_level.trim().toUpperCase().replace(/\s+/g, '') || null,
          topic: draft.topic.trim() || null,
          difficulty: draft.difficulty,
          type: draft.type,
          body: draft.body.trim(),
          image_url: draft.image_url,
          passage_id: passageId || null,
          marks: draft.marks,
          explanation: draft.explanation.trim() || null,
        },
        OPTION_LABELS.map((label) => ({ label, body: draft.options[label].body.trim(), image_url: draft.options[label].image_url, is_correct: label === draft.answer })),
      );
      toast.success(question ? 'Question saved' : 'Question added as a draft');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['passages'] });
      onSaved?.(id);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1 sm:col-span-2">
            <Label>Subject</Label>
            <Select value={draft.subject_id} onValueChange={(v) => setDraft((d) => ({ ...d, subject_id: v, passage_id: '' }))}>
              <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={draft.type} onValueChange={(v) => set('type', v as QuestionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple choice</SelectItem>
                <SelectItem value="theory">Theory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Marks</Label>
            <Input type="number" min={0.5} step={0.5} value={draft.marks} onChange={(e) => set('marks', Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Class level</Label>
            <Input placeholder="JSS1" value={draft.class_level} onChange={(e) => set('class_level', e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Topic</Label>
            <Input placeholder="Fractions" value={draft.topic} onChange={(e) => set('topic', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Difficulty</Label>
            <Select value={draft.difficulty} onValueChange={(v) => set('difficulty', v as Difficulty)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Comprehension passage</Label>
          <Select
            value={newPassage ? NEW_PASSAGE : draft.passage_id || NONE}
            onValueChange={(v) => {
              if (v === NEW_PASSAGE) setNewPassage({ title: '', body: '' });
              else {
                setNewPassage(null);
                set('passage_id', v === NONE ? '' : v);
              }
            }}
            disabled={!draft.subject_id}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {passages?.map((p) => <SelectItem key={p.id} value={p.id}>{p.title || p.body.slice(0, 60)}</SelectItem>)}
              <SelectItem value={NEW_PASSAGE}>New passage…</SelectItem>
            </SelectContent>
          </Select>
          {newPassage && (
            <div className="space-y-2 rounded-md border p-3">
              <Input placeholder="Title (optional)" value={newPassage.title} onChange={(e) => setNewPassage({ ...newPassage, title: e.target.value })} />
              <Textarea rows={5} placeholder="Passage text, shared by several questions" value={newPassage.body} onChange={(e) => setNewPassage({ ...newPassage, body: e.target.value })} />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="body">Question</Label>
          <Textarea id="body" rows={4} value={draft.body} onChange={(e) => set('body', e.target.value)} placeholder="Write maths between dollar signs: $\frac{3}{4}$ of $x^2$" />
          {hasMathErrors(draft.body) && <p className="text-xs text-destructive">Some maths cannot be displayed. Check the parts between $ signs.</p>}
          <ImageField url={draft.image_url} onChange={(url) => set('image_url', url)} label="image" />
        </div>

        {draft.type === 'mcq' && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Options — select the correct one</legend>
            {OPTION_LABELS.map((label) => (
              <div key={label} className="flex items-start gap-2">
                <input
                  type="radio"
                  name="answer"
                  className="mt-3 h-4 w-4"
                  checked={draft.answer === label}
                  onChange={() => set('answer', label)}
                  aria-label={`Option ${label} is correct`}
                />
                <span className="mt-2 w-5 font-semibold">{label}</span>
                <div className="flex-1 space-y-1">
                  <Input
                    value={draft.options[label].body}
                    onChange={(e) => setOption(label, { body: e.target.value })}
                    placeholder={label === 'E' ? 'Optional' : ''}
                    className={draft.answer === label ? 'border-green-600' : undefined}
                  />
                  <ImageField url={draft.options[label].image_url} onChange={(url) => setOption(label, { image_url: url })} label="image" />
                </div>
              </div>
            ))}
          </fieldset>
        )}

        <div className="space-y-1">
          <Label>{draft.type === 'theory' ? 'Marking guide' : 'Explanation'} (shown in review after release)</Label>
          <Textarea rows={2} value={draft.explanation} onChange={(e) => set('explanation', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Preview</p>
        <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm">
          {(passage || newPassage?.body) && (
            <div className="max-h-40 overflow-y-auto rounded bg-background p-2 text-xs">
              <RichText text={newPassage?.body ?? passage?.body ?? ''} />
            </div>
          )}
          <RichText text={draft.body || 'Your question appears here.'} className="leading-relaxed" />
          {draft.image_url && <img src={draft.image_url} alt="" className="max-h-40 rounded" />}
          {draft.type === 'mcq' && (
            <ol className="space-y-1">
              {filled.map((label) => (
                <li key={label} className={`flex gap-2 rounded px-2 py-1 ${draft.answer === label ? 'bg-green-100 text-green-900' : ''}`}>
                  <span className="font-semibold">{label}.</span>
                  <div>
                    <RichText text={draft.options[label].body} as="span" />
                    {draft.options[label].image_url && <img src={draft.options[label].image_url!} alt="" className="mt-1 max-h-20" />}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <DialogFooter className="lg:col-span-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save question'}</Button>
      </DialogFooter>
    </div>
  );
}
