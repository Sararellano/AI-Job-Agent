-- UX restructure: custom CV questions and job input mode

alter table public.user_document_settings
  add column if not exists cv_custom_questions jsonb default '[]'::jsonb;

alter table public.jobs
  add column if not exists input_mode text default 'synced'
  check (input_mode in ('synced', 'link', 'manual'));
