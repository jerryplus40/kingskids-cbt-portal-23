-- Term results: CA and exam scores per subject, grades, positions, report cards, release and notifications.

create table public.grade_scales (
  id uuid primary key default gen_random_uuid(),
  min_score numeric(5, 2) not null check (min_score between 0 and 100),
  max_score numeric(5, 2) not null check (max_score between 0 and 100),
  grade text not null,
  remark text not null default '',
  check (max_score >= min_score)
);

-- WAEC-style default; the school can edit it in Settings
insert into public.grade_scales (min_score, max_score, grade, remark) values
  (75, 100, 'A1', 'Excellent'),
  (70, 74.99, 'B2', 'Very good'),
  (65, 69.99, 'B3', 'Good'),
  (60, 64.99, 'C4', 'Credit'),
  (55, 59.99, 'C5', 'Credit'),
  (50, 54.99, 'C6', 'Credit'),
  (45, 49.99, 'D7', 'Pass'),
  (40, 44.99, 'E8', 'Pass'),
  (0, 39.99, 'F9', 'Fail');

create function public.grade_for(p_score numeric) returns table (grade text, remark text)
language sql stable security definer set search_path = public as $$
  select g.grade, g.remark from public.grade_scales g
  where round(p_score, 2) between g.min_score and g.max_score
  order by g.min_score desc limit 1
$$;

-- Scores are out of the weights in school_settings (e.g. CA /40, exam /60)
create table public.term_scores (
  student_id uuid not null references public.students (id) on delete cascade,
  term_id uuid not null references public.terms (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,  -- the class at the time, for positions
  ca_score numeric(5, 2) check (ca_score >= 0),
  exam_score numeric(5, 2) check (exam_score >= 0),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (student_id, term_id, subject_id)
);
create index term_scores_class_idx on public.term_scores (term_id, class_id);

create function public.check_score_limits() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_ca int;
  v_exam int;
begin
  select ca_weight, exam_weight into v_ca, v_exam from public.school_settings where id = 1;
  if new.ca_score > v_ca then raise exception 'CA score cannot be more than %', v_ca using errcode = '22023'; end if;
  if new.exam_score > v_exam then raise exception 'Exam score cannot be more than %', v_exam using errcode = '22023'; end if;
  new.class_id := coalesce(new.class_id, (select class_id from public.students where id = new.student_id));
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  -- Released results are final unless an administrator reopens them
  if exists (select 1 from public.result_releases r where r.term_id = new.term_id and r.class_id = new.class_id)
     and not public.has_perm('results.release') then
    raise exception 'Results for this class have been released; ask an administrator to reopen them' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create table public.report_comments (
  student_id uuid not null references public.students (id) on delete cascade,
  term_id uuid not null references public.terms (id) on delete cascade,
  class_teacher_comment text,
  principal_comment text,
  days_present int check (days_present >= 0),
  days_open int check (days_open >= 0),
  -- Affective and psychomotor ratings, 1–5: { "Punctuality": 4, "Neatness": 5, ... }
  traits jsonb not null default '{}',
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (student_id, term_id)
);

create table public.result_releases (
  term_id uuid not null references public.terms (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  released_at timestamptz not null default now(),
  released_by uuid references public.profiles (id) on delete set null default auth.uid(),
  primary key (term_id, class_id)
);

create trigger score_limits before insert or update on public.term_scores for each row execute function public.check_score_limits();

-- Term information printed on report cards
alter table public.terms add column next_term_begins date;

create function public.is_released(p_term_id uuid, p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.result_releases where term_id = p_term_id and class_id = p_class_id)
$$;

create function public.is_class_teacher(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = p_class_id and class_teacher_id = auth.uid())
$$;

-- Who may enter scores for a student in a subject
create function public.can_enter_score(p_student_id uuid, p_subject_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_perm('scores.all')
      or (public.has_perm('scores.enter') and public.teaches((select class_id from public.students where id = p_student_id), p_subject_id))
$$;

-- ---------------------------------------------------------------------------
-- Pull CBT results into term scores
-- ---------------------------------------------------------------------------

-- For one class and subject in a term: exam score = the "term exam" CBT scaled to the exam
-- weight; CA = the average of "CA" CBT tests scaled to the CA weight. Only fills scores
-- that have a CBT source, and overwrites earlier pulled values.
create function public.pull_cbt_scores(p_term_id uuid, p_class_id uuid, p_subject_id uuid, p_parts text[] default array['ca', 'exam'])
returns int language plpgsql security definer set search_path = public as $$
declare
  v_ca int;
  v_exam int;
  v_count int;
begin
  if not (public.has_perm('scores.all') or (public.has_perm('scores.enter') and public.teaches(p_class_id, p_subject_id))) then
    raise exception 'You cannot enter scores for this class and subject' using errcode = '42501';
  end if;
  select ca_weight, exam_weight into v_ca, v_exam from public.school_settings where id = 1;

  with best as (
    -- Each student's best submitted attempt per exam
    select a.candidate_id, e.counts_as, e.id as exam_id, max(a.score / nullif(a.max_score, 0)) as fraction
    from public.exams e
    join public.attempts a on a.exam_id = e.id and a.status = 'submitted'
    where e.term_id = p_term_id and e.class_id = p_class_id and e.subject_id = p_subject_id
      and e.counts_as = any (p_parts)
    group by a.candidate_id, e.counts_as, e.id
  ),
  per_student as (
    select s.id as student_id,
      round(avg(b.fraction) filter (where b.counts_as = 'ca') * v_ca, 2) as ca,
      round(avg(b.fraction) filter (where b.counts_as = 'exam') * v_exam, 2) as exam
    from public.students s
    join best b on b.candidate_id = s.id
    where s.class_id = p_class_id
    group by s.id
  )
  insert into public.term_scores (student_id, term_id, subject_id, class_id, ca_score, exam_score)
  select student_id, p_term_id, p_subject_id, p_class_id, ca, exam from per_student
  on conflict (student_id, term_id, subject_id) do update
  set ca_score = coalesce(excluded.ca_score, public.term_scores.ca_score),
      exam_score = coalesce(excluded.exam_score, public.term_scores.exam_score);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Broadsheet and report card
-- ---------------------------------------------------------------------------

-- Every score in a class for a term, with grade and subject position (1, 2, 2, 4 for ties)
create function public.class_broadsheet(p_term_id uuid, p_class_id uuid) returns table (
  student_id uuid, student_name text, admission_no text, subject_id uuid, subject text,
  ca_score numeric, exam_score numeric, total numeric, grade text, remark text,
  subject_position int, subject_average numeric, subject_highest numeric, subject_lowest numeric
) language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not (public.has_perm('results.view_all') or public.is_class_teacher(p_class_id) or public.has_perm('scores.all')
          or exists (select 1 from public.class_subjects cs where cs.class_id = p_class_id and cs.teacher_id = auth.uid())) then
    raise exception 'You cannot view results for this class' using errcode = '42501';
  end if;
  return query
  with scored as (
    select ts.student_id, ts.subject_id, ts.ca_score, ts.exam_score,
           coalesce(ts.ca_score, 0) + coalesce(ts.exam_score, 0) as total
    from public.term_scores ts
    where ts.term_id = p_term_id and ts.class_id = p_class_id
      and (ts.ca_score is not null or ts.exam_score is not null)
  )
  select sc.student_id, trim(p.last_name || ' ' || p.first_name || coalesce(' ' || p.other_name, '')), st.admission_no,
         sc.subject_id, sub.name, sc.ca_score, sc.exam_score, sc.total, g.grade, g.remark,
         (rank() over (partition by sc.subject_id order by sc.total desc))::int,
         round(avg(sc.total) over (partition by sc.subject_id), 2),
         max(sc.total) over (partition by sc.subject_id),
         min(sc.total) over (partition by sc.subject_id)
  from scored sc
  join public.students st on st.id = sc.student_id
  join public.profiles p on p.id = sc.student_id
  join public.subjects sub on sub.id = sc.subject_id
  left join lateral public.grade_for(sc.total) g on true
  order by p.last_name, p.first_name, sub.name;
end;
$$;

-- Overall positions in a class: average across the subjects each student took
create function public.class_positions(p_term_id uuid, p_class_id uuid) returns table (
  student_id uuid, subjects int, grand_total numeric, average numeric, "position" int, class_size int
) language sql stable security definer set search_path = public as $$
  with totals as (
    select ts.student_id, count(*)::int as subjects,
           sum(coalesce(ts.ca_score, 0) + coalesce(ts.exam_score, 0)) as grand_total,
           round(avg(coalesce(ts.ca_score, 0) + coalesce(ts.exam_score, 0)), 2) as average
    from public.term_scores ts
    where ts.term_id = p_term_id and ts.class_id = p_class_id
      and (ts.ca_score is not null or ts.exam_score is not null)
    group by ts.student_id
  )
  select t.student_id, t.subjects, t.grand_total, t.average,
         (rank() over (order by t.average desc))::int,
         (count(*) over ())::int
  from totals t
$$;
revoke execute on function public.class_positions(uuid, uuid) from public, anon, authenticated;

create function public.report_card(p_student_id uuid, p_term_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_class_id uuid;
  v_released boolean;
  v_staff boolean;
begin
  select coalesce(
    (select class_id from public.term_scores where student_id = p_student_id and term_id = p_term_id and class_id is not null limit 1),
    (select class_id from public.students where id = p_student_id)
  ) into v_class_id;
  v_released := public.is_released(p_term_id, v_class_id);
  v_staff := public.has_perm('results.view_all') or public.is_class_teacher(v_class_id) or public.has_perm('scores.all');

  if not (v_staff or ((p_student_id = auth.uid() or public.is_guardian_of(p_student_id)) and v_released)) then
    raise exception 'This report card is not available yet' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'released', v_released,
    'school', (select to_jsonb(s) - 'id' - 'current_term_id' from public.school_settings s where id = 1),
    'term', (
      select jsonb_build_object('id', t.id, 'term', t.term, 'session', se.name, 'starts_on', t.starts_on, 'ends_on', t.ends_on, 'next_term_begins', t.next_term_begins)
      from public.terms t join public.sessions se on se.id = t.session_id where t.id = p_term_id
    ),
    'student', (
      select jsonb_build_object('id', st.id, 'name', trim(p.last_name || ' ' || p.first_name || coalesce(' ' || p.other_name, '')),
        'admission_no', st.admission_no, 'gender', st.gender, 'date_of_birth', st.date_of_birth, 'photo_url', p.photo_url)
      from public.students st join public.profiles p on p.id = st.id where st.id = p_student_id
    ),
    'class', (
      select jsonb_build_object('id', c.id, 'name', c.name,
        'class_teacher', (select trim(p.first_name || ' ' || p.last_name) from public.profiles p where p.id = c.class_teacher_id))
      from public.classes c where c.id = v_class_id
    ),
    'subjects', (
      with scored as (
        select ts.student_id, ts.subject_id, ts.ca_score, ts.exam_score, coalesce(ts.ca_score, 0) + coalesce(ts.exam_score, 0) as total
        from public.term_scores ts
        where ts.term_id = p_term_id and ts.class_id = v_class_id and (ts.ca_score is not null or ts.exam_score is not null)
      ),
      ranked as (
        select sc.*, rank() over (partition by sc.subject_id order by sc.total desc) as position,
               count(*) over (partition by sc.subject_id) as out_of,
               round(avg(sc.total) over (partition by sc.subject_id), 2) as class_average,
               max(sc.total) over (partition by sc.subject_id) as highest,
               min(sc.total) over (partition by sc.subject_id) as lowest
        from scored sc
      )
      select coalesce(jsonb_agg(jsonb_build_object(
        'subject', sub.name, 'ca', r.ca_score, 'exam', r.exam_score, 'total', r.total, 'grade', g.grade, 'remark', g.remark,
        'position', r.position, 'out_of', r.out_of, 'class_average', r.class_average, 'highest', r.highest, 'lowest', r.lowest,
        'teacher', (select trim(tp.first_name || ' ' || tp.last_name) from public.class_subjects cs join public.profiles tp on tp.id = cs.teacher_id
                    where cs.class_id = v_class_id and cs.subject_id = r.subject_id)
      ) order by sub.name), '[]')
      from ranked r
      join public.subjects sub on sub.id = r.subject_id
      left join lateral public.grade_for(r.total) g on true
      where r.student_id = p_student_id
    ),
    'overall', (
      select to_jsonb(cp) || jsonb_build_object('grade', (select grade from public.grade_for(cp.average)))
      from public.class_positions(p_term_id, v_class_id) cp where cp.student_id = p_student_id
    ),
    'comments', (select to_jsonb(rc) - 'student_id' - 'term_id' - 'updated_by' from public.report_comments rc where rc.student_id = p_student_id and rc.term_id = p_term_id),
    'grade_scale', (select coalesce(jsonb_agg(jsonb_build_object('grade', grade, 'min', min_score, 'max', max_score, 'remark', remark) order by min_score desc), '[]') from public.grade_scales)
  );
end;
$$;

-- Report cards a student or parent can open: released terms only
create function public.my_report_cards(p_student_id uuid default null) returns table (
  student_id uuid, term_id uuid, term int, session text, released_at timestamptz
) language sql stable security definer set search_path = public as $$
  select st.id, t.id, t.term, se.name, r.released_at
  from public.students st
  join public.result_releases r on r.class_id in (
    select distinct ts.class_id from public.term_scores ts where ts.student_id = st.id and ts.term_id = r.term_id
    union select st.class_id
  )
  join public.terms t on t.id = r.term_id
  join public.sessions se on se.id = t.session_id
  where st.id = coalesce(p_student_id, auth.uid())
    and (st.id = auth.uid() or public.is_guardian_of(st.id))
    and exists (select 1 from public.term_scores ts where ts.student_id = st.id and ts.term_id = t.id)
  order by se.name desc, t.term desc
$$;

-- A parent's view of a child's CBT results (released ones only)
create function public.child_exam_results(p_student_id uuid) returns table (
  exam_id uuid, title text, subject text, kind public.exam_kind, submitted_at timestamptz, score numeric, max_score numeric
) language sql stable security definer set search_path = public as $$
  select e.id, e.title, sub.name, e.kind, a.submitted_at, a.score, a.max_score
  from public.attempts a
  join public.exams e on e.id = a.exam_id
  left join public.subjects sub on sub.id = e.subject_id
  where a.candidate_id = p_student_id and a.status = 'submitted' and e.results_released
    and (p_student_id = auth.uid() or public.is_guardian_of(p_student_id))
  order by a.submitted_at desc
$$;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Messages waiting for the send-notifications edge function (SMS to parents, email to staff)
create table public.message_outbox (
  id bigint generated always as identity primary key,
  channel text not null check (channel in ('sms', 'email')),
  recipient text not null,
  subject text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index message_outbox_pending_idx on public.message_outbox (created_at) where status = 'pending';

-- Notifies a student and their parents, in the app and by SMS to parents
create function public.notify_student_and_guardians(p_student_id uuid, p_title text, p_body text, p_link_student text, p_link_parent text, p_sms text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, title, body, link) values (p_student_id, p_title, p_body, p_link_student);
  insert into public.notifications (user_id, title, body, link)
  select sg.guardian_id, p_title, p_body, p_link_parent from public.student_guardians sg where sg.student_id = p_student_id;
  if p_sms is not null then
    insert into public.message_outbox (channel, recipient, body)
    select 'sms', p.phone, p_sms
    from public.student_guardians sg join public.profiles p on p.id = sg.guardian_id
    where sg.student_id = p_student_id and p.phone is not null and p.is_active;
  end if;
end;
$$;
revoke execute on function public.notify_student_and_guardians(uuid, text, text, text, text, text) from public, anon, authenticated;

create function public.on_exam_results_released() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_candidate uuid;
begin
  if new.results_released and not old.results_released then
    for v_candidate in select distinct candidate_id from public.attempts where exam_id = new.id and status = 'submitted' loop
      perform public.notify_student_and_guardians(
        v_candidate, 'Result released', new.title || ': your result is now available.', '/student', '/parent', null);
    end loop;
  end if;
  return new;
end;
$$;
create trigger notify_release after update of results_released on public.exams for each row execute function public.on_exam_results_released();

create function public.on_term_results_released() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_student record;
  v_term text;
  v_school text;
begin
  select case t.term when 1 then 'First' when 2 then 'Second' else 'Third' end || ' term ' || se.name into v_term
  from public.terms t join public.sessions se on se.id = t.session_id where t.id = new.term_id;
  select school_name into v_school from public.school_settings where id = 1;
  for v_student in
    select distinct ts.student_id, p.first_name
    from public.term_scores ts join public.profiles p on p.id = ts.student_id
    where ts.term_id = new.term_id and ts.class_id = new.class_id
  loop
    perform public.notify_student_and_guardians(
      v_student.student_id, 'Report card ready', v_term || ' report card is available.', '/student/reports', '/parent',
      v_school || ': ' || v_student.first_name || '''s ' || v_term || ' report card is ready. Sign in to the CBT portal to view it.');
  end loop;
  return new;
end;
$$;
create trigger notify_release after insert on public.result_releases for each row execute function public.on_term_results_released();

-- ---------------------------------------------------------------------------
-- Audit and row-level security
-- ---------------------------------------------------------------------------

create trigger audit after insert or update or delete on public.term_scores for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.report_comments for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.result_releases for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.grade_scales for each row execute function public.audit_row();

alter table public.grade_scales enable row level security;
alter table public.term_scores enable row level security;
alter table public.report_comments enable row level security;
alter table public.result_releases enable row level security;
alter table public.notifications enable row level security;
alter table public.message_outbox enable row level security;

create policy read on public.grade_scales for select to authenticated using (true);
create policy manage on public.grade_scales for all to authenticated
  using (public.has_perm('settings.manage')) with check (public.has_perm('settings.manage'));

create policy read_staff on public.term_scores for select to authenticated
  using (public.has_perm('results.view_all') or public.has_perm('scores.all') or public.is_class_teacher(class_id)
         or public.can_enter_score(student_id, subject_id));
create policy read_released on public.term_scores for select to authenticated
  using ((student_id = auth.uid() or public.is_guardian_of(student_id)) and public.is_released(term_id, class_id));
create policy write on public.term_scores for insert to authenticated with check (public.can_enter_score(student_id, subject_id));
create policy change on public.term_scores for update to authenticated
  using (public.can_enter_score(student_id, subject_id)) with check (public.can_enter_score(student_id, subject_id));
create policy remove on public.term_scores for delete to authenticated using (public.can_enter_score(student_id, subject_id));

-- Class teachers write their class's comments, attendance and traits; principals (results.release) everything
create policy read on public.report_comments for select to authenticated
  using (public.is_staff() or ((student_id = auth.uid() or public.is_guardian_of(student_id))
         and public.is_released(term_id, (select class_id from public.students where id = student_id))));
create policy write on public.report_comments for all to authenticated
  using (public.has_perm('results.release') or public.is_class_teacher((select class_id from public.students where id = student_id)))
  with check (public.has_perm('results.release') or public.is_class_teacher((select class_id from public.students where id = student_id)));

-- Class teachers may not write the principal's comment
create function public.guard_principal_comment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_perm('results.release')
     and new.principal_comment is distinct from (case when tg_op = 'UPDATE' then old.principal_comment end) then
    raise exception 'Only the principal or an administrator can write the principal''s comment' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger principal_comment before insert or update on public.report_comments for each row execute function public.guard_principal_comment();

create policy read on public.result_releases for select to authenticated using (true);
create policy manage on public.result_releases for all to authenticated
  using (public.has_perm('results.release')) with check (public.has_perm('results.release'));

create policy own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy mark_read on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy read on public.message_outbox for select to authenticated using (public.has_perm('settings.manage'));
