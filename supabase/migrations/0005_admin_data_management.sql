create type public.admin_dataset_type as enum ('sales', 'redemption', 'expense');

create table public.admin_data_uploads (
  id uuid primary key default gen_random_uuid(),
  dataset public.admin_dataset_type not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  total_rows integer not null default 0,
  success_rows integer not null default 0,
  failed_rows integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.sales_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  org_unit text,
  employee_no text,
  person_name text,
  amount numeric(14, 2) not null default 0,
  quantity numeric(14, 2),
  category text,
  reference_no text,
  remark text,
  raw_data jsonb not null default '{}'::jsonb,
  upload_id uuid references public.admin_data_uploads(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.redemption_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  org_unit text,
  employee_no text,
  person_name text,
  amount numeric(14, 2) not null default 0,
  quantity numeric(14, 2),
  category text,
  reference_no text,
  remark text,
  raw_data jsonb not null default '{}'::jsonb,
  upload_id uuid references public.admin_data_uploads(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expense_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  org_unit text,
  employee_no text,
  person_name text,
  amount numeric(14, 2) not null default 0,
  quantity numeric(14, 2),
  category text,
  reference_no text,
  remark text,
  raw_data jsonb not null default '{}'::jsonb,
  upload_id uuid references public.admin_data_uploads(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_view_configs (
  id uuid primary key default gen_random_uuid(),
  dataset public.admin_dataset_type not null unique,
  config jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_data_uploads_dataset_created_idx on public.admin_data_uploads(dataset, created_at desc);
create index sales_records_date_org_idx on public.sales_records(record_date desc, org_unit);
create index sales_records_employee_idx on public.sales_records(employee_no);
create index redemption_records_date_org_idx on public.redemption_records(record_date desc, org_unit);
create index redemption_records_employee_idx on public.redemption_records(employee_no);
create index expense_records_date_org_idx on public.expense_records(record_date desc, org_unit);
create index expense_records_employee_idx on public.expense_records(employee_no);

alter table public.admin_data_uploads enable row level security;
alter table public.sales_records enable row level security;
alter table public.redemption_records enable row level security;
alter table public.expense_records enable row level security;
alter table public.admin_view_configs enable row level security;

create policy "admin roles read data uploads" on public.admin_data_uploads
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles manage data uploads" on public.admin_data_uploads
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles read sales records" on public.sales_records
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles manage sales records" on public.sales_records
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles read redemption records" on public.redemption_records
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles manage redemption records" on public.redemption_records
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles read expense records" on public.expense_records
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles manage expense records" on public.expense_records
for all using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin roles read view configs" on public.admin_view_configs
for select using (private.has_role('admin') or private.has_role('hr') or private.has_role('manager'));

create policy "admin and hr manage view configs" on public.admin_view_configs
for all using (private.has_role('admin') or private.has_role('hr'))
with check (private.has_role('admin') or private.has_role('hr'));

insert into public.admin_view_configs (dataset, config)
values
  ('sales', '{
    "dataset": "sales",
    "title": "销售数据",
    "columns": [
      { "key": "record_date", "label": "日期", "type": "date", "visible": true },
      { "key": "org_unit", "label": "门店/部门", "type": "text", "visible": true },
      { "key": "person_name", "label": "人员", "type": "text", "visible": true },
      { "key": "amount", "label": "销售额", "type": "number", "visible": true, "summary": "sum" },
      { "key": "quantity", "label": "销售数量", "type": "number", "visible": true, "summary": "sum" },
      { "key": "category", "label": "分类", "type": "text", "visible": true },
      { "key": "reference_no", "label": "单号", "type": "text", "visible": true },
      { "key": "remark", "label": "备注", "type": "text", "visible": true }
    ],
    "filters": [
      { "key": "record_date", "label": "日期", "type": "dateRange" },
      { "key": "org_unit", "label": "门店/部门", "type": "text" },
      { "key": "person_name", "label": "人员", "type": "text" },
      { "key": "category", "label": "分类", "type": "text" }
    ],
    "import": {
      "requiredColumns": ["record_date", "amount"],
      "aliases": { "日期": "record_date", "账务日期": "record_date", "操作时间": "record_date", "门店": "org_unit", "部门": "org_unit", "权益归属门店": "org_unit", "工号": "employee_no", "人员": "person_name", "姓名": "person_name", "员工": "person_name", "员工部门": "category", "销售额": "amount", "应收金额": "amount", "支付金额": "amount", "核算金额": "amount", "金额": "amount", "数量": "quantity", "销售数量": "quantity", "分类": "category", "单号": "reference_no", "单据编号": "reference_no", "备注": "remark", "名称": "remark" }
    },
    "exportColumns": ["record_date", "org_unit", "employee_no", "person_name", "amount", "quantity", "category", "reference_no", "remark"]
  }'::jsonb),
  ('redemption', '{
    "dataset": "redemption",
    "title": "核销数据",
    "columns": [
      { "key": "record_date", "label": "日期", "type": "date", "visible": true },
      { "key": "org_unit", "label": "门店/部门", "type": "text", "visible": true },
      { "key": "person_name", "label": "人员", "type": "text", "visible": true },
      { "key": "amount", "label": "核销金额", "type": "number", "visible": true, "summary": "sum" },
      { "key": "quantity", "label": "核销笔数", "type": "number", "visible": true, "summary": "sum" },
      { "key": "category", "label": "分类", "type": "text", "visible": true },
      { "key": "reference_no", "label": "核销单号", "type": "text", "visible": true },
      { "key": "remark", "label": "备注", "type": "text", "visible": true }
    ],
    "filters": [
      { "key": "record_date", "label": "日期", "type": "dateRange" },
      { "key": "org_unit", "label": "门店/部门", "type": "text" },
      { "key": "person_name", "label": "人员", "type": "text" },
      { "key": "category", "label": "分类", "type": "text" }
    ],
    "import": {
      "requiredColumns": ["record_date", "amount"],
      "aliases": { "日期": "record_date", "门店": "org_unit", "部门": "org_unit", "工号": "employee_no", "人员": "person_name", "姓名": "person_name", "核销金额": "amount", "金额": "amount", "核销笔数": "quantity", "数量": "quantity", "分类": "category", "核销单号": "reference_no", "单号": "reference_no", "备注": "remark" }
    },
    "exportColumns": ["record_date", "org_unit", "employee_no", "person_name", "amount", "quantity", "category", "reference_no", "remark"]
  }'::jsonb),
  ('expense', '{
    "dataset": "expense",
    "title": "费用数据",
    "columns": [
      { "key": "record_date", "label": "日期", "type": "date", "visible": true },
      { "key": "org_unit", "label": "门店/部门", "type": "text", "visible": true },
      { "key": "person_name", "label": "人员", "type": "text", "visible": true },
      { "key": "amount", "label": "费用金额", "type": "number", "visible": true, "summary": "sum" },
      { "key": "category", "label": "费用类型", "type": "text", "visible": true },
      { "key": "reference_no", "label": "单号", "type": "text", "visible": true },
      { "key": "remark", "label": "备注", "type": "text", "visible": true }
    ],
    "filters": [
      { "key": "record_date", "label": "日期", "type": "dateRange" },
      { "key": "org_unit", "label": "门店/部门", "type": "text" },
      { "key": "person_name", "label": "人员", "type": "text" },
      { "key": "category", "label": "费用类型", "type": "text" }
    ],
    "import": {
      "requiredColumns": ["record_date", "amount"],
      "aliases": { "日期": "record_date", "门店": "org_unit", "部门": "org_unit", "工号": "employee_no", "人员": "person_name", "姓名": "person_name", "费用金额": "amount", "金额": "amount", "费用类型": "category", "分类": "category", "单号": "reference_no", "备注": "remark" }
    },
    "exportColumns": ["record_date", "org_unit", "employee_no", "person_name", "amount", "category", "reference_no", "remark"]
  }'::jsonb)
on conflict (dataset) do nothing;
