-- Structured CV extraction (experience, education, skills) for document generation
alter table public.user_document_settings
  add column if not exists cv_profile_extraction jsonb;

comment on column public.user_document_settings.cv_profile_extraction is
  'Structured profile data extracted from uploaded CV (experience, education, skills, summary)';
