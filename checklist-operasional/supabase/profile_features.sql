create or replace function public.update_own_profile_name(p_full_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text := nullif(pg_catalog.btrim(p_full_name), '');
  v_staff_id text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if v_full_name is null or pg_catalog.char_length(v_full_name) < 2 or pg_catalog.char_length(v_full_name) > 100 then
    raise exception 'Nama harus berisi 2 sampai 100 karakter';
  end if;

  update public.profiles
  set full_name = v_full_name
  where id = (select auth.uid())
    and approval_status = 'approved'
  returning staff_id into v_staff_id;

  if not found then
    raise exception 'Approved profile not found';
  end if;

  if v_staff_id is not null then
    update public.staff
    set name = v_full_name
    where id = v_staff_id;

    update public.checklist_tasks
    set staff_name = v_full_name
    where staff_id = v_staff_id
      and is_active;
  end if;

  return v_full_name;
end;
$$;

revoke all on function public.update_own_profile_name(text) from public, anon, authenticated;
grant execute on function public.update_own_profile_name(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own profile photo" on storage.objects;
create policy "Users can read their own profile photo"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/profile'
  );

drop policy if exists "Users can upload their own profile photo" on storage.objects;
create policy "Users can upload their own profile photo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/profile'
  );

drop policy if exists "Users can update their own profile photo" on storage.objects;
create policy "Users can update their own profile photo"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/profile'
  )
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/profile'
  );

drop policy if exists "Users can delete their own profile photo" on storage.objects;
create policy "Users can delete their own profile photo"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/profile'
  );

notify pgrst, 'reload schema';
