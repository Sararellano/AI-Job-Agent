-- Profile fields, default templates, per-application template ids

alter table public.user_document_settings
  add column if not exists full_name text default '',
  add column if not exists target_role text default '',
  add column if not exists email text default '',
  add column if not exists phone text default '',
  add column if not exists mobile text default '',
  add column if not exists languages text default '',
  add column if not exists location text default '',
  add column if not exists linkedin_url text default '',
  add column if not exists website text default '',
  add column if not exists additional_info text default '',
  add column if not exists default_cv_template_id text default 'cv-1',
  add column if not exists default_cover_letter_template_id text default 'cl-1';

alter table public.applications
  add column if not exists cv_template_id text default 'cv-1',
  add column if not exists cover_letter_template_id text default 'cl-1';
