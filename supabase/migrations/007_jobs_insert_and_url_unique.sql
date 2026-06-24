-- Allow authenticated users to add job postings and deduplicate by URL

create unique index if not exists jobs_url_unique
  on public.jobs (url)
  where url is not null;

create policy "jobs_insert_authenticated"
  on public.jobs for insert
  to authenticated
  with check (true);
