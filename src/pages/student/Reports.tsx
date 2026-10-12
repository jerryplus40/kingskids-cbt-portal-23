import { PageHeader } from '@/components/PageHeader';
import { ReportCardViewer } from '@/features/results/ReportCardViewer';

export default function Reports() {
  return (
    <div className="space-y-6">
      <PageHeader title="Report cards" description="Your term results once the school releases them." />
      <ReportCardViewer />
    </div>
  );
}
