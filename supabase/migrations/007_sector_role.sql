-- Employment sector and role family for multi-sector career profiles

alter table public.user_document_settings
  add column if not exists sector text default 'tech',
  add column if not exists role_family text default 'general';

comment on column public.user_document_settings.sector is
  'Employment sector: tech, healthcare, marketing, sales, finance, education, hospitality, other';
comment on column public.user_document_settings.role_family is
  'Role family within sector, e.g. frontend, nursing, digital_marketing';
