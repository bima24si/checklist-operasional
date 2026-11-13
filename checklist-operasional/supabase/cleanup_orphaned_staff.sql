begin;

do $$
begin
  if (select count(*) from public.profiles) <> 3
    or (
      select count(*)
      from public.profiles
      where staff_id is not null
        and (
          (lower(btrim(full_name)) = 'alya' and access_role = 'Supervisor')
          or (lower(btrim(full_name)) in ('gibran', 'oza') and access_role = 'Pegawai')
        )
    ) <> 3 then
    raise exception 'Dibatalkan: profiles harus berisi alya (Supervisor), gibran (Pegawai), dan oza (Pegawai), masing-masing terhubung ke staff.';
  end if;
end
$$;

delete from public.activities as a
where exists (
  select 1
  from public.staff as s
  where s.id = a.staff_id
    and not exists (
      select 1 from public.profiles as p where p.staff_id = s.id
    )
);

delete from public.checklist_tasks as t
where exists (
  select 1
  from public.staff as s
  where s.id = t.staff_id
    and not exists (
      select 1 from public.profiles as p where p.staff_id = s.id
    )
);

delete from public.staff as s
where not exists (
  select 1
  from public.profiles as p
  where p.staff_id = s.id
)
returning s.id, s.name, s.role, s.unit_name;

commit;
