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
  v_unit := 'kcp iskandar';

  if v_name is null or v_role not in ('Teller', 'Customer Service', 'Satpam') then
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
    v_staff_id || '-v2-' || template.task_index,
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

revoke all on function public.initialize_employee_profile(jsonb) from public;
grant execute on function public.initialize_employee_profile(jsonb) to authenticated;

notify pgrst, 'reload schema';
