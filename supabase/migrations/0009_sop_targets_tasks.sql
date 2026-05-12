alter type public.admin_dataset_type add value if not exists 'target';

create table if not exists public.store_daily_targets (
  id uuid primary key default gen_random_uuid(),
  target_date date not null,
  org_unit text not null,
  target_new_customers numeric(14, 2) not null default 0,
  target_equity_sales_amount numeric(14, 2) not null default 0,
  target_service_sales_amount numeric(14, 2) not null default 0,
  remark text,
  raw_data jsonb not null default '{}'::jsonb,
  upload_id uuid references public.admin_data_uploads(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_date, org_unit)
);

create table if not exists public.ops_tasks (
  id uuid primary key default gen_random_uuid(),
  task_date date not null,
  org_unit text not null,
  task_type text not null check (task_type in ('sales_alert', 'new_customer_alert', 'equity_sales_alert', 'service_sales_alert')),
  title text not null,
  summary text not null,
  reason_snapshot jsonb not null default '{}'::jsonb,
  assignee_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  due_at timestamptz,
  resolved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_daily_targets_date_org_idx on public.store_daily_targets(target_date desc, org_unit);
create index if not exists ops_tasks_date_status_idx on public.ops_tasks(task_date desc, status);
create index if not exists ops_tasks_org_status_idx on public.ops_tasks(org_unit, status);

alter table public.store_daily_targets enable row level security;
alter table public.ops_tasks enable row level security;

drop policy if exists "admin roles read store daily targets" on public.store_daily_targets;
create policy "admin roles read store daily targets" on public.store_daily_targets
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

drop policy if exists "admin roles manage store daily targets" on public.store_daily_targets;
create policy "admin roles manage store daily targets" on public.store_daily_targets
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

drop policy if exists "admin roles read ops tasks" on public.ops_tasks;
create policy "admin roles read ops tasks" on public.ops_tasks
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

drop policy if exists "admin roles manage ops tasks" on public.ops_tasks;
create policy "admin roles manage ops tasks" on public.ops_tasks
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));
