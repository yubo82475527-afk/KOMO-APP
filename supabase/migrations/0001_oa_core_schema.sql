create extension if not exists pgcrypto;

create schema if not exists private;

create type public.user_status as enum ('active', 'disabled');
create type public.schedule_type as enum ('work', 'rest', 'leave', 'holiday');
create type public.attendance_status as enum ('normal', 'late', 'early_leave', 'missing_punch', 'absent', 'leave', 'overtime');
create type public.approval_status as enum ('draft', 'submitted', 'waiting', 'pending', 'approved', 'rejected', 'cancelled');
create type public.approver_type as enum ('direct_manager', 'department_head', 'role', 'user');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.departments(id) on delete set null,
  head_id uuid,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_no text unique,
  full_name text not null,
  email text unique,
  department_id uuid references public.departments(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.departments
  add constraint departments_head_id_fkey
  foreign key (head_id) references public.profiles(id) on delete set null;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (profile_id, role_id)
);

create table public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  start_time time,
  end_time time,
  grace_minutes integer not null default 0,
  crosses_day boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.schedule_imports (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  target_month date,
  duplicate_mode text not null default 'overwrite' check (duplicate_mode in ('overwrite', 'skip')),
  total_rows integer not null default 0,
  success_rows integer not null default 0,
  failed_rows integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  shift_template_id uuid references public.shift_templates(id) on delete set null,
  schedule_type public.schedule_type not null default 'work',
  import_id uuid references public.schedule_imports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, work_date)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  punch_time timestamptz not null,
  punch_type text not null check (punch_type in ('in', 'out')),
  location jsonb,
  device_info jsonb,
  created_at timestamptz not null default now()
);

create index departments_parent_id_idx on public.departments(parent_id);
create index profiles_department_id_idx on public.profiles(department_id);
create index user_roles_role_id_idx on public.user_roles(role_id);
create index schedules_profile_work_date_idx on public.schedules(profile_id, work_date);
create index schedules_work_date_idx on public.schedules(work_date);
create index attendance_records_profile_time_idx on public.attendance_records(profile_id, punch_time desc);

create table public.attendance_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  schedule_id uuid references public.schedules(id) on delete set null,
  status public.attendance_status not null,
  first_in timestamptz,
  last_out timestamptz,
  minutes_late integer not null default 0,
  minutes_early_leave integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (profile_id, work_date)
);

create index attendance_daily_summaries_profile_date_idx on public.attendance_daily_summaries(profile_id, work_date);

create table public.approval_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  request_type text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approval_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.approval_templates(id) on delete cascade,
  step_order integer not null,
  name text not null,
  approver_type public.approver_type not null,
  role_code text references public.roles(code) on delete restrict,
  approver_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (template_id, step_order)
);

create index approval_templates_type_active_idx on public.approval_templates(request_type, is_active);
create index approval_template_steps_template_order_idx on public.approval_template_steps(template_id, step_order);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.approval_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create index approval_requests_requester_status_idx on public.approval_requests(requester_id, status);

create table public.approval_steps (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.approval_requests(id) on delete cascade,
  template_step_id uuid references public.approval_template_steps(id) on delete set null,
  approver_id uuid references public.profiles(id) on delete set null,
  approver_type public.approver_type not null default 'user',
  role_code text references public.roles(code) on delete restrict,
  step_order integer not null,
  status public.approval_status not null default 'waiting',
  comment text,
  acted_at timestamptz,
  created_at timestamptz not null default now()
);

create index approval_steps_approver_status_idx on public.approval_steps(approver_id, status);
create index approval_steps_request_order_idx on public.approval_steps(request_id, step_order);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);

insert into public.roles (code, name)
values ('admin', 'Admin'), ('hr', 'HR'), ('manager', 'Manager'), ('employee', 'Employee')
on conflict (code) do nothing;

insert into public.shift_templates (code, name, start_time, end_time, grace_minutes, crosses_day)
values ('ZC', '早班', '08:00', '17:00', 10, false), ('ZB', '中班', '12:00', '21:00', 10, false), ('WC', '晚班', '21:00', '06:00', 10, true)
on conflict (code) do nothing;

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.shift_templates enable row level security;
alter table public.schedule_imports enable row level security;
alter table public.schedules enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_daily_summaries enable row level security;
alter table public.approval_templates enable row level security;
alter table public.approval_template_steps enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_steps enable row level security;
alter table public.notifications enable row level security;

create or replace function private.has_role(role_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.profile_id = (select auth.uid())
      and r.code = role_code
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.has_role(text) to authenticated;

create policy "read own profile or admin" on public.profiles
for select using (id = (select auth.uid()) or private.has_role('admin') or private.has_role('hr'));

create policy "read organization dictionaries" on public.departments
for select using (auth.role() = 'authenticated');

create policy "read shift templates" on public.shift_templates
for select using (auth.role() = 'authenticated');

create policy "admin manage shift templates" on public.shift_templates
for all using (private.has_role('admin') or private.has_role('hr'))
with check (private.has_role('admin') or private.has_role('hr'));

create policy "read own schedules or admin" on public.schedules
for select using (profile_id = (select auth.uid()) or private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin manage schedules" on public.schedules
for all using (private.has_role('admin') or private.has_role('hr'))
with check (private.has_role('admin') or private.has_role('hr'));

create policy "read own attendance or admin" on public.attendance_records
for select using (profile_id = (select auth.uid()) or private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "insert own punch" on public.attendance_records
for insert with check (profile_id = (select auth.uid()));

create policy "read own summaries or admin" on public.attendance_daily_summaries
for select using (profile_id = (select auth.uid()) or private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "read approval templates" on public.approval_templates
for select using (auth.role() = 'authenticated');

create policy "admin manage approval templates" on public.approval_templates
for all using (private.has_role('admin') or private.has_role('hr'))
with check (private.has_role('admin') or private.has_role('hr'));

create policy "read approval template steps" on public.approval_template_steps
for select using (auth.role() = 'authenticated');

create policy "admin manage approval template steps" on public.approval_template_steps
for all using (private.has_role('admin') or private.has_role('hr'))
with check (private.has_role('admin') or private.has_role('hr'));

create policy "read own approvals or approver" on public.approval_requests
for select using (
  requester_id = (select auth.uid())
  or private.has_role('admin')
  or exists (
    select 1 from public.approval_steps s
    where s.request_id = approval_requests.id and s.approver_id = (select auth.uid())
  )
);

create policy "insert own approvals" on public.approval_requests
for insert with check (requester_id = (select auth.uid()));

create policy "read approval steps by requester or approver" on public.approval_steps
for select using (
  approver_id = (select auth.uid())
  or private.has_role('admin')
  or exists (
    select 1 from public.approval_requests ar
    where ar.id = approval_steps.request_id and ar.requester_id = (select auth.uid())
  )
);

create policy "read own notifications" on public.notifications
for select using (recipient_id = (select auth.uid()));

with template as (
  insert into public.approval_templates (name, request_type, is_active)
  values ('请假审批默认流程', 'leave', true)
  returning id
)
insert into public.approval_template_steps (template_id, step_order, name, approver_type, role_code)
select id, 1, '直属主管审批', 'direct_manager'::public.approver_type, null from template
union all
select id, 2, '部门负责人审批', 'department_head'::public.approver_type, null from template
union all
select id, 3, 'HR审批', 'role'::public.approver_type, 'hr' from template;
