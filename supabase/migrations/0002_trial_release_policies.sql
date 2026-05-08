alter table public.schedule_imports
  add column if not exists updated_at timestamptz not null default now();

create index if not exists schedule_imports_uploaded_by_created_idx
  on public.schedule_imports(uploaded_by, created_at desc);

drop policy if exists "read roles dictionary" on public.roles;
create policy "read roles dictionary" on public.roles
for select using (auth.role() = 'authenticated');

drop policy if exists "read own roles or admin" on public.user_roles;
create policy "read own roles or admin" on public.user_roles
for select using (
  profile_id = (select auth.uid())
  or private.has_role('admin')
  or private.has_role('hr')
);

drop policy if exists "read own imports or admin" on public.schedule_imports;
create policy "read own imports or admin" on public.schedule_imports
for select using (
  uploaded_by = (select auth.uid())
  or private.has_role('admin')
  or private.has_role('hr')
);
