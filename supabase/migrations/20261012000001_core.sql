-- Core schema: school settings, academic structure, people, permissions and audit log.
-- Single-school deployment: one row of settings, no tenant column.

create type public.app_role as enum ('admin', 'exam_officer', 'teacher', 'student', 'parent', 'applicant');

-- ---------------------------------------------------------------------------
-- Academic structure
-- ---------------------------------------------------------------------------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name ~ '^\d{4}/\d{4}$'),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  term smallint not null check (term between 1 and 3),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (session_id, term)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  level text not null,               -- e.g. JSS1, SS2, Primary 5
  arm text not null default '',      -- e.g. A, Gold
  stream text,                       -- science, art, commercial (senior classes)
  sort_order int not null default 0,
  name text generated always as (trim(level || ' ' || arm)) stored,
  created_at timestamptz not null default now(),
  unique (level, arm)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  created_at timestamptz not null default now()
);

create table public.school_settings (
  id smallint primary key default 1 check (id = 1),
  school_name text not null default 'King''s Kids Christian International High School',
  address text,
  motto text,
  phone text,
  email text,
  logo_url text,
  current_term_id uuid references public.terms (id) on delete set null,
  ca_weight smallint not null default 40 check (ca_weight between 0 and 100),
  exam_weight smallint not null default 60 check (exam_weight between 0 and 100),
  check (ca_weight + exam_weight = 100),
  updated_at timestamptz not null default now()
);
insert into public.school_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  login_id text unique,              -- what the person types to sign in: email, admission no or phone
  first_name text not null default '',
  last_name text not null default '',
  other_name text,
  email text,
  phone text,
  photo_url text,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  -- Extra exam time, e.g. for a candidate with a disability or a medical note
  extra_time_percent smallint not null default 0 check (extra_time_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

create table public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  admission_no text not null unique,
  class_id uuid references public.classes (id) on delete set null,
  gender text check (gender in ('male', 'female')),
  date_of_birth date,
  address text,
  created_at timestamptz not null default now()
);
create index students_class_idx on public.students (class_id);

create table public.student_guardians (
  student_id uuid not null references public.students (id) on delete cascade,
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  relationship text,
  primary key (student_id, guardian_id)
);
create index student_guardians_guardian_idx on public.student_guardians (guardian_id);

-- Which teacher takes which subject in which class
create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  unique (class_id, subject_id)
);
create index class_subjects_teacher_idx on public.class_subjects (teacher_id);

-- A class teacher writes report-card comments for the class
alter table public.classes add column class_teacher_id uuid references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Permissions: roles are bundles of permissions, checked on the server
-- ---------------------------------------------------------------------------

create table public.role_permissions (
  role public.app_role not null,
  permission text not null,
  primary key (role, permission)
);

insert into public.role_permissions (role, permission) values
  ('admin', 'users.manage'),
  ('admin', 'academics.manage'),
  ('admin', 'settings.manage'),
  ('admin', 'questions.author'),
  ('admin', 'questions.approve'),
  ('admin', 'questions.all'),
  ('admin', 'exams.manage'),
  ('admin', 'exams.all'),
  ('admin', 'exams.invigilate'),
  ('admin', 'scores.enter'),
  ('admin', 'scores.all'),
  ('admin', 'results.view_all'),
  ('admin', 'results.release'),
  ('admin', 'entrance.manage'),
  ('admin', 'audit.view'),
  ('exam_officer', 'questions.author'),
  ('exam_officer', 'questions.approve'),
  ('exam_officer', 'questions.all'),
  ('exam_officer', 'exams.manage'),
  ('exam_officer', 'exams.all'),
  ('exam_officer', 'exams.invigilate'),
  ('exam_officer', 'scores.enter'),
  ('exam_officer', 'scores.all'),
  ('exam_officer', 'results.view_all'),
  ('exam_officer', 'entrance.manage'),
  ('teacher', 'questions.author'),
  ('teacher', 'exams.manage'),
  ('teacher', 'exams.invigilate'),
  ('teacher', 'scores.enter');

create function public.auth_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create function public.has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.role_permissions rp
    where rp.role = public.auth_role() and rp.permission = p
  )
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('admin', 'exam_officer', 'teacher'), false)
$$;

-- True when the caller teaches the subject in the class (or may act on all classes)
create function public.teaches(p_class_id uuid, p_subject_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_subjects cs
    where cs.class_id = p_class_id and cs.subject_id = p_subject_id and cs.teacher_id = auth.uid()
  )
$$;

create function public.is_guardian_of(p_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.student_guardians sg
    where sg.student_id = p_student_id and sg.guardian_id = auth.uid()
  )
$$;

-- ---------------------------------------------------------------------------
-- New auth users get a profile. The role comes from app_metadata, which only
-- the service role can set; public sign-up is disabled in config.toml.
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, first_name, last_name, email, must_change_password)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'applicant'),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    coalesce((new.raw_app_meta_data ->> 'must_change_password')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may change their own contact details, nothing else
create function public.update_my_profile(p_phone text, p_photo_url text) returns void
language sql security definer set search_path = public as $$
  update public.profiles
  set phone = p_phone, photo_url = p_photo_url, updated_at = now()
  where id = auth.uid()
$$;

create function public.password_changed() returns void
language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false, updated_at = now() where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

create function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_changes jsonb;
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(key, value) into v_changes
    from jsonb_each(v_new) where v_old -> key is distinct from value;
    if v_changes is null then return new; end if;
  else
    v_changes := coalesce(v_new, v_old);
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce(v_new, v_old) ->> 'id', v_changes);
  return coalesce(new, old);
end;
$$;

-- Record a staff action that is not a row change (export, print)
create function public.log_action(p_action text, p_entity text, p_entity_id text, p_details jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  select auth.uid(), p_action, p_entity, p_entity_id, p_details
  where public.is_staff()
$$;

create trigger audit after insert or update or delete on public.profiles for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.students for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.student_guardians for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.class_subjects for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.classes for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.subjects for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.sessions for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.terms for each row execute function public.audit_row();
create trigger audit after update on public.school_settings for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.role_permissions for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.sessions enable row level security;
alter table public.terms enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.school_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.class_subjects enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_log enable row level security;

-- Reference data: readable by any signed-in user, managed by academics.manage
create policy read on public.sessions for select to authenticated using (true);
create policy manage on public.sessions for all to authenticated
  using (public.has_perm('academics.manage')) with check (public.has_perm('academics.manage'));
create policy read on public.terms for select to authenticated using (true);
create policy manage on public.terms for all to authenticated
  using (public.has_perm('academics.manage')) with check (public.has_perm('academics.manage'));
create policy read on public.classes for select to authenticated using (true);
create policy manage on public.classes for all to authenticated
  using (public.has_perm('academics.manage')) with check (public.has_perm('academics.manage'));
create policy read on public.subjects for select to authenticated using (true);
create policy manage on public.subjects for all to authenticated
  using (public.has_perm('academics.manage')) with check (public.has_perm('academics.manage'));
create policy read on public.class_subjects for select to authenticated using (true);
create policy manage on public.class_subjects for all to authenticated
  using (public.has_perm('academics.manage')) with check (public.has_perm('academics.manage'));

-- School name and logo appear on the public landing and entrance pages
create policy read on public.school_settings for select to anon, authenticated using (true);
create policy manage on public.school_settings for update to authenticated
  using (public.has_perm('settings.manage')) with check (public.has_perm('settings.manage'));

create policy read on public.role_permissions for select to authenticated using (true);

create policy read_self on public.profiles for select to authenticated using (id = auth.uid());
create policy read_staff on public.profiles for select to authenticated using (public.is_staff());
create policy read_children on public.profiles for select to authenticated using (public.is_guardian_of(id));
create policy manage on public.profiles for update to authenticated
  using (public.has_perm('users.manage')) with check (public.has_perm('users.manage'));

create policy read_self on public.students for select to authenticated using (id = auth.uid());
create policy read_staff on public.students for select to authenticated using (public.is_staff());
create policy read_children on public.students for select to authenticated using (public.is_guardian_of(id));
create policy manage on public.students for all to authenticated
  using (public.has_perm('users.manage')) with check (public.has_perm('users.manage'));

create policy read_own on public.student_guardians for select to authenticated
  using (guardian_id = auth.uid() or student_id = auth.uid() or public.is_staff());
create policy manage on public.student_guardians for all to authenticated
  using (public.has_perm('users.manage')) with check (public.has_perm('users.manage'));

create policy read on public.audit_log for select to authenticated using (public.has_perm('audit.view'));

-- Helpers are callable by signed-in users only
revoke execute on function public.update_my_profile(text, text) from public, anon;
revoke execute on function public.password_changed() from public, anon;
revoke execute on function public.log_action(text, text, text, jsonb) from public, anon;
grant execute on function public.update_my_profile(text, text) to authenticated;
grant execute on function public.password_changed() to authenticated;
grant execute on function public.log_action(text, text, text, jsonb) to authenticated;
