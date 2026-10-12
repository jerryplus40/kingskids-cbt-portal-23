import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/AuthProvider';
import { supabase, unwrap } from '@/lib/supabase';
import { useMyExams } from '@/features/exams/queries';
import { formatDateTime, windowState } from '@/features/exams/types';
import { STATUS_LABELS, type ApplicantStatus } from '@/features/entrance/api';

export default function CandidateHome() {
  const { profile } = useAuth();
  const exams = useMyExams();
  const application = useQuery({
    queryKey: ['my_application'],
    queryFn: async () => unwrap(await supabase.rpc('my_application')) as { application_no: string; status: ApplicantStatus; cycle: string; decision_note: string | null } | null,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${profile?.first_name}`} description={application.data ? `${application.data.application_no} · ${application.data.cycle}` : undefined} />
      {application.data && (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm">
            <Badge>{STATUS_LABELS[application.data.status]}</Badge>
            {application.data.decision_note && <p>{application.data.decision_note}</p>}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {exams.data?.map((e) => {
          const open = e.in_progress_attempt || (e.status === 'published' && windowState(e) === 'open' && (e.max_attempts === null || e.attempts_used < e.max_attempts));
          return (
            <Card key={e.exam_id}>
              <CardHeader><CardTitle className="text-base">{e.title}</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {e.last_submitted_at
                    ? `Submitted ${formatDateTime(e.last_submitted_at)}`
                    : windowState(e) === 'upcoming'
                      ? `Opens ${formatDateTime(e.opens_at)}`
                      : `${e.duration_minutes} minutes`}
                </span>
                {open && (
                  <Button asChild size="sm"><Link to={`/exam/${e.exam_id}`}><PlayCircle className="mr-1 h-4 w-4" />{e.in_progress_attempt ? 'Continue' : 'Start'}</Link></Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {exams.data?.length === 0 && <p className="text-sm text-muted-foreground">Your entrance examination will appear here when it is scheduled.</p>}
      </div>
    </div>
  );
}
