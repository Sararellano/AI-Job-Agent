-- Per-application CV profile overrides (structured extraction editable per job)
alter table public.applications
  add column if not exists cv_profile_data jsonb;

comment on column public.applications.cv_profile_data is
  'Optional per-application override of structured CV profile data';
