import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/auth/AuthProvider';

export default function CandidateHome() {
  const { profile } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${profile?.first_name}`} description="Your entrance examination will appear here when it opens." />
    </div>
  );
}
