-- File storage. Both buckets are public-read so images load in the exam screen and on
-- printed report cards without signed URLs; object names are random UUIDs, so they
-- cannot be guessed. Only staff with the right permission can upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('branding', 'branding', true, 2 * 1024 * 1024, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('question-media', 'question-media', true, 2 * 1024 * 1024, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "branding upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and public.has_perm('settings.manage'));
create policy "branding delete" on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and public.has_perm('settings.manage'));

create policy "question media upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'question-media' and public.has_perm('questions.author'));
create policy "question media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'question-media' and owner = auth.uid());
