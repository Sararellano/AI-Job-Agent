alter table public.user_document_settings
  add column if not exists salary_range text default '';
