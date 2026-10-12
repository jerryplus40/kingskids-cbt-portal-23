import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrintArea } from '@/components/PrintArea';
import { usePrint } from '@/hooks/usePrint';
import { TERM_LABELS } from '@/types/db';
import { useMyReportCards, useReportCard } from './queries';
import { ReportCard } from './ReportCard';

/** Released report cards for one student (the signed-in student, or a parent's child). */
export function ReportCardViewer({ studentId }: { studentId?: string }) {
  const listing = useMyReportCards(studentId);
  const [termId, setTermId] = useState('');
  const selected = termId || listing.data?.[0]?.term_id;
  const card = useReportCard(studentId ?? listing.data?.[0]?.student_id, selected);
  const { printing, print } = usePrint();

  if (listing.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!listing.data?.length) return <p className="text-sm text-muted-foreground">No report cards have been released yet.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={selected} onValueChange={setTermId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {listing.data.map((r) => (
              <SelectItem key={r.term_id} value={r.term_id}>{r.session} · {TERM_LABELS[r.term]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={print} disabled={!card.data}><Printer className="mr-2 h-4 w-4" />Print or save PDF</Button>
      </div>
      <div className="overflow-x-auto rounded-md border bg-muted/30 p-2 md:p-4">
        {card.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {card.error && <p className="text-sm text-destructive">{card.error.message}</p>}
        {card.data && <ReportCard data={card.data} />}
      </div>
      {printing && card.data && (
        <PrintArea>
          <ReportCard data={card.data} />
        </PrintArea>
      )}
    </div>
  );
}
