import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { supabase, unwrap } from '@/lib/supabase';
import { AnswerScript } from '@/features/exams/AnswerScript';
import type { Review as ReviewData } from '@/features/exams/types';

export default function Review() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const review = useQuery({
    queryKey: ['review', attemptId],
    queryFn: async () => unwrap(await supabase.rpc('review_attempt', { p_attempt_id: attemptId })) as ReviewData,
  });

  if (review.isLoading) return <FullPageSpinner />;
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/student"><ArrowLeft className="mr-2 h-4 w-4" />My exams</Link></Button>
      {review.error ? (
        <p className="text-sm text-destructive">{review.error.message}</p>
      ) : (
        review.data && (
          <>
            <PageHeader title={review.data.exam.title} description={`Score: ${Number(review.data.score)} / ${Number(review.data.max_score)}`} />
            <div className="max-w-3xl"><AnswerScript review={review.data} /></div>
          </>
        )
      )}
    </div>
  );
}
