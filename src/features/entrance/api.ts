import { useQuery } from '@tanstack/react-query';
import { invokeFunction, supabase, unwrap } from '@/lib/supabase';

export interface EntranceCycle {
  id: string;
  title: string;
  class_level: string;
  fee_kobo: number;
  opens_at: string | null;
  closes_at: string | null;
  is_open: boolean;
  instructions: string | null;
  exam_id: string | null;
  created_at: string;
}

export type ApplicantStatus = 'submitted' | 'paid' | 'scheduled' | 'admitted' | 'rejected' | 'withdrawn';

export const STATUS_LABELS: Record<ApplicantStatus, string> = {
  submitted: 'Awaiting payment',
  paid: 'Paid, awaiting exam schedule',
  scheduled: 'Scheduled for the exam',
  admitted: 'Offered admission',
  rejected: 'Not offered admission',
  withdrawn: 'Withdrawn',
};

export interface Applicant {
  id: string;
  cycle_id: string;
  application_no: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  previous_school: string | null;
  address: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string | null;
  photo_url: string | null;
  status: ApplicantStatus;
  payment_ref: string | null;
  amount_paid_kobo: number | null;
  paid_at: string | null;
  user_id: string | null;
  score: number | null;
  max_score: number | null;
  decision_note: string | null;
  created_at: string;
}

export interface ApplicationStatus {
  application_no: string;
  name: string;
  status: ApplicantStatus;
  cycle: string;
  fee_kobo: number;
  paid: boolean;
  instructions: string | null;
  exam: { title: string; opens_at: string | null; closes_at: string | null; duration_minutes: number } | null;
  decision: 'admitted' | 'rejected' | null;
}

export const naira = (kobo: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);

export const useOpenCycles = () =>
  useQuery({
    queryKey: ['entrance_cycles', 'open'],
    queryFn: async () =>
      unwrap(await supabase.from('entrance_cycles').select('*').eq('is_open', true).order('class_level')) as EntranceCycle[],
  });

export const fetchStatus = async (applicationNo: string, token: string) =>
  unwrap(await supabase.rpc('application_status', { p_application_no: applicationNo, p_token: token })) as ApplicationStatus | null;

export const apply = (form: Record<string, unknown>) =>
  invokeFunction<{ application_no: string; token: string; fee_kobo: number }>('entrance-apply', form);

export const startPayment = (applicationNo: string, token: string) =>
  invokeFunction<{ authorization_url?: string; paid?: boolean }>('entrance-pay', { application_no: applicationNo, token });

export const verifyPayment = (applicationNo: string, token: string) =>
  invokeFunction<{ paid: boolean }>('entrance-pay', { application_no: applicationNo, token, action: 'verify' });

/** Status links include the secret, so the applicant can return without signing in. */
export const statusPath = (applicationNo: string, token: string) =>
  `/entrance/status?no=${encodeURIComponent(applicationNo)}&token=${encodeURIComponent(token)}`;
