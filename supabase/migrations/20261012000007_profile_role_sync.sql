-- Supabase Auth inserts a new user first and writes app_metadata in a second step, so the
-- insert trigger sees no role. Sync the profile whenever app_metadata (set only by the
-- service role) or the name in user_metadata changes.

create function public.sync_profile_from_auth() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role public.app_role := (new.raw_app_meta_data ->> 'role')::public.app_role;
begin
  update public.profiles p
  set role = coalesce(v_role, p.role),
      must_change_password = case
        when new.raw_app_meta_data ? 'must_change_password'
             and old.raw_app_meta_data -> 'must_change_password' is distinct from new.raw_app_meta_data -> 'must_change_password'
        then (new.raw_app_meta_data ->> 'must_change_password')::boolean
        else p.must_change_password end,
      -- Names only fill blanks, so later edits in the portal are kept
      first_name = case when p.first_name = '' then coalesce(new.raw_user_meta_data ->> 'first_name', '') else p.first_name end,
      last_name = case when p.last_name = '' then coalesce(new.raw_user_meta_data ->> 'last_name', '') else p.last_name end,
      updated_at = now()
  where p.id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of raw_app_meta_data, raw_user_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data is distinct from new.raw_app_meta_data or old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function public.sync_profile_from_auth();
