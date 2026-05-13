do $$
begin
  alter type public.admin_dataset_type add value if not exists 'exchange';
exception
  when duplicate_object then null;
end $$;

alter table public.departments
  add column if not exists org_type text not null default 'store' check (org_type in ('global', 'country', 'region', 'store')),
  add column if not exists country_code text,
  add column if not exists currency_code text;

update public.departments
set
  org_type = case
    when parent_id is null then 'global'
    when exists (select 1 from public.departments child where child.parent_id = departments.id) then 'country'
    else 'store'
  end,
  country_code = case
    when name ilike '%印尼%' or name ilike '%Jakarta%' or name ilike '%Surabaya%' then 'ID'
    when name ilike '%巴西%' or name ilike '%São%' or name ilike '%Sao%' then 'BR'
    when name ilike '%Malaysia%' or name ilike '%MY%' or name ilike '%Kuala Lumpur%' then 'MY'
    when name ilike '%Singapore%' then 'SG'
    when name ilike '%泰国%' or name ilike '%Thailand%' then 'TH'
    when parent_id is null then null
    else country_code
  end,
  currency_code = case
    when name ilike '%印尼%' or name ilike '%Jakarta%' or name ilike '%Surabaya%' then 'IDR'
    when name ilike '%巴西%' or name ilike '%São%' or name ilike '%Sao%' then 'BRL'
    when name ilike '%Malaysia%' or name ilike '%MY%' or name ilike '%Kuala Lumpur%' then 'MYR'
    when name ilike '%Singapore%' then 'SGD'
    when name ilike '%泰国%' or name ilike '%Thailand%' then 'THB'
    when parent_id is null then 'CNY'
    else currency_code
  end
where currency_code is null or country_code is null or org_type = 'store';

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  period_month date not null,
  from_currency text not null,
  to_currency text not null default 'CNY',
  rate numeric(18, 8) not null,
  source_file text,
  raw_data jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_month, from_currency, to_currency)
);

alter table public.sales_records
  add column if not exists currency_code text,
  add column if not exists exchange_rate_to_cny numeric(18, 8),
  add column if not exists amount_cny numeric(18, 2),
  add column if not exists receivable_amount_cny numeric(18, 2),
  add column if not exists payment_amount_cny numeric(18, 2),
  add column if not exists equity_amount_cny numeric(18, 2),
  add column if not exists service_amount_cny numeric(18, 2);

alter table public.store_daily_targets
  add column if not exists currency_code text,
  add column if not exists exchange_rate_to_cny numeric(18, 8),
  add column if not exists target_equity_sales_amount_cny numeric(18, 2),
  add column if not exists target_service_sales_amount_cny numeric(18, 2);

create index if not exists departments_currency_idx on public.departments(currency_code);
create index if not exists exchange_rates_month_currency_idx on public.exchange_rates(period_month desc, from_currency, to_currency);
create index if not exists sales_records_currency_idx on public.sales_records(currency_code);
create index if not exists store_daily_targets_currency_idx on public.store_daily_targets(currency_code);

alter table public.exchange_rates enable row level security;

drop policy if exists "admin roles read exchange rates" on public.exchange_rates;
create policy "admin roles read exchange rates" on public.exchange_rates
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

drop policy if exists "admin roles manage exchange rates" on public.exchange_rates;
create policy "admin roles manage exchange rates" on public.exchange_rates
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));
