import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RichText } from '@/components/RichText';
import type { Review } from './types';

interface AnswerScriptProps {
  review: Review;
  /** When set, theory answers get mark inputs */
  onMark?: (questionId: string, marks: number, comment: string) => Promise<void>;
}

/** A candidate's answers against the key; used for review by candidates and marking by teachers. */
export function AnswerScript({ review, onMark }: AnswerScriptProps) {
  let number = 0;
  return (
    <div className="space-y-6">
      {review.sections.map((section) => (
        <div key={section.id} className="space-y-4">
          {section.title && <h3 className="font-semibold">{section.title}</h3>}
          {section.questions.map((q) => {
            number++;
            const answer = review.answers[q.id];
            const correctId = review.key[q.id];
            return (
              <div key={q.id} className="space-y-2 border-b pb-4 text-sm">
                {q.passage && (
                  <details className="rounded bg-muted p-2 text-xs">
                    <summary className="cursor-pointer">Passage: {q.passage.title || 'read'}</summary>
                    <RichText text={q.passage.body} className="mt-2" />
                  </details>
                )}
                <div className="flex gap-2">
                  <span className="font-semibold">{number}.</span>
                  <div className="flex-1">
                    <RichText text={q.body} />
                    {q.image_url && <img src={q.image_url} alt="" className="mt-2 max-h-48" />}
                  </div>
                  <span className="whitespace-nowrap text-muted-foreground">
                    {answer?.marks ?? (q.type === 'theory' ? '–' : 0)}/{q.marks}
                  </span>
                </div>
                {q.type === 'mcq' ? (
                  <ul className="space-y-1 pl-6">
                    {q.options.map((o) => {
                      const chosen = answer?.option_id === o.id;
                      const correct = correctId === o.id;
                      return (
                        <li
                          key={o.id}
                          className={`flex items-center gap-2 rounded px-2 py-1 ${correct ? 'bg-green-100 text-green-900' : chosen ? 'bg-red-100 text-red-900' : ''}`}
                        >
                          <span className="font-medium">{o.label}.</span>
                          <RichText text={o.body} as="span" />
                          {chosen && (correct ? <Check className="h-4 w-4" aria-label="Your answer, correct" /> : <X className="h-4 w-4" aria-label="Your answer, wrong" />)}
                          {chosen && <span className="text-xs">(chosen)</span>}
                        </li>
                      );
                    })}
                    {!answer?.option_id && <li className="text-xs text-muted-foreground">Not answered</li>}
                  </ul>
                ) : (
                  <div className="space-y-2 pl-6">
                    <div className="whitespace-pre-wrap rounded border bg-muted/30 p-2">{answer?.text || <span className="text-muted-foreground">No answer</span>}</div>
                    {onMark ? (
                      <MarkInput max={q.marks} initial={answer?.marks ?? null} comment={answer?.comment ?? ''} onSave={(m, c) => onMark(q.id, m, c)} />
                    ) : (
                      answer?.comment && <p className="text-xs"><span className="font-medium">Teacher: </span>{answer.comment}</p>
                    )}
                  </div>
                )}
                {review.explanations[q.id] && (
                  <p className="pl-6 text-xs text-muted-foreground">
                    <span className="font-medium">{q.type === 'theory' ? 'Marking guide' : 'Explanation'}: </span>
                    <RichText text={review.explanations[q.id]} as="span" />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MarkInput({ max, initial, comment, onSave }: { max: number; initial: number | null; comment: string; onSave: (marks: number, comment: string) => Promise<void> }) {
  const [marks, setMarks] = useState(initial === null ? '' : String(initial));
  const [note, setNote] = useState(comment);
  const [saving, setSaving] = useState(false);
  const value = Number(marks);
  const valid = marks !== '' && value >= 0 && value <= max;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input type="number" min={0} max={max} step={0.5} className="h-8 w-20" value={marks} onChange={(e) => setMarks(e.target.value)} aria-label="Marks" />
      <span className="text-muted-foreground">/ {max}</span>
      <Input className="h-8 flex-1" placeholder="Comment (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button
        size="sm"
        disabled={!valid || saving}
        onClick={async () => {
          setSaving(true);
          await onSave(value, note);
          setSaving(false);
        }}
      >
        {saving ? 'Saving…' : initial === null ? 'Save' : 'Update'}
      </Button>
    </div>
  );
}
