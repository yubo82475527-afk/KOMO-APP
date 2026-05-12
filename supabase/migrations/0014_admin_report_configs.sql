create table if not exists public.admin_report_configs (
  id uuid primary key default gen_random_uuid(),
  dataset public.admin_dataset_type not null,
  title text not null,
  kind text not null default 'detail' check (kind in ('detail', 'aggregate')),
  config jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_report_configs_dataset_idx on public.admin_report_configs(dataset, updated_at desc);
create index if not exists admin_report_configs_kind_idx on public.admin_report_configs(kind, updated_at desc);

alter table public.admin_report_configs enable row level security;

drop policy if exists "admin roles read report configs" on public.admin_report_configs;
create policy "admin roles read report configs" on public.admin_report_configs
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

drop policy if exists "admin and hr manage report configs" on public.admin_report_configs;
create policy "admin and hr manage report configs" on public.admin_report_configs
for all using (private.has_role('admin') or private.has_role('hr'))
with check (private.has_role('admin') or private.has_role('hr'));

insert into public.admin_report_configs (dataset, title, kind, config)
select
  dataset,
  coalesce(nullif(report_config ->> 'title', ''), report_config ->> 'id', '未命名报表'),
  case when report_config ->> 'kind' = 'aggregate' then 'aggregate' else 'detail' end,
  report_config
from public.admin_view_configs
cross join lateral jsonb_array_elements(coalesce(config -> 'reports', '[]'::jsonb)) as report_config
where jsonb_typeof(coalesce(config -> 'reports', '[]'::jsonb)) = 'array';

update public.admin_view_configs
set config = config - 'reports',
    updated_at = now()
where config ? 'reports';
