-- Entrance admissions, item analysis, extra time and personal-data export.

-- ---------------------------------------------------------------------------
-- Entrance admissions
-- ---------------------------------------------------------------------------

create type public.applicant_status as enum ('submitted', 'paid', 'scheduled', 'admitted', 'rejected', 'withdrawn');

-- One admission round for one entry class, e.g. "JSS1 entrance, 2026/2027"
create table public.entrance_cycles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  class_level text not null,                 -- JSS1, SS1 …
  fee_kobo int not null default 0 check (fee_kobo >= 0),
  opens_at timestamptz,
  closes_at timestamptz,
  is_open boolean not null default false,
  instructions text,                         -- shown on the application page (venue, what to bring)
  exam_id uuid references public.exams (id) on delete set null,
  created_at timestamptz not null default now()
);

create sequence public.application_no_seq;

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.entrance_cycles (id) on delete restrict,
  application_no text not null unique,
  -- SHA-256 of the secret the applicant uses to check status and pay; the secret itself is never stored
  access_token_hash text not null,
  first_name text not null,
  last_name text not null,
  other_name text,
  gender text check (gender in ('male', 'female')),
  date_of_birth date,
  previous_school text,
  address text,
  guardian_name text not null,
  guardian_phone text not null,
  guardian_email text,
  photo_url text,
  status public.applicant_status not null default 'submitted',
  payment_ref text unique,
  amount_paid_kobo int,
  paid_at timestamptz,
  user_id uuid references public.profiles (id) on delete set null,   -- candidate account once scheduled
  score numeric(7, 2),
  max_score numeric(7, 2),
  decision_note text,
  consent_at timestamptz not null,           -- guardian agreed to the privacy notice
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applicants_cycle_idx on public.applicants (cycle_id, status);

-- Called by the entrance-apply edge function (service role) with validated input
create function public.next_application_no() returns text
language sql security definer set search_path = public as $$
  select 'ENT/' || to_char(now() at time zone 'Africa/Lagos', 'YYYY') || '/' || lpad(nextval('public.application_no_seq')::text, 4, '0')
$$;
revoke execute on function public.next_application_no() from public, anon, authenticated;

-- Public status check: needs the application number and its secret
create function public.application_status(p_application_no text, p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'application_no', a.application_no,
    'name', trim(a.first_name || ' ' || a.last_name),
    'status', a.status,
    'cycle', c.title,
    'fee_kobo', c.fee_kobo,
    'paid', a.paid_at is not null,
    'instructions', c.instructions,
    'exam', (select jsonb_build_object('title', e.title, 'opens_at', e.opens_at, 'closes_at', e.closes_at, 'duration_minutes', e.duration_minutes)
             from public.exams e where e.id = c.exam_id and a.status in ('scheduled', 'admitted', 'rejected')),
    'decision', case when a.status in ('admitted', 'rejected') then a.status end
  )
  from public.applicants a join public.entrance_cycles c on c.id = a.cycle_id
  where a.application_no = upper(trim(p_application_no))
    and a.access_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;

-- The signed-in candidate's own application
create function public.my_application() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('application_no', a.application_no, 'status', a.status, 'cycle', c.title,
                            'decision_note', case when a.status in ('admitted', 'rejected') then a.decision_note end)
  from public.applicants a join public.entrance_cycles c on c.id = a.cycle_id
  where a.user_id = auth.uid()
$$;

-- Copies entrance exam scores onto applicants so they can be ranked
create function public.refresh_applicant_scores(p_cycle_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if not public.has_perm('entrance.manage') then
    raise exception 'You cannot manage admissions' using errcode = '42501';
  end if;
  perform public.close_expired_attempts((select exam_id from public.entrance_cycles where id = p_cycle_id));
  update public.applicants ap
  set score = best.score, max_score = best.max_score, updated_at = now()
  from (
    select distinct on (a.candidate_id) a.candidate_id, a.score, a.max_score
    from public.attempts a
    where a.exam_id = (select exam_id from public.entrance_cycles where id = p_cycle_id) and a.status = 'submitted'
    order by a.candidate_id, a.score desc
  ) best
  where ap.cycle_id = p_cycle_id and ap.user_id = best.candidate_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create trigger audit after insert or update or delete on public.entrance_cycles for each row execute function public.audit_row();
create trigger audit after update or delete on public.applicants for each row execute function public.audit_row();

alter table public.entrance_cycles enable row level security;
alter table public.applicants enable row level security;

create policy read_open on public.entrance_cycles for select to anon, authenticated using (is_open or public.has_perm('entrance.manage'));
create policy manage on public.entrance_cycles for all to authenticated
  using (public.has_perm('entrance.manage')) with check (public.has_perm('entrance.manage'));

-- Applications arrive through the edge function; staff manage them here
create policy read on public.applicants for select to authenticated using (public.has_perm('entrance.manage'));
create policy manage on public.applicants for update to authenticated
  using (public.has_perm('entrance.manage')) with check (public.has_perm('entrance.manage'));

-- Entrance candidates sit papers through exam_candidates; give them the "applicant" home
-- (exams with no class need explicit candidates, which publish_exam already allows)

-- ---------------------------------------------------------------------------
-- Item analysis
-- ---------------------------------------------------------------------------

-- Per question: how many answered it, the share who got it right (difficulty, p),
-- and discrimination D = p(top 27%) − p(bottom 27%), ranked by total score.
-- p below 0.2 or above 0.9, or D below 0.2, marks a question worth reviewing.
create function public.item_analysis(p_exam_id uuid) returns table (
  question_id uuid, body text, type public.question_type, seen int, answered int,
  correct int, difficulty numeric, discrimination numeric, options jsonb
) language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.can_view_results(p_exam_id) then
    raise exception 'You cannot view this exam''s results' using errcode = '42501';
  end if;
  return query
  with sat as (
    select a.id, a.score, ntile(100) over (order by a.score) as pct
    from public.attempts a where a.exam_id = p_exam_id and a.status = 'submitted'
  ),
  seen as (
    select s.id as attempt_id, s.pct, (q ->> 'question_id')::uuid as question_id
    from sat s join public.attempts a on a.id = s.id,
    jsonb_array_elements(a.layout) sec, jsonb_array_elements(sec -> 'questions') q
  ),
  joined as (
    select sn.question_id, sn.pct, aa.option_id, aa.text_answer, coalesce(aa.is_correct, false) as ok,
           aa.marks_awarded, (aa.attempt_id is not null) as did_answer
    from seen sn left join public.attempt_answers aa on aa.attempt_id = sn.attempt_id and aa.question_id = sn.question_id
  )
  select j.question_id, qq.body, qq.type,
         count(*)::int,
         count(*) filter (where j.did_answer)::int,
         count(*) filter (where j.ok)::int,
         round(avg(j.ok::int), 2),
         round(coalesce(avg(j.ok::int) filter (where j.pct > 73), 0) - coalesce(avg(j.ok::int) filter (where j.pct <= 27), 0), 2),
         (select coalesce(jsonb_agg(jsonb_build_object('label', o.label, 'is_correct', o.is_correct,
                   'chosen', (select count(*) from joined j2 where j2.question_id = j.question_id and j2.option_id = o.id)) order by o.label), '[]')
          from public.question_options o where o.question_id = j.question_id)
  from joined j join public.questions qq on qq.id = j.question_id
  group by j.question_id, qq.body, qq.type
  order by 7 nulls first;
end;
$$;

-- ---------------------------------------------------------------------------
-- Personal data export (Nigeria Data Protection Act: right of access)
-- ---------------------------------------------------------------------------

create function public.export_person_data(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = p_user_id),
    'student', (select to_jsonb(s) from public.students s where s.id = p_user_id),
    'guardians', (select coalesce(jsonb_agg(jsonb_build_object('name', trim(g.first_name || ' ' || g.last_name), 'phone', g.phone, 'email', g.email, 'relationship', sg.relationship)), '[]')
                  from public.student_guardians sg join public.profiles g on g.id = sg.guardian_id where sg.student_id = p_user_id),
    'children', (select coalesce(jsonb_agg(sg.student_id), '[]') from public.student_guardians sg where sg.guardian_id = p_user_id),
    'term_scores', (select coalesce(jsonb_agg(to_jsonb(t) - 'updated_by'), '[]') from public.term_scores t where t.student_id = p_user_id),
    'report_comments', (select coalesce(jsonb_agg(to_jsonb(r) - 'updated_by'), '[]') from public.report_comments r where r.student_id = p_user_id),
    'exam_attempts', (select coalesce(jsonb_agg(jsonb_build_object('exam', e.title, 'started_at', a.started_at, 'submitted_at', a.submitted_at,
                        'score', a.score, 'max_score', a.max_score) order by a.started_at), '[]')
                      from public.attempts a join public.exams e on e.id = a.exam_id where a.candidate_id = p_user_id),
    'application', (select to_jsonb(ap) - 'access_token_hash' from public.applicants ap where ap.user_id = p_user_id)
  )
  where public.has_perm('users.manage') or p_user_id = auth.uid()
$$;
