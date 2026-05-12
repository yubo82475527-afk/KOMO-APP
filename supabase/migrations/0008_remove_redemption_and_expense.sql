delete from public.admin_view_configs
where dataset in ('redemption', 'expense');

delete from public.admin_data_uploads
where dataset in ('redemption', 'expense');

drop table if exists public.redemption_records;
drop table if exists public.expense_records;
