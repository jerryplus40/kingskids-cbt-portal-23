import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { supabase, unwrap } from '@/lib/supabase';
import { fullName, type Profile } from '@/types/db';
import { ReportCardViewer } from '@/features/results/ReportCardViewer';
import { formatDateTime } from '@/features/exams/types';

interface ExamResult {
  exam_id: string;
  title: string;
  subject: string | null;
  submitted_at: string;
  score: number;
  max_score: number;
}

export default function ChildPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const child = useQuery({
    queryKey: ['child', studentId],
    queryFn: async () =>
      unwrap(
        await supabase.from('students').select('admission_no, class:classes(name), profile:profiles!students_id_fkey(first_name, last_name, other_name)').eq('id', studentId!).single(),
      ) as unknown as { admission_no: string; class: { name: string } | null; profile: Profile },
  });
  const results = useQuery({
    queryKey: ['child_exam_results', studentId],
    queryFn: async () => unwrap(await supabase.rpc('child_exam_results', { p_student_id: studentId })) as ExamResult[],
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/parent"><ArrowLeft className="mr-2 h-4 w-4" />My children</Link></Button>
      <PageHeader
        title={child.data ? fullName(child.data.profile) : ''}
        description={child.data ? `${child.data.admission_no}${child.data.class ? ` · ${child.data.class.name}` : ''}` : undefined}
      />
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Report cards</TabsTrigger>
          <TabsTrigger value="tests">Test and exam results</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-4"><ReportCardViewer studentId={studentId} /></TabsContent>
        <TabsContent value="tests" className="mt-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Taken</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.data?.map((r) => (
                  <TableRow key={r.exam_id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{formatDateTime(r.submitted_at)}</TableCell>
                    <TableCell className="text-right">
                      {Number(r.score)} / {Number(r.max_score)} ({Math.round((Number(r.score) / Number(r.max_score)) * 100)}%)
                    </TableCell>
                  </TableRow>
                ))}
                {results.data?.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No released results yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
