-- Additional RLS policies for user-owned data deletion

create policy "settings_delete_own"
  on public.user_document_settings for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "applications_delete_own"
  on public.applications for delete
  to authenticated
  using (auth.uid() = user_id);
