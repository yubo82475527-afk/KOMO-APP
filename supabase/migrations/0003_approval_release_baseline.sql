alter table public.approval_requests
  add column if not exists updated_at timestamptz not null default now();

create index if not exists approval_requests_status_submitted_idx
  on public.approval_requests(status, submitted_at desc);

create index if not exists approval_steps_request_status_order_idx
  on public.approval_steps(request_id, status, step_order);

update public.shift_templates
set name = case code
  when 'ZC' then '早班'
  when 'ZB' then '中班'
  when 'WC' then '晚班'
  else name
end
where code in ('ZC', 'ZB', 'WC');

update public.approval_templates
set name = '请假审批默认流程',
    updated_at = now()
where request_type = 'leave'
  and is_active = true;

update public.approval_template_steps
set name = case step_order
  when 1 then '直属主管审批'
  when 2 then '部门负责人审批'
  when 3 then 'HR 审批'
  else name
end
where template_id in (
  select id from public.approval_templates where request_type = 'leave' and is_active = true
);
