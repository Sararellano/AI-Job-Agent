-- Add photo URL columns + Supabase Storage bucket for CV photos

alter table public.user_document_settings
  add column if not exists default_cv_photo_url text,
  add column if not exists default_cover_letter_photo_url text;

alter table public.applications
  add column if not exists cv_photo_url text,
  add column if not exists cover_letter_photo_url text;

-- Storage bucket for profile/CV photos
insert into storage.buckets (id, name, public)
values ('cv-photos', 'cv-photos', true)
on conflict (id) do nothing;

-- Users can manage files under their own folder: {user_id}/...
create policy "cv_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for public bucket URLs
create policy "cv_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'cv-photos');
