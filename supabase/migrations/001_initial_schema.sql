-- AI Job Agent — Supabase schema
-- Run in Supabase SQL Editor

-- Jobs (shared across users for MVP; can scope per user later)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  description text not null,
  summary text,
  salary text,
  url text,
  source text,
  requirements text,
  created_at timestamptz not null default now()
);

-- Default document instructions per user
create table if not exists public.user_document_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  default_cv_instructions text not null default 'Create a professional CV tailored to the job. Use clear sections: summary, experience, skills, education.',
  default_cover_letter_instructions text not null default 'Write a one-page formal cover letter. Address the hiring manager, highlight relevant experience, and explain motivation for the role.',
  updated_at timestamptz not null default now()
);

-- Per-job application tracking + per-offer instruction overrides
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'applied', 'interview', 'rejected')),
  cv_instructions text,
  cover_letter_instructions text,
  custom_cv_content text,
  cover_letter_content text,
  document_language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, user_id)
);

alter table public.jobs enable row level security;
alter table public.user_document_settings enable row level security;
alter table public.applications enable row level security;

-- Jobs: readable by authenticated users
create policy "jobs_select_authenticated"
  on public.jobs for select
  to authenticated
  using (true);

-- User settings: own row only
create policy "settings_select_own"
  on public.user_document_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "settings_insert_own"
  on public.user_document_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "settings_update_own"
  on public.user_document_settings for update
  to authenticated
  using (auth.uid() = user_id);

-- Applications: own rows only
create policy "applications_select_own"
  on public.applications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "applications_insert_own"
  on public.applications for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "applications_update_own"
  on public.applications for update
  to authenticated
  using (auth.uid() = user_id);
