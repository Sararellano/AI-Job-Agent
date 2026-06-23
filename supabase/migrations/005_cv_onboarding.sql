-- CV upload, parsed data, skill profile, onboarding state

alter table public.user_document_settings
  add column if not exists cv_file_url text,
  add column if not exists cv_file_name text,
  add column if not exists cv_parsed_raw text,
  add column if not exists cv_parsed_structured jsonb,
  add column if not exists primary_track text default 'general',
  add column if not exists skill_profile jsonb default '[]'::jsonb,
  add column if not exists question_answers jsonb default '{}'::jsonb,
  add column if not exists ai_cv_analysis jsonb,
  add column if not exists onboarding_completed boolean default false,
  add column if not exists onboarding_step int default 0;

-- Storage bucket for CV documents (PDF/DOCX)
insert into storage.buckets (id, name, public)
values ('cv-documents', 'cv-documents', false)
on conflict (id) do nothing;

create policy "cv_docs_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cv-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_docs_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cv-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_docs_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cv-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cv_docs_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cv-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
