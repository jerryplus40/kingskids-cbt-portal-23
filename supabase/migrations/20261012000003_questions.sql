-- Question bank. Candidates never read these tables: they receive questions through
-- start_exam(), which strips the answer key.

create type public.question_type as enum ('mcq', 'theory');
create type public.question_status as enum ('draft', 'approved');
create type public.difficulty as enum ('easy', 'medium', 'hard');

create table public.passages (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null default '',
  body text not null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.question_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  row_count int not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  class_level text,                  -- e.g. JSS1; null = any level
  topic text,
  difficulty public.difficulty not null default 'medium',
  type public.question_type not null default 'mcq',
  body text not null check (length(trim(body)) > 0),
  image_url text,
  passage_id uuid references public.passages (id) on delete set null,
  marks numeric(5, 2) not null default 1 check (marks > 0),
  explanation text,
  status public.question_status not null default 'draft',
  import_id uuid references public.question_imports (id) on delete set null,
  -- Normalised text, used to spot the same question entered twice
  content_hash text generated always as (md5(lower(regexp_replace(trim(body), '\s+', ' ', 'g')))) stored,
  archived boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_subject_idx on public.questions (subject_id) where not archived;
create index questions_hash_idx on public.questions (content_hash);
create index questions_import_idx on public.questions (import_id);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label char(1) not null check (label in ('A', 'B', 'C', 'D', 'E')),
  body text not null default '',
  image_url text,
  is_correct boolean not null default false,
  unique (question_id, label)
);
create index question_options_question_idx on public.question_options (question_id);

-- Who may change a question: its author, or anyone who manages all questions
create function public.can_edit_question(p_question_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.questions q
    where q.id = p_question_id
      and public.has_perm('questions.author')
      and (q.created_by = auth.uid() or public.has_perm('questions.all'))
  )
$$;

-- Approving: the author (after reviewing their own import) or a question approver
create function public.approve_questions(p_ids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  perform set_config('app.approving', 'on', true);
  update public.questions q
  set status = 'approved', updated_at = now()
  where q.id = any (p_ids)
    and q.status = 'draft'
    and public.has_perm('questions.author')
    and (q.created_by = auth.uid() or public.has_perm('questions.approve'))
    -- An MCQ needs at least two options and exactly one correct answer
    and (q.type = 'theory' or (
      (select count(*) from public.question_options o where o.question_id = q.id and length(trim(o.body)) + coalesce(length(o.image_url), 0) > 0) >= 2
      and (select count(*) from public.question_options o where o.question_id = q.id and o.is_correct) = 1
    ));
  get diagnostics v_count = row_count;
  perform set_config('app.approving', 'off', true);
  return v_count;
end;
$$;

-- Imports a batch of questions in one transaction. p_rows is a JSON array of
-- { subject_id, class_level, topic, difficulty, type, body, image_url, passage_key,
--   marks, explanation, options: [{ label, body, image_url, is_correct }] }
-- and p_passages maps passage_key → { subject_id, title, body }.
create function public.import_questions(p_file_name text, p_rows jsonb, p_passages jsonb default '{}')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_import_id uuid;
  v_row jsonb;
  v_question_id uuid;
  v_passage_ids jsonb := '{}';
  v_key text;
  v_passage jsonb;
  v_passage_id uuid;
begin
  if not public.has_perm('questions.author') then
    raise exception 'You do not have permission to add questions' using errcode = '42501';
  end if;
  if jsonb_array_length(p_rows) > 2000 then
    raise exception 'At most 2000 questions per import';
  end if;

  insert into public.question_imports (file_name, row_count)
  values (p_file_name, jsonb_array_length(p_rows)) returning id into v_import_id;

  for v_key, v_passage in select * from jsonb_each(p_passages) loop
    insert into public.passages (subject_id, title, body)
    values ((v_passage ->> 'subject_id')::uuid, coalesce(v_passage ->> 'title', ''), v_passage ->> 'body')
    returning id into v_passage_id;
    v_passage_ids := v_passage_ids || jsonb_build_object(v_key, v_passage_id);
  end loop;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    insert into public.questions (subject_id, class_level, topic, difficulty, type, body, image_url,
                                  passage_id, marks, explanation, import_id)
    values (
      (v_row ->> 'subject_id')::uuid,
      nullif(v_row ->> 'class_level', ''),
      nullif(v_row ->> 'topic', ''),
      coalesce(nullif(v_row ->> 'difficulty', ''), 'medium')::public.difficulty,
      coalesce(nullif(v_row ->> 'type', ''), 'mcq')::public.question_type,
      v_row ->> 'body',
      nullif(v_row ->> 'image_url', ''),
      (v_passage_ids ->> (v_row ->> 'passage_key'))::uuid,
      coalesce((v_row ->> 'marks')::numeric, 1),
      nullif(v_row ->> 'explanation', ''),
      v_import_id
    ) returning id into v_question_id;

    insert into public.question_options (question_id, label, body, image_url, is_correct)
    select v_question_id, o ->> 'label', coalesce(o ->> 'body', ''), nullif(o ->> 'image_url', ''),
           coalesce((o ->> 'is_correct')::boolean, false)
    from jsonb_array_elements(coalesce(v_row -> 'options', '[]')) o;
  end loop;

  return v_import_id;
end;
$$;

-- Removes a whole import, as long as none of its questions has been used in an exam
create function public.undo_import(p_import_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if not exists (
    select 1 from public.question_imports i
    where i.id = p_import_id and (i.created_by = auth.uid() or public.has_perm('questions.all'))
  ) then
    raise exception 'Import not found' using errcode = '42501';
  end if;
  delete from public.questions where import_id = p_import_id;
  get diagnostics v_count = row_count;
  delete from public.question_imports where id = p_import_id;
  return v_count;
end;
$$;

create trigger audit after insert or update or delete on public.questions for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.question_options for each row execute function public.audit_row();

alter table public.passages enable row level security;
alter table public.question_imports enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;

-- The bank is shared between staff who author questions; candidates have no access
create policy read on public.questions for select to authenticated using (public.has_perm('questions.author'));
create policy add on public.questions for insert to authenticated
  with check (public.has_perm('questions.author') and created_by = auth.uid() and status = 'draft');
create policy change on public.questions for update to authenticated
  using (public.can_edit_question(id))
  -- Status changes go through approve_questions()
  with check (public.can_edit_question(id));
create policy remove on public.questions for delete to authenticated using (public.can_edit_question(id));

create policy read on public.question_options for select to authenticated using (public.has_perm('questions.author'));
create policy manage on public.question_options for all to authenticated
  using (public.can_edit_question(question_id)) with check (public.can_edit_question(question_id));

create policy read on public.passages for select to authenticated using (public.has_perm('questions.author'));
create policy manage on public.passages for all to authenticated
  using (public.has_perm('questions.author') and (created_by = auth.uid() or public.has_perm('questions.all')))
  with check (public.has_perm('questions.author'));

create policy read on public.question_imports for select to authenticated using (public.has_perm('questions.author'));

-- Editing an approved question sends it back for approval, unless the editor is an approver
create function public.question_back_to_draft() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'approved' and new.status = 'approved'
     and (new.body, new.image_url, new.marks, new.type) is distinct from (old.body, old.image_url, old.marks, old.type)
     and not public.has_perm('questions.approve') then
    new.status := 'draft';
  end if;
  -- Only approve_questions() may approve (it runs as definer, so auth checks happen there)
  if old.status = 'draft' and new.status = 'approved' and current_setting('app.approving', true) is distinct from 'on' then
    new.status := 'draft';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger question_status before update on public.questions for each row execute function public.question_back_to_draft();
