import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/auth/AuthProvider';
import { useClassSubjects, useClasses, useCurrentTerm, useSubjects } from '@/hooks/useReferenceData';
import { TERM_LABELS } from '@/types/db';

export default function StaffHome() {
  const { profile } = useAuth();
  const { term } = useCurrentTerm();
  const classSubjects = useClassSubjects();
  const classes = useClasses();
  const subjects = useSubjects();
  const mine = classSubjects.data?.filter((cs) => cs.teacher_id === profile?.id) ?? [];
  const className = (id: string) => classes.data?.find((c) => c.id === id)?.name ?? '';
  const subjectName = (id: string) => subjects.data?.find((s) => s.id === id)?.name ?? '';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.first_name}`}
        description={term ? `${term.session.name} · ${TERM_LABELS[term.term]}` : undefined}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Your classes and subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects are assigned to you yet. Ask the administrator to assign them under Classes and subjects.</p>
          ) : (
            <ul className="divide-y text-sm">
              {mine.map((cs) => (
                <li key={cs.id} className="flex justify-between py-2">
                  <span>{subjectName(cs.subject_id)}</span>
                  <span className="text-muted-foreground">{className(cs.class_id)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Go to <Link to="/staff/questions" className="text-primary hover:underline">Question bank</Link> to add questions, then build an exam under <Link to="/staff/exams" className="text-primary hover:underline">Exams</Link>.
      </p>
    </div>
  );
}
