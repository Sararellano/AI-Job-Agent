-- GitHub and extra link fields on user profile settings

alter table public.user_document_settings
  add column if not exists github_url text default '',
  add column if not exists extra_link text default '';
