-- Remove demo seed jobs that pointed to placeholder URLs

delete from public.jobs
where url ilike '%://example.com/%'
   or url ilike '%://example.org/%'
   or url ilike '%://example.net/%';
