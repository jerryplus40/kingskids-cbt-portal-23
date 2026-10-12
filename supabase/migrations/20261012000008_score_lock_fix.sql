-- Released results stay frozen, but only the scores themselves. Housekeeping updates, such
-- as Postgres clearing updated_by when a staff account is deleted, must not be blocked.

create or replace function public.check_score_limits() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_ca int;
  v_exam int;
  v_scores_changed boolean := tg_op = 'INSERT'
    or new.ca_score is distinct from old.ca_score
    or new.exam_score is distinct from old.exam_score;
begin
  select ca_weight, exam_weight into v_ca, v_exam from public.school_settings where id = 1;
  if new.ca_score > v_ca then raise exception 'CA score cannot be more than %', v_ca using errcode = '22023'; end if;
  if new.exam_score > v_exam then raise exception 'Exam score cannot be more than %', v_exam using errcode = '22023'; end if;
  new.class_id := coalesce(new.class_id, (select class_id from public.students where id = new.student_id));
  if not v_scores_changed then return new; end if;

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
