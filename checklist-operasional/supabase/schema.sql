create extension if not exists pgcrypto;

create table if not exists public.staff (
  id text primary key,
  name text not null,
  role text not null,
  unit_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  access_role text not null default 'Pegawai'
    check (access_role in ('Pegawai', 'Supervisor')),
  approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved')),
  staff_id text unique references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists approval_status text not null default 'approved';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_approval_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_approval_status_check
      check (approval_status in ('pending', 'approved'));
  end if;
end
$$;

create table if not exists public.checklist_tasks (
  id text primary key,
  staff_id text not null references public.staff (id) on delete cascade,
  staff_name text not null,
  role text not null,
  unit_id text not null,
  unit_name text not null,
  session text not null,
  deadline text not null,
  title text not null,
  description text not null,
  type text not null,
  completed boolean not null default false,
  evidence_path text not null default '',
  obstacle_note text not null default '',
  obstacle_note_updated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id text primary key,
  staff_id text not null references public.staff (id) on delete cascade,
  staff_name text not null,
  role text not null,
  unit_name text not null,
  task_id text not null references public.checklist_tasks (id) on delete cascade,
  task_title text not null,
  session text not null,
  action text not null,
  timestamp timestamptz not null default now()
);

create index if not exists checklist_tasks_staff_id_idx on public.checklist_tasks (staff_id);
create index if not exists activities_timestamp_idx on public.activities (timestamp desc);
create index if not exists activities_staff_id_idx on public.activities (staff_id);

create or replace function public.current_access_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select access_role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.current_staff_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select staff_id from public.profiles where id = (select auth.uid())
$$;

create or replace function public.current_approval_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select approval_status from public.profiles where id = (select auth.uid())
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, approval_status)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    'pending'
  );
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

insert into public.profiles (id, full_name)
select
  id,
  coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), nullif(split_part(email, '@', 1), ''), 'User')
from auth.users
on conflict (id) do nothing;

create or replace function public.initialize_employee_profile(p_tasks jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_user auth.users%rowtype;
  v_staff_id text;
  v_name text;
  v_role text;
  v_unit text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'User profile not found';
  end if;

  if v_profile.access_role <> 'Pegawai' then
    raise exception 'Only employee profiles can be initialized';
  end if;

  if v_profile.approval_status <> 'approved' then
    raise exception 'Employee registration is waiting for supervisor approval';
  end if;

  if v_profile.staff_id is not null then
    return v_profile.staff_id;
  end if;

  select * into v_user from auth.users where id = v_user_id;
  v_name := nullif(v_user.raw_user_meta_data ->> 'full_name', '');
  v_role := nullif(v_user.raw_user_meta_data ->> 'job_role', '');
  v_unit := nullif(v_user.raw_user_meta_data ->> 'unit_name', '');

  if v_name is null or v_role not in ('Teller', 'Customer Service', 'Relationship Manager', 'Satpam') or v_unit is null then
    raise exception 'Employee registration details are incomplete';
  end if;

  if p_tasks is null or jsonb_typeof(p_tasks) is distinct from 'array' then
    raise exception 'Checklist templates are missing';
  end if;

  if jsonb_array_length(p_tasks) = 0 then
    raise exception 'Checklist templates are missing';
  end if;

  v_staff_id := 'staff-' || v_user_id::text;

  insert into public.staff (id, name, role, unit_name)
  values (v_staff_id, v_name, v_role, v_unit);

  insert into public.checklist_tasks (
    id, staff_id, staff_name, role, unit_id, unit_name, session,
    deadline, title, description, type
  )
  select
    v_staff_id || '-' || template.task_index,
    v_staff_id,
    v_name,
    v_role,
    v_unit,
    v_unit,
    template.session,
    template.deadline,
    template.title,
    template.description,
    template.task_type
  from jsonb_to_recordset(p_tasks) as template(
    task_index integer,
    session text,
    deadline text,
    title text,
    description text,
    task_type text
  );

  update public.profiles
  set staff_id = v_staff_id
  where id = v_user_id;

  return v_staff_id;
end;
$$;

create or replace function public.list_pending_employee_approvals()
returns table (
  user_id uuid,
  full_name text,
  email text,
  job_role text,
  unit_name text,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or public.current_access_role() is distinct from 'Supervisor'
    or public.current_approval_status() is distinct from 'approved' then
    raise exception 'Only approved supervisors can view pending registrations';
  end if;

  return query
    select p.id, p.full_name, u.email::text,
      u.raw_user_meta_data ->> 'job_role',
      u.raw_user_meta_data ->> 'unit_name',
      p.created_at
    from public.profiles as p
    join auth.users as u on u.id = p.id
    where p.access_role = 'Pegawai'
      and p.approval_status = 'pending'
    order by p.created_at;
end;
$$;

create or replace function public.approve_employee_registration(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or public.current_access_role() is distinct from 'Supervisor'
    or public.current_approval_status() is distinct from 'approved' then
    raise exception 'Only approved supervisors can approve registrations';
  end if;

  update public.profiles
  set approval_status = 'approved'
  where id = p_user_id
    and access_role = 'Pegawai'
    and approval_status = 'pending';

  if not found then
    raise exception 'Pending employee registration not found';
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.checklist_tasks enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Supervisors can read all staff" on public.staff;
create policy "Supervisors can read all staff"
  on public.staff for select to authenticated
  using (
    public.current_access_role() = 'Supervisor'
    and public.current_approval_status() = 'approved'
  );

drop policy if exists "Employees can read their own staff record" on public.staff;
create policy "Employees can read their own staff record"
  on public.staff for select to authenticated
  using (
    id = (select public.current_staff_id())
    and public.current_approval_status() = 'approved'
  );

drop policy if exists "Supervisors can manage staff" on public.staff;
create policy "Supervisors can manage staff"
  on public.staff for all to authenticated
  using (
    public.current_access_role() = 'Supervisor'
    and public.current_approval_status() = 'approved'
  )
  with check (
    public.current_access_role() = 'Supervisor'
    and public.current_approval_status() = 'approved'
  );

drop policy if exists "Users can read permitted checklist tasks" on public.checklist_tasks;
create policy "Users can read permitted checklist tasks"
  on public.checklist_tasks for select to authenticated
  using (
    public.current_approval_status() = 'approved'
    and (
      public.current_access_role() = 'Supervisor'
      or staff_id = (select public.current_staff_id())
    )
  );

drop policy if exists "Users can update permitted checklist tasks" on public.checklist_tasks;
create policy "Users can update permitted checklist tasks"
  on public.checklist_tasks for update to authenticated
  using (
    public.current_approval_status() = 'approved'
    and (
      public.current_access_role() = 'Supervisor'
      or staff_id = (select public.current_staff_id())
    )
  )
  with check (
    public.current_approval_status() = 'approved'
    and (
      public.current_access_role() = 'Supervisor'
      or staff_id = (select public.current_staff_id())
    )
  );

drop policy if exists "Users can read permitted activities" on public.activities;
create policy "Users can read permitted activities"
  on public.activities for select to authenticated
  using (
    public.current_approval_status() = 'approved'
    and (
      public.current_access_role() = 'Supervisor'
      or staff_id = (select public.current_staff_id())
    )
  );

drop policy if exists "Users can record permitted activities" on public.activities;
create policy "Users can record permitted activities"
  on public.activities for insert to authenticated
  with check (
    public.current_approval_status() = 'approved'
    and (
      public.current_access_role() = 'Supervisor'
      or (
        staff_id = (select public.current_staff_id())
        and exists (
          select 1
          from public.checklist_tasks as task
          where task.id = activities.task_id
            and task.staff_id = activities.staff_id
        )
      )
    )
  );

revoke all on function public.current_access_role() from public;
revoke all on function public.current_staff_id() from public;
revoke all on function public.current_approval_status() from public;
grant execute on function public.current_access_role() to authenticated;
grant execute on function public.current_staff_id() to authenticated;
grant execute on function public.current_approval_status() to authenticated;
revoke all on function public.initialize_employee_profile(jsonb) from public;
grant execute on function public.initialize_employee_profile(jsonb) to authenticated;
revoke all on function public.list_pending_employee_approvals() from public;
grant execute on function public.list_pending_employee_approvals() to authenticated;
revoke all on function public.approve_employee_registration(uuid) from public;
grant execute on function public.approve_employee_registration(uuid) to authenticated;
grant usage on schema public to authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.staff, public.checklist_tasks, public.activities to authenticated;
grant insert, update, delete on public.staff to authenticated;
revoke update on public.checklist_tasks from authenticated;
grant update (completed, evidence_path, obstacle_note, obstacle_note_updated_at)
  on public.checklist_tasks to authenticated;
grant insert on public.activities to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Employees upload their own evidence" on storage.objects;
create policy "Employees upload their own evidence"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and public.current_approval_status() = 'approved'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users read permitted evidence" on storage.objects;
create policy "Users read permitted evidence"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and public.current_approval_status() = 'approved'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.current_access_role() = 'Supervisor'
    )
  );

drop policy if exists "Employees delete their own evidence" on storage.objects;
create policy "Employees delete their own evidence"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and public.current_approval_status() = 'approved'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
