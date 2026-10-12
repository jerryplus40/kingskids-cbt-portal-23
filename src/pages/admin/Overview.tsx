import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { supabase } from '@/lib/supabase';
import { useClassSubjects, useClasses, useCurrentTerm, useSubjects } from '@/hooks/useReferenceData';
import { TERM_LABELS } from '@/types/db';

const countProfiles = async (roles: string[]) => {
  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', roles);
  return count ?? 0;
};

export default function AdminOverview() {
  const { term } = useCurrentTerm();
  const classes = useClasses();
  const subjects = useSubjects();
  const classSubjects = useClassSubjects();
  const counts = useQuery({
    queryKey: ['overview_counts'],
    queryFn: async () => ({
      students: await countProfiles(['student']),
      staff: await countProfiles(['admin', 'exam_officer', 'teacher']),
      parents: await countProfiles(['parent']),
    }),
  });

  const assigned = classSubjects.data?.filter((cs) => cs.teacher_id).length ?? 0;
  const checklist = [
    { done: !!term, label: 'Create the session and set the current term', to: '/admin/academics' },
    { done: (classes.data?.length ?? 0) > 0, label: 'Add classes', to: '/admin/academics' },
    { done: (subjects.data?.length ?? 0) > 0, label: 'Add subjects', to: '/admin/academics' },
    { done: (counts.data?.staff ?? 0) > 1, label: 'Add teachers', to: '/admin/users' },
    { done: assigned > 0, label: 'Assign teachers to class subjects', to: '/admin/academics' },
    { done: (counts.data?.students ?? 0) > 0, label: 'Import students and parents', to: '/admin/users' },
  ];
  const remaining = checklist.filter((c) => !c.done).length;

  const stats = [
    { label: 'Students', value: counts.data?.students },
    { label: 'Staff', value: counts.data?.staff },
    { label: 'Parents', value: counts.data?.parents },
    { label: 'Classes', value: classes.data?.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={term ? `${term.session.name} · ${TERM_LABELS[term.term]}` : 'No current term set'}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold">{s.value ?? '—'}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {remaining > 0 && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Set up the school</CardTitle>
            <CardDescription>{remaining} of {checklist.length} steps left, in this order.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  {item.done ? (
                    <span className="text-muted-foreground line-through">{item.label}</span>
                  ) : (
                    <Link to={item.to} className="text-primary hover:underline">{item.label}</Link>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
