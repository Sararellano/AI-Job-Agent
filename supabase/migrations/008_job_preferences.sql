-- Job preferences: per-user search customisation
-- Stores target roles, work mode, seniority, tracks, exclusions and min score.

alter table public.user_document_settings
  add column if not exists job_preferences jsonb default '{}'::jsonb;

comment on column public.user_document_settings.job_preferences is
  'User-defined job search preferences: targetRoles, workMode, seniority, tracks, excludedKeywords, minMatchScore.';
