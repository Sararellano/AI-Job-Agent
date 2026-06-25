-- Remove connector-synced jobs (keep user-created link/manual applications)

delete from public.jobs
where coalesce(input_mode, 'synced') = 'synced';
