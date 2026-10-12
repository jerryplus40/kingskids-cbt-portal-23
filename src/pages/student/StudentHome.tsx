import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/auth/AuthProvider';
import { useMyStudent } from '@/hooks/useMyStudent';

export default function StudentHome() {
  const { profile } = useAuth();
  const { data: student } = useMyStudent();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.first_name}`}
        description={student ? `${student.admission_no}${student.class ? ` · ${student.class.name}` : ''}` : undefined}
      />
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">No exams are open for you right now.</CardContent>
      </Card>
    </div>
  );
}
