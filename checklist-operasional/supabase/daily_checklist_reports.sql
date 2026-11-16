alter table public.checklist_tasks
  add column if not exists state_date date
  not null default (timezone('Asia/Jakarta', now()))::date;

create table if not exists public.checklist_daily_reports (
  report_date date not null,
  task_id text not null,
  staff_id text not null,
  staff_name text not null,
  role text not null,
  unit_name text not null,
  task_title text not null,
  session text not null,
  deadline text not null,
  task_type text not null,
  completed boolean not null,
  evidence_path text not null default '',
  obstacle_note text not null default '',
  archived_at timestamptz not null default now(),
  primary key (report_date, task_id)
);

create index if not exists checklist_daily_reports_date_idx
  on public.checklist_daily_reports (report_date desc);

create index if not exists checklist_daily_reports_staff_idx
  on public.checklist_daily_reports (staff_id, report_date desc);

alter table public.checklist_daily_reports enable row level security;

drop policy if exists "Users can read permitted daily checklist reports"
  on public.checklist_daily_reports;
create policy "Users can read permitted daily checklist reports"
  on public.checklist_daily_reports for select to authenticated
  using (
    public.current_approval_status() = 'approved'
    and (
      public.current_access_role() = 'Supervisor'
      or staff_id = public.current_staff_id()
    )
  );

create or replace function public.rollover_daily_checklists()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (timezone('Asia/Jakarta', now()))::date;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_approval_status() <> 'approved' then
    raise exception 'Approved profile required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(190917113, 1);

  insert into public.checklist_daily_reports (
    report_date,
    task_id,
    staff_id,
    staff_name,
    role,
    unit_name,
    task_title,
    session,
    deadline,
    task_type,
    completed,
    evidence_path,
    obstacle_note
  )
  select
    task.state_date,
    task.id,
    task.staff_id,
    task.staff_name,
    task.role,
    task.unit_name,
    task.title,
    task.session,
    task.deadline,
    task.type,
    task.completed,
    task.evidence_path,
    task.obstacle_note
  from public.checklist_tasks as task
  where task.is_active
    and task.state_date < v_today
  on conflict (report_date, task_id) do nothing;

  update public.checklist_tasks
  set completed = false,
      evidence_path = '',
      obstacle_note = '',
      obstacle_note_updated_at = null,
      state_date = v_today
  where is_active
    and state_date < v_today;
end;
$$;

revoke all on function public.rollover_daily_checklists() from public, anon;
grant execute on function public.rollover_daily_checklists() to authenticated;

grant select on public.checklist_daily_reports to authenticated;
