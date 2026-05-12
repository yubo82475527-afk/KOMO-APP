begin;

create temporary table tmp_department_seed (
  external_id text primary key,
  department_id uuid not null default gen_random_uuid(),
  shop_name text not null,
  parent_external_id text,
  created_at timestamptz not null,
  sort_order integer not null
) on commit drop;

insert into tmp_department_seed (external_id, shop_name, parent_external_id, created_at, sort_order)
values
  ('1', '国际总部', null, '2026-04-25 14:45:02.373365+08'::timestamptz, 1),
  ('2', '印尼总部', '1', '2026-04-25 15:15:30.549045+08'::timestamptz, 2),
  ('3', '巴西总部', '1', '2026-04-25 15:19:31.897813+08'::timestamptz, 3),
  ('4', 'KOMO Wellness MY', '1', '2026-04-25 15:15:30.613044+08'::timestamptz, 4),
  ('5', 'Singapore HQ', '1', '2026-04-25 15:15:30.644149+08'::timestamptz, 5),
  ('6', '泰国总部', '1', '2026-04-25 15:20:55.805331+08'::timestamptz, 6),
  ('2001', 'Jakarta - PIK Avenue', '2', '2026-04-25 15:22:11.335651+08'::timestamptz, 2001),
  ('2002', 'Surabaya - Pakuwon Mall', '2', '2026-04-25 15:22:34.482553+08'::timestamptz, 2002),
  ('3001', 'São Paulo - Unidade Morumbi', '3', '2026-04-25 15:22:54.262826+08'::timestamptz, 3001),
  ('3002', '巴西二店', '3', '2026-04-25 15:23:16.84835+08'::timestamptz, 3002),
  ('4001', 'Kuala Lumpur - Sri Petaling', '4', '2026-04-25 15:23:34.170976+08'::timestamptz, 4001),
  ('4002', 'Kuala Lumpur - 1 Utama Mall', '4', '2026-04-25 15:23:52.03074+08'::timestamptz, 4002),
  ('5001', 'Singapore - Wheelock Place', '5', '2026-04-25 15:24:29.816321+08'::timestamptz, 5001),
  ('6001', 'KOMO Bangkok - centralwOrld', '6', '2026-04-25 15:24:46.699152+08'::timestamptz, 6001);

delete from public.departments;

insert into public.departments (id, parent_id, head_id, name, sort_order, created_at)
select
  child.department_id,
  parent.department_id,
  null,
  child.shop_name,
  child.sort_order,
  child.created_at
from tmp_department_seed child
left join tmp_department_seed parent on parent.external_id = child.parent_external_id
order by child.sort_order;

commit;

-- Verification
-- select count(*) from public.departments;
-- select d.name, p.name as parent_name
-- from public.departments d
-- left join public.departments p on p.id = d.parent_id
-- order by d.sort_order, d.name;
