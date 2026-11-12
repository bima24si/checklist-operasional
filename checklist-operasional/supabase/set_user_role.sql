-- Run only from Supabase Dashboard > SQL Editor.
-- Set the user's existing Supabase Auth email and the desired application role.
do $$
declare
  target_email text := 'user@contoh.com';
  target_role text := 'Supervisor'; -- Allowed values: 'Pegawai' or 'Supervisor'
  target_user_id uuid;
begin
  if target_role not in ('Pegawai', 'Supervisor') then
    raise exception 'Role must be Pegawai or Supervisor';
  end if;

  select id
  into target_user_id
  from auth.users
  where lower(email) = lower(target_email);

  if target_user_id is null then
    raise exception 'No Supabase Auth user found for email %', target_email;
  end if;

  update public.profiles
  set access_role = target_role,
      approval_status = case
        when target_role = 'Supervisor' then 'approved'
        else approval_status
      end
  where id = target_user_id;

  if not found then
    raise exception 'Profile not found for %. Run supabase/schema.sql first.', target_email;
  end if;
end
$$;
