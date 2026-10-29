-- Teachers decide which class an exam is for: any teacher may set an exam for any class
-- and subject. They manage the exams they create (can_manage_exam already covers the
-- author). Term score entry stays limited to the classes and subjects assigned to them.

drop policy add on public.exams;
create policy add on public.exams for insert to authenticated with check (
  created_by = auth.uid() and status = 'draft' and (
    public.has_perm('exams.all')
    or (kind = 'entrance' and public.has_perm('entrance.manage'))
    or (kind <> 'entrance' and public.has_perm('exams.manage'))
  )
);
