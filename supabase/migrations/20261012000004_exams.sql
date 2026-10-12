-- Exam engine. The server owns the clock and the answer key:
--  * start_exam() fixes a deadline and a per-candidate question/option order, and returns
--    questions without is_correct;
--  * save_answer() stores each answer as it is chosen and refuses writes after the deadline;
--  * submit_exam() / finalize_attempt() grade on the server.

create type public.exam_kind as enum ('test', 'exam', 'practice', 'entrance');
create type public.exam_status as enum ('draft', 'published', 'closed');
create type public.attempt_status as enum ('in_progress', 'submitted');

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  kind public.exam_kind not null default 'test',
  subject_id uuid references public.subjects (id) on delete restrict,   -- null for multi-subject papers
  class_id uuid references public.classes (id) on delete restrict,      -- null for entrance exams
  term_id uuid references public.terms (id) on delete set null,
  instructions text,
  duration_minutes int not null check (duration_minutes between 1 and 600),
  opens_at timestamptz,
  closes_at timestamptz,
  max_attempts int default 1 check (max_attempts is null or max_attempts >= 1),  -- null = unlimited (practice)
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  calculator boolean not null default false,
  lockdown boolean not null default true,
  show_score boolean not null default false,        -- show the score as soon as the candidate submits
  results_released boolean not null default false,  -- candidates and parents can see scores
  review_allowed boolean not null default false,    -- candidates can see their answers and the key after release
  counts_as text not null default 'none' check (counts_as in ('none', 'ca', 'exam')),
  status public.exam_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);
create index exams_class_idx on public.exams (class_id, status);

create table public.exam_sections (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  title text not null default '',
  subject_id uuid references public.subjects (id) on delete restrict,
  instructions text,
  sort_order int not null default 0,
  random_count int check (random_count is null or random_count > 0)  -- draw this many from the section's pool
);
create index exam_sections_exam_idx on public.exam_sections (exam_id);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  section_id uuid not null references public.exam_sections (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  sort_order int not null default 0,
  marks numeric(5, 2) check (marks is null or marks > 0),   -- overrides the question's marks
  unique (section_id, question_id)
);
create index exam_questions_exam_idx on public.exam_questions (exam_id);

-- Extra candidates beyond the exam's class (entrance applicants, repeaters)
create table public.exam_candidates (
  exam_id uuid not null references public.exams (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  primary key (exam_id, candidate_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  attempt_no int not null default 1,
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  submitted_at timestamptz,
  submit_reason text check (submit_reason in ('candidate', 'timeout', 'invigilator')),
  submitted_by uuid references public.profiles (id) on delete set null,
  -- [{ section_id, title, instructions, questions: [{ question_id, marks, options: [option ids in display order] }] }]
  layout jsonb not null,
  score numeric(7, 2),
  max_score numeric(7, 2) not null default 0,
  needs_marking boolean not null default false,
  last_seen_at timestamptz not null default now(),
  client_info jsonb,
  unique (exam_id, candidate_id, attempt_no)
);
create index attempts_exam_idx on public.attempts (exam_id, status);
create index attempts_candidate_idx on public.attempts (candidate_id);
create index attempts_open_idx on public.attempts (deadline_at) where status = 'in_progress';

create table public.attempt_answers (
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  option_id uuid references public.question_options (id) on delete set null,
  text_answer text check (length(text_answer) <= 20000),
  saved_at timestamptz not null default now(),
  is_correct boolean,
  marks_awarded numeric(5, 2),
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz,
  comment text,
  primary key (attempt_id, question_id)
);

create table public.attempt_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  kind text not null,          -- start, resume, blur, fullscreen_exit, copy, paste, time_added, force_submit, reset, offline
  details jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index attempt_events_attempt_idx on public.attempt_events (attempt_id);

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create function public.my_class_id() returns uuid
language sql stable security definer set search_path = public as $$
  select class_id from public.students where id = auth.uid()
$$;

-- Staff who may manage an exam: its author, a teacher of its class subject, or exams.all
create function public.can_manage_exam(p_exam_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.exams e
    where e.id = p_exam_id
      and (
        public.has_perm('exams.all')
        or (e.kind = 'entrance' and public.has_perm('entrance.manage'))
        or (public.has_perm('exams.manage') and (e.created_by = auth.uid() or public.teaches(e.class_id, e.subject_id)))
      )
  )
$$;

create function public.can_invigilate(p_exam_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_perm('exams.invigilate')
     and (public.has_perm('exams.all') or public.can_manage_exam(p_exam_id)
          or exists (select 1 from public.exams e where e.id = p_exam_id
                     and exists (select 1 from public.class_subjects cs where cs.class_id = e.class_id and cs.teacher_id = auth.uid())))
$$;

-- Staff who may see an exam's results
create function public.can_view_results(p_exam_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_perm('results.view_all') or public.can_manage_exam(p_exam_id) or public.can_invigilate(p_exam_id)
$$;

create function public.is_candidate(p_exam_id uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.exams e
    where e.id = p_exam_id
      and (
        exists (select 1 from public.students s where s.id = p_user and s.class_id = e.class_id)
        or exists (select 1 from public.exam_candidates c where c.exam_id = e.id and c.candidate_id = p_user)
      )
  )
$$;

-- ---------------------------------------------------------------------------
-- Grading
-- ---------------------------------------------------------------------------

-- Locks and grades an attempt. Idempotent: a submitted attempt is left as it is.
create function public.finalize_attempt(p_attempt_id uuid, p_reason text, p_by uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id for update;
  if not found or v_attempt.status = 'submitted' then return; end if;

  -- Multiple choice: full marks if the chosen option is the correct one; unanswered questions have no row
  update public.attempt_answers a
  set is_correct = coalesce((select o.is_correct from public.question_options o where o.id = a.option_id), false),
      marks_awarded = case
        when coalesce((select o.is_correct from public.question_options o where o.id = a.option_id), false) then lq.marks
        else 0 end
  from (
    select (q ->> 'question_id')::uuid as question_id, (q ->> 'marks')::numeric as marks
    from jsonb_array_elements(v_attempt.layout) s, jsonb_array_elements(s -> 'questions') q
  ) lq
  join public.questions qq on qq.id = lq.question_id and qq.type = 'mcq'
  where a.attempt_id = p_attempt_id and a.question_id = lq.question_id;

  update public.attempts t
  set status = 'submitted',
      submitted_at = now(),
      submit_reason = p_reason,
      submitted_by = p_by,
      needs_marking = exists (
        select 1 from jsonb_array_elements(t.layout) s, jsonb_array_elements(s -> 'questions') q
        join public.questions qq on qq.id = (q ->> 'question_id')::uuid
        where qq.type = 'theory'
      ),
      score = coalesce((select sum(marks_awarded) from public.attempt_answers where attempt_id = t.id), 0)
  where t.id = p_attempt_id;

  insert into public.attempt_events (attempt_id, kind, details) values (p_attempt_id, 'submit', jsonb_build_object('reason', p_reason));
end;
$$;

-- Grades attempts whose time ran out. Called on a schedule and lazily by the functions below.
create function public.close_expired_attempts(p_exam_id uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_count int := 0;
begin
  for v_id in
    select id from public.attempts
    where status = 'in_progress'
      and deadline_at + interval '60 seconds' < now()
      and (p_exam_id is null or exam_id = p_exam_id)
  loop
    perform public.finalize_attempt(v_id, 'timeout');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Candidate functions
-- ---------------------------------------------------------------------------

-- Questions for an attempt in its fixed order, without the answer key
create function public.attempt_paper(p_attempt public.attempts) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s ->> 'section_id',
      'title', s ->> 'title',
      'instructions', s ->> 'instructions',
      'questions', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', qq.id,
            'type', qq.type,
            'body', qq.body,
            'image_url', qq.image_url,
            'marks', (qi.q ->> 'marks')::numeric,
            'passage', case when p.id is null then null else jsonb_build_object('id', p.id, 'title', p.title, 'body', p.body) end,
            'options', (
              select coalesce(jsonb_agg(
                jsonb_build_object('id', o.id, 'label', chr(64 + oi.n::int), 'body', o.body, 'image_url', o.image_url)
                order by oi.n), '[]')
              from jsonb_array_elements_text(qi.q -> 'options') with ordinality as oi(option_id, n)
              join public.question_options o on o.id = oi.option_id::uuid
            )
          ) order by qi.n), '[]')
        from jsonb_array_elements(s -> 'questions') with ordinality as qi(q, n)
        join public.questions qq on qq.id = (qi.q ->> 'question_id')::uuid
        left join public.passages p on p.id = qq.passage_id
      )
    ) order by si.n), '[]')
  from jsonb_array_elements(p_attempt.layout) with ordinality as si(s, n)
$$;

create function public.attempt_state(p_attempt public.attempts) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'attempt_id', p_attempt.id,
    'status', p_attempt.status,
    'deadline_at', p_attempt.deadline_at,
    'server_now', now(),
    'answers', coalesce((
      select jsonb_object_agg(a.question_id, jsonb_build_object('option_id', a.option_id, 'text', a.text_answer))
      from public.attempt_answers a where a.attempt_id = p_attempt.id
    ), '{}')
  )
$$;

-- The exam's duration plus the candidate's extra time
create function public.candidate_duration(p_exam public.exams, p_user uuid) returns interval
language sql stable security definer set search_path = public as $$
  select make_interval(secs => p_exam.duration_minutes * 60 * (1 + coalesce((select extra_time_percent from public.profiles where id = p_user), 0) / 100.0))
$$;

-- Starts or resumes the caller's attempt and returns the paper.
create function public.start_exam(p_exam_id uuid, p_client_info jsonb default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_exam public.exams;
  v_attempt public.attempts;
  v_used int;
  v_layout jsonb;
  v_max numeric;
begin
  if v_user is null or public.auth_role() is null then
    raise exception 'Please sign in again' using errcode = '42501';
  end if;

  select * into v_exam from public.exams where id = p_exam_id;
  if not found or v_exam.status <> 'published' or not public.is_candidate(p_exam_id, v_user) then
    raise exception 'This exam is not available to you' using errcode = 'P0001';
  end if;

  perform public.close_expired_attempts(p_exam_id);

  -- Resume an attempt in progress, whatever the window, so a power cut never locks anyone out
  select * into v_attempt from public.attempts
  where exam_id = p_exam_id and candidate_id = v_user and status = 'in_progress'
  order by attempt_no desc limit 1;

  if found then
    update public.attempts set last_seen_at = now() where id = v_attempt.id;
    insert into public.attempt_events (attempt_id, kind, details) values (v_attempt.id, 'resume', p_client_info);
  else
    if v_exam.opens_at is not null and now() < v_exam.opens_at then
      raise exception 'This exam opens at %', to_char(v_exam.opens_at at time zone 'Africa/Lagos', 'HH24:MI on DD Mon YYYY') using errcode = 'P0001';
    end if;
    if v_exam.closes_at is not null and now() >= v_exam.closes_at then
      raise exception 'This exam has closed' using errcode = 'P0001';
    end if;
    select count(*) into v_used from public.attempts where exam_id = p_exam_id and candidate_id = v_user;
    if v_exam.max_attempts is not null and v_used >= v_exam.max_attempts then
      raise exception 'You have already taken this exam' using errcode = 'P0001';
    end if;

    -- Fix this candidate's paper: sections in order; questions drawn and shuffled as configured
    select coalesce(jsonb_agg(sec.layout order by sec.sort_order), '[]'), coalesce(sum(sec.total), 0)
    into v_layout, v_max
    from (
      select s.sort_order,
        jsonb_build_object(
          'section_id', s.id, 'title', s.title, 'instructions', s.instructions,
          'questions', coalesce(jsonb_agg(
            jsonb_build_object(
              'question_id', pick.question_id,
              'marks', pick.marks,
              'options', (
                select coalesce(jsonb_agg(o.id order by case when v_exam.shuffle_options then random() else 0 end, o.label), '[]')
                from public.question_options o where o.question_id = pick.question_id
              )
            ) order by pick.position) filter (where pick.question_id is not null), '[]')
        ) as layout,
        coalesce(sum(pick.marks), 0) as total
      from public.exam_sections s
      left join lateral (
        select eq.question_id, coalesce(eq.marks, q.marks) as marks,
               row_number() over (order by case when v_exam.shuffle_questions then random() else 0 end, eq.sort_order) as position
        from (
          select * from public.exam_questions eq2
          where eq2.section_id = s.id
          order by case when s.random_count is not null then random() else 0 end, eq2.sort_order
          limit s.random_count
        ) eq
        join public.questions q on q.id = eq.question_id
      ) pick on true
      where s.exam_id = p_exam_id
      group by s.id, s.sort_order, s.title, s.instructions
    ) sec;

    insert into public.attempts (exam_id, candidate_id, attempt_no, deadline_at, layout, max_score, client_info)
    values (
      p_exam_id, v_user, v_used + 1,
      -- The window's close cuts the attempt short, so nobody writes after the hall closes
      least(now() + public.candidate_duration(v_exam, v_user), coalesce(v_exam.closes_at, 'infinity')),
      v_layout, v_max, p_client_info
    )
    returning * into v_attempt;
    insert into public.attempt_events (attempt_id, kind, details) values (v_attempt.id, 'start', p_client_info);
  end if;

  return public.attempt_state(v_attempt) || jsonb_build_object(
    'exam', jsonb_build_object(
      'id', v_exam.id, 'title', v_exam.title, 'instructions', v_exam.instructions,
      'duration_minutes', v_exam.duration_minutes, 'calculator', v_exam.calculator, 'lockdown', v_exam.lockdown
    ),
    'sections', public.attempt_paper(v_attempt)
  );
end;
$$;

-- Saves one answer. Pass p_option_id for multiple choice or p_text for theory; both null clears it.
create function public.save_answer(p_attempt_id uuid, p_question_id uuid, p_option_id uuid default null, p_text text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id and candidate_id = auth.uid();
  if not found then
    raise exception 'Attempt not found' using errcode = '42501';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'This exam has already been submitted' using errcode = 'P0002';
  end if;
  -- A short grace period absorbs network delay on the last answer
  if now() > v_attempt.deadline_at + interval '60 seconds' then
    perform public.finalize_attempt(p_attempt_id, 'timeout');
    raise exception 'Time is up' using errcode = 'P0003';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(v_attempt.layout) s, jsonb_array_elements(s -> 'questions') q
    where (q ->> 'question_id')::uuid = p_question_id
  ) then
    raise exception 'That question is not part of this exam' using errcode = '22023';
  end if;
  if p_option_id is not null and not exists (
    select 1 from public.question_options where id = p_option_id and question_id = p_question_id
  ) then
    raise exception 'That option does not belong to the question' using errcode = '22023';
  end if;

  if p_option_id is null and nullif(trim(coalesce(p_text, '')), '') is null then
    delete from public.attempt_answers where attempt_id = p_attempt_id and question_id = p_question_id;
  else
    insert into public.attempt_answers (attempt_id, question_id, option_id, text_answer, saved_at)
    values (p_attempt_id, p_question_id, p_option_id, p_text, now())
    on conflict (attempt_id, question_id)
    do update set option_id = excluded.option_id, text_answer = excluded.text_answer, saved_at = excluded.saved_at;
  end if;

  update public.attempts set last_seen_at = now() where id = p_attempt_id;
  return jsonb_build_object('saved_at', now(), 'deadline_at', v_attempt.deadline_at, 'server_now', now());
end;
$$;

-- Keeps the attempt alive, records lockdown events and returns the deadline (which an invigilator may extend)
create function public.exam_heartbeat(p_attempt_id uuid, p_events jsonb default '[]') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id and candidate_id = auth.uid();
  if not found then
    raise exception 'Attempt not found' using errcode = '42501';
  end if;
  if v_attempt.status = 'in_progress' and now() > v_attempt.deadline_at + interval '60 seconds' then
    perform public.finalize_attempt(p_attempt_id, 'timeout');
    select * into v_attempt from public.attempts where id = p_attempt_id;
  end if;
  if v_attempt.status = 'in_progress' then
    update public.attempts set last_seen_at = now() where id = p_attempt_id;
    insert into public.attempt_events (attempt_id, kind, details)
    select p_attempt_id, left(e ->> 'kind', 40), e -> 'details'
    from jsonb_array_elements(coalesce(p_events, '[]')) e
    limit 50;
  end if;
  return jsonb_build_object('status', v_attempt.status, 'deadline_at', v_attempt.deadline_at, 'server_now', now());
end;
$$;

create function public.submit_exam(p_attempt_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts;
  v_exam public.exams;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id and candidate_id = auth.uid();
  if not found then
    raise exception 'Attempt not found' using errcode = '42501';
  end if;
  perform public.finalize_attempt(p_attempt_id, 'candidate', auth.uid());
  select * into v_attempt from public.attempts where id = p_attempt_id;
  select * into v_exam from public.exams where id = v_attempt.exam_id;
  return jsonb_build_object(
    'status', v_attempt.status,
    'submitted_at', v_attempt.submitted_at,
    'score', case when v_exam.show_score or v_exam.results_released then v_attempt.score end,
    'max_score', case when v_exam.show_score or v_exam.results_released then v_attempt.max_score end,
    'needs_marking', v_attempt.needs_marking
  );
end;
$$;

-- Exams the caller can sit, with the state of their attempts
create function public.my_exams() returns table (
  exam_id uuid, title text, kind public.exam_kind, subject text, duration_minutes int,
  opens_at timestamptz, closes_at timestamptz, max_attempts int, attempts_used int,
  in_progress_attempt uuid, last_submitted_at timestamptz,
  score numeric, max_score numeric, results_released boolean, review_allowed boolean, last_attempt_id uuid,
  instructions text, lockdown boolean, calculator boolean, status public.exam_status
) language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.close_expired_attempts();
  return query
  select e.id, e.title, e.kind, sub.name, e.duration_minutes, e.opens_at, e.closes_at, e.max_attempts,
         (select count(*)::int from public.attempts a where a.exam_id = e.id and a.candidate_id = auth.uid()),
         (select a.id from public.attempts a where a.exam_id = e.id and a.candidate_id = auth.uid() and a.status = 'in_progress' limit 1),
         last.submitted_at,
         case when e.results_released or e.show_score then last.score end,
         case when e.results_released or e.show_score then last.max_score end,
         e.results_released, e.review_allowed, last.id,
         e.instructions, e.lockdown, e.calculator, e.status
  from public.exams e
  left join public.subjects sub on sub.id = e.subject_id
  left join lateral (
    select a.* from public.attempts a
    where a.exam_id = e.id and a.candidate_id = auth.uid() and a.status = 'submitted'
    order by a.attempt_no desc limit 1
  ) last on true
  where e.status in ('published', 'closed') and public.is_candidate(e.id, auth.uid())
  order by coalesce(e.opens_at, e.created_at) desc;
end;
$$;

-- After release, a candidate may see their answers against the key, if the exam allows review
create function public.review_attempt(p_attempt_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts;
  v_exam public.exams;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;
  if not found then raise exception 'Attempt not found' using errcode = '42501'; end if;
  select * into v_exam from public.exams where id = v_attempt.exam_id;
  if not (
    (v_attempt.candidate_id = auth.uid() and v_attempt.status = 'submitted' and v_exam.results_released and v_exam.review_allowed)
    or public.can_view_results(v_exam.id)
  ) then
    raise exception 'Review is not available for this exam' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'exam', jsonb_build_object('id', v_exam.id, 'title', v_exam.title),
    'score', v_attempt.score, 'max_score', v_attempt.max_score, 'needs_marking', v_attempt.needs_marking,
    'sections', public.attempt_paper(v_attempt),
    'key', (
      select coalesce(jsonb_object_agg(o.question_id, o.id), '{}')
      from public.question_options o
      where o.is_correct and o.question_id in (
        select (q ->> 'question_id')::uuid from jsonb_array_elements(v_attempt.layout) s, jsonb_array_elements(s -> 'questions') q
      )
    ),
    'explanations', (
      select coalesce(jsonb_object_agg(qq.id, qq.explanation), '{}')
      from public.questions qq
      where qq.explanation is not null and qq.id in (
        select (q ->> 'question_id')::uuid from jsonb_array_elements(v_attempt.layout) s, jsonb_array_elements(s -> 'questions') q
      )
    ),
    'answers', (
      select coalesce(jsonb_object_agg(a.question_id, jsonb_build_object(
        'option_id', a.option_id, 'text', a.text_answer, 'marks', a.marks_awarded, 'comment', a.comment)), '{}')
      from public.attempt_answers a where a.attempt_id = v_attempt.id
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff functions
-- ---------------------------------------------------------------------------

create function public.publish_exam(p_exam_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_exam public.exams;
begin
  if not public.can_manage_exam(p_exam_id) then
    raise exception 'You cannot publish this exam' using errcode = '42501';
  end if;
  select * into v_exam from public.exams where id = p_exam_id;
  if v_exam.class_id is null and v_exam.kind <> 'entrance'
     and not exists (select 1 from public.exam_candidates where exam_id = p_exam_id) then
    raise exception 'Choose a class for the exam' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.exam_questions where exam_id = p_exam_id) then
    raise exception 'Add questions before publishing' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.exam_questions eq join public.questions q on q.id = eq.question_id
    where eq.exam_id = p_exam_id and q.status <> 'approved'
  ) then
    raise exception 'Some questions are still drafts. Approve them in the question bank first.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.exam_sections s
    where s.exam_id = p_exam_id and s.random_count is not null
      and s.random_count > (select count(*) from public.exam_questions eq where eq.section_id = s.id)
  ) then
    raise exception 'A section asks for more random questions than it holds' using errcode = 'P0001';
  end if;
  perform set_config('app.publishing', 'on', true);
  update public.exams set status = 'published', updated_at = now() where id = p_exam_id;
  perform set_config('app.publishing', 'off', true);
end;
$$;

create function public.require_invigilator(p_attempt_id uuid) returns public.attempts
language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;
  if not found or not public.can_invigilate(v_attempt.exam_id) then
    raise exception 'You cannot supervise this exam' using errcode = '42501';
  end if;
  return v_attempt;
end;
$$;

create function public.add_time(p_attempt_id uuid, p_minutes int) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts := public.require_invigilator(p_attempt_id);
  v_deadline timestamptz;
begin
  if p_minutes not between 1 and 120 then raise exception 'Add between 1 and 120 minutes'; end if;
  if v_attempt.status <> 'in_progress' then raise exception 'This attempt has been submitted'; end if;
  update public.attempts
  set deadline_at = greatest(deadline_at, now()) + make_interval(mins => p_minutes)
  where id = p_attempt_id returning deadline_at into v_deadline;
  insert into public.attempt_events (attempt_id, kind, details) values (p_attempt_id, 'time_added', jsonb_build_object('minutes', p_minutes));
  return v_deadline;
end;
$$;

create function public.force_submit(p_attempt_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_invigilator(p_attempt_id);
  perform public.finalize_attempt(p_attempt_id, 'invigilator', auth.uid());
end;
$$;

-- Deletes an attempt so the candidate can start again (e.g. after a computer fault). Logged.
create function public.reset_attempt(p_attempt_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts := public.require_invigilator(p_attempt_id);
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Give a reason for the reset'; end if;
  perform public.log_action('attempt.reset', 'attempts', p_attempt_id::text,
    jsonb_build_object('exam_id', v_attempt.exam_id, 'candidate_id', v_attempt.candidate_id, 'reason', p_reason, 'score', v_attempt.score));
  delete from public.attempts where id = p_attempt_id;
end;
$$;

-- Live view for invigilators: every candidate with progress and time left
create function public.exam_monitor(p_exam_id uuid) returns table (
  candidate_id uuid, name text, login_id text, attempt_id uuid, status text, answered int, total int,
  started_at timestamptz, deadline_at timestamptz, last_seen_at timestamptz, warnings int, score numeric, max_score numeric
) language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.can_invigilate(p_exam_id) then
    raise exception 'You cannot supervise this exam' using errcode = '42501';
  end if;
  perform public.close_expired_attempts(p_exam_id);
  return query
  with candidates as (
    select s.id from public.students s join public.exams e on e.class_id = s.class_id where e.id = p_exam_id
    union
    select c.candidate_id from public.exam_candidates c where c.exam_id = p_exam_id
  )
  select p.id, trim(p.first_name || ' ' || p.last_name), p.login_id, a.id,
         coalesce(a.status::text, 'not_started'),
         (select count(*)::int from public.attempt_answers x where x.attempt_id = a.id),
         (select count(*)::int from jsonb_array_elements(a.layout) s, jsonb_array_elements(s -> 'questions')),
         a.started_at, a.deadline_at, a.last_seen_at,
         (select count(*)::int from public.attempt_events ev where ev.attempt_id = a.id and ev.kind in ('blur', 'fullscreen_exit', 'copy', 'paste')),
         a.score, a.max_score
  from candidates c
  join public.profiles p on p.id = c.id
  left join lateral (
    select * from public.attempts t where t.exam_id = p_exam_id and t.candidate_id = c.id order by t.attempt_no desc limit 1
  ) a on true
  order by p.last_name, p.first_name;
end;
$$;

-- Theory marking: sets marks for one answer and recomputes the attempt's score
create function public.mark_answer(p_attempt_id uuid, p_question_id uuid, p_marks numeric, p_comment text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.attempts;
  v_max numeric;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;
  if not found or not public.can_manage_exam(v_attempt.exam_id) then
    raise exception 'You cannot mark this exam' using errcode = '42501';
  end if;
  if v_attempt.status <> 'submitted' then raise exception 'The candidate has not submitted yet'; end if;
  select (q ->> 'marks')::numeric into v_max
  from jsonb_array_elements(v_attempt.layout) s, jsonb_array_elements(s -> 'questions') q
  where (q ->> 'question_id')::uuid = p_question_id;
  if v_max is null then raise exception 'That question is not in this attempt'; end if;
  if p_marks < 0 or p_marks > v_max then raise exception 'Marks must be between 0 and %', v_max; end if;

  insert into public.attempt_answers (attempt_id, question_id, marks_awarded, marked_by, marked_at, comment)
  values (p_attempt_id, p_question_id, p_marks, auth.uid(), now(), p_comment)
  on conflict (attempt_id, question_id) do update
  set marks_awarded = excluded.marks_awarded, marked_by = excluded.marked_by, marked_at = excluded.marked_at, comment = excluded.comment;

  update public.attempts t
  set score = coalesce((select sum(marks_awarded) from public.attempt_answers where attempt_id = t.id), 0),
      needs_marking = exists (
        select 1 from jsonb_array_elements(t.layout) s, jsonb_array_elements(s -> 'questions') q
        join public.questions qq on qq.id = (q ->> 'question_id')::uuid
        left join public.attempt_answers aa on aa.attempt_id = t.id and aa.question_id = qq.id
        where qq.type = 'theory' and aa.marks_awarded is null
      )
  where t.id = p_attempt_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Integrity: once anyone has started, the paper is fixed
-- ---------------------------------------------------------------------------

create function public.lock_started_exam() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_exam_id uuid := coalesce(new.exam_id, old.exam_id);
begin
  if exists (select 1 from public.attempts where exam_id = v_exam_id) then
    raise exception 'Candidates have already started this exam, so its questions cannot change' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger lock_started before insert or update or delete on public.exam_questions for each row execute function public.lock_started_exam();
create trigger lock_started before insert or update or delete on public.exam_sections for each row execute function public.lock_started_exam();

-- A published exam's paper changes only by returning it to draft (which the lock above blocks once started)
create function public.guard_published_exam() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'draft' and new.status = 'published' and current_setting('app.publishing', true) is distinct from 'on' then
    raise exception 'Use publish_exam() to publish' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_status before update on public.exams for each row execute function public.guard_published_exam();

create trigger audit after insert or update or delete on public.exams for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.exam_questions for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.exam_candidates for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.exams enable row level security;
alter table public.exam_sections enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_candidates enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.attempt_events enable row level security;

create policy read_staff on public.exams for select to authenticated using (public.is_staff());
create policy add on public.exams for insert to authenticated with check (
  created_by = auth.uid() and status = 'draft' and (
    public.has_perm('exams.all')
    or (kind = 'entrance' and public.has_perm('entrance.manage'))
    or (public.has_perm('exams.manage') and public.teaches(class_id, subject_id))
  )
);
create policy change on public.exams for update to authenticated using (public.can_manage_exam(id)) with check (public.can_manage_exam(id));
create policy remove on public.exams for delete to authenticated
  using (public.can_manage_exam(id) and not exists (select 1 from public.attempts a where a.exam_id = id));

create policy read on public.exam_sections for select to authenticated using (public.is_staff());
create policy manage on public.exam_sections for all to authenticated
  using (public.can_manage_exam(exam_id)) with check (public.can_manage_exam(exam_id));
create policy read on public.exam_questions for select to authenticated using (public.is_staff());
create policy manage on public.exam_questions for all to authenticated
  using (public.can_manage_exam(exam_id)) with check (public.can_manage_exam(exam_id));
create policy read on public.exam_candidates for select to authenticated using (public.is_staff() or candidate_id = auth.uid());
create policy manage on public.exam_candidates for all to authenticated
  using (public.can_manage_exam(exam_id)) with check (public.can_manage_exam(exam_id));

-- Candidates use the functions above; staff read results directly
create policy read_staff on public.attempts for select to authenticated using (public.can_view_results(exam_id));
create policy read_staff on public.attempt_answers for select to authenticated
  using (exists (select 1 from public.attempts a where a.id = attempt_id and public.can_view_results(a.exam_id)));
create policy read_staff on public.attempt_events for select to authenticated
  using (exists (select 1 from public.attempts a where a.id = attempt_id and public.can_view_results(a.exam_id)));

-- Internal helpers are not callable from the API
revoke execute on function public.finalize_attempt(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public.attempt_paper(public.attempts) from public, anon, authenticated;
revoke execute on function public.attempt_state(public.attempts) from public, anon, authenticated;
revoke execute on function public.require_invigilator(uuid) from public, anon, authenticated;
revoke execute on function public.close_expired_attempts(uuid) from public, anon;

-- Grade expired attempts every minute where pg_cron is available (it is on Supabase)
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('close-expired-attempts', '* * * * *', 'select public.close_expired_attempts()');
  end if;
end;
$$;
