import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/auth/AuthProvider';
import { supabase, unwrap } from '@/lib/supabase';
import { fullName, type Profile } from '@/types/db';

interface Child {
  student: { id: string; admission_no: string; profile: Profile; class: { name: string } | null };
}

export default function ParentHome() {
  const { profile } = useAuth();
  const children = useQuery({
    queryKey: ['my_children', profile?.id],
    enabled: !!profile,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('student_guardians')
          .select('student:students(id, admission_no, profile:profiles!students_id_fkey(*), class:classes(name))')
          .eq('guardian_id', profile!.id),
      ) as unknown as Child[],
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${profile?.first_name}`} description="Your children at the school." />
      <div className="grid gap-4 md:grid-cols-2">
        {children.data?.map(({ student }) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="text-base">{fullName(student.profile)}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {student.admission_no}
                {student.class && ` · ${student.class.name}`}
              </span>
              <Button asChild size="sm"><Link to={`/parent/child/${student.id}`}>Results and report cards</Link></Button>
            </CardContent>
          </Card>
        ))}
        {children.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No children are linked to this account. Contact the school office.</p>
        )}
      </div>
    </div>
  );
}
