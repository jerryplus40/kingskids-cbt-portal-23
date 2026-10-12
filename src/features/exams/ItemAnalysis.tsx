import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RichText } from '@/components/RichText';
import { supabase, unwrap } from '@/lib/supabase';
import { itemProblems } from './itemProblems';

interface Item {
  question_id: string;
  body: string;
  type: 'mcq' | 'theory';
  seen: number;
  answered: number;
  correct: number;
  difficulty: number;
  discrimination: number;
  options: { label: string; is_correct: boolean; chosen: number }[];
}

export function ItemAnalysis({ examId }: { examId: string }) {
  const items = useQuery({
    queryKey: ['item_analysis', examId],
    queryFn: async () => unwrap(await supabase.rpc('item_analysis', { p_exam_id: examId })) as Item[],
  });

  if (items.isLoading) return <p className="text-sm text-muted-foreground">Analysing…</p>;
  if (items.error) return <p className="text-sm text-destructive">{items.error.message}</p>;
  const rows = items.data ?? [];
  const flagged = rows.filter((r) => itemProblems(r).length).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Difficulty is the share who answered correctly. Discrimination compares the top and bottom 27% of candidates: above 0.3 is good, below 0.2
        is weak. Flags appear once at least 10 candidates have sat the paper. {flagged > 0 && `${flagged} questions are worth reviewing.`}
      </p>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="text-center">Correct</TableHead>
              <TableHead className="text-center">Discrimination</TableHead>
              <TableHead>Choices</TableHead>
              <TableHead>Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => {
              const problems = itemProblems(item);
              return (
                <TableRow key={item.question_id}>
                  <TableCell className="max-w-sm"><RichText text={item.body} className="line-clamp-2 text-sm" /></TableCell>
                  <TableCell className="text-center">{item.type === 'mcq' ? `${Math.round(Number(item.difficulty) * 100)}%` : '—'}</TableCell>
                  <TableCell className="text-center">{item.type === 'mcq' ? Number(item.discrimination).toFixed(2) : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.options.map((o) => (
                        <span key={o.label} className={`rounded px-1.5 py-0.5 text-xs ${o.is_correct ? 'bg-green-100 font-semibold text-green-900' : 'bg-muted'}`}>
                          {o.label} {o.chosen}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {problems.map((p) => (
                      <div key={p} className="flex items-center gap-1 text-amber-700"><AlertTriangle className="h-3 w-3 shrink-0" />{p}</div>
                    ))}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No submissions yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
