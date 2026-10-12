import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RichText } from '@/components/RichText';
import { useQuestions } from '@/features/questions/queries';
import type { Question } from '@/features/questions/types';

const ALL = '__all__';

interface AddQuestionsSheetProps {
  open: boolean;
  subjectId: string | null;
  classLevel?: string;
  alreadyIn: Set<string>;
  onClose: () => void;
  onAdd: (questions: Question[]) => Promise<void>;
}

/** Picks approved questions from the bank, filtered by topic, difficulty, type and level. */
export function AddQuestionsSheet({ open, subjectId, classLevel, alreadyIn, onClose, onAdd }: AddQuestionsSheetProps) {
  const questions = useQuestions({ subjectId: subjectId ?? undefined, status: 'approved' });
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [levelOnly, setLevelOnly] = useState(!!classLevel);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const topics = useMemo(() => [...new Set((questions.data ?? []).map((q) => q.topic).filter(Boolean) as string[])].sort(), [questions.data]);
  const shown = (questions.data ?? []).filter(
    (q) =>
      !alreadyIn.has(q.id) &&
      (topic === ALL || q.topic === topic) &&
      (difficulty === ALL || q.difficulty === difficulty) &&
      (type === ALL || q.type === type) &&
      (!levelOnly || !q.class_level || q.class_level === classLevel) &&
      (!search || q.body.toLowerCase().includes(search.toLowerCase())),
  );

  const toggle = (id: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = async () => {
    setAdding(true);
    await onAdd((questions.data ?? []).filter((q) => picked.has(q.id)));
    setAdding(false);
    setPicked(new Set());
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Add questions</SheetTitle>
        </SheetHeader>
        <div className="flex flex-wrap gap-2 py-3">
          <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All topics</SelectItem>
              {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any type</SelectItem>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="theory">Theory</SelectItem>
            </SelectContent>
          </Select>
          {classLevel && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={levelOnly} onChange={(e) => setLevelOnly(e.target.checked)} />
              {classLevel} only
            </label>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{shown.length} available · {picked.size} chosen</span>
          <Button variant="link" size="sm" onClick={() => setPicked(new Set([...picked, ...shown.map((q) => q.id)]))}>Choose all shown</Button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto py-2">
          {questions.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!questions.isLoading && shown.length === 0 && (
            <p className="text-sm text-muted-foreground">No approved questions match. Approve drafts in the question bank first.</p>
          )}
          {shown.map((q) => (
            <label key={q.id} className={`flex cursor-pointer gap-3 rounded-md border p-3 ${picked.has(q.id) ? 'border-primary bg-primary/5' : ''}`}>
              <input type="checkbox" className="mt-1" checked={picked.has(q.id)} onChange={() => toggle(q.id)} />
              <div className="flex-1 space-y-1 text-sm">
                <RichText text={q.body} className="line-clamp-3" />
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{q.type === 'mcq' ? 'MCQ' : 'Theory'}</Badge>
                  {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                  <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                  <Badge variant="outline">{Number(q.marks)} mk</Badge>
                </div>
              </div>
            </label>
          ))}
        </div>
        <SheetFooter>
          <Button onClick={add} disabled={picked.size === 0 || adding}>{adding ? 'Adding…' : `Add ${picked.size} questions`}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
