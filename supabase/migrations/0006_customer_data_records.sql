alter type public.admin_dataset_type add value if not exists 'customer';

create table if not exists public.customer_records (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_no text,
  card_no text,
  phone text,
  email text,
  birthday date,
  tags text,
  channel text,
  referrer text,
  advisor text,
  last_consumed_on date,
  total_consumptions numeric(14, 2),
  created_on date,
  source text,
  org_unit text,
  remark text,
  raw_data jsonb not null default '{}'::jsonb,
  upload_id uuid references public.admin_data_uploads(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_records_created_org_idx on public.customer_records(created_on desc, org_unit);
create index if not exists customer_records_customer_no_idx on public.customer_records(customer_no);
create index if not exists customer_records_phone_idx on public.customer_records(phone);

alter table public.customer_records enable row level security;

drop policy if exists "admin roles read customer records" on public.customer_records;
create policy "admin roles read customer records" on public.customer_records
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

drop policy if exists "admin roles manage customer records" on public.customer_records;
create policy "admin roles manage customer records" on public.customer_records
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));
