insert into public.admin_view_configs (dataset, config)
values
  ('target', '{
    "dataset": "target",
    "title": "目标数据",
    "columns": [
      { "key": "target_date", "label": "日期", "type": "date", "visible": true },
      { "key": "org_unit", "label": "门店", "type": "text", "visible": true },
      { "key": "target_new_customers", "label": "目标新客", "type": "number", "visible": true, "summary": "sum" },
      { "key": "target_equity_sales_amount", "label": "目标权益销售", "type": "number", "visible": true, "summary": "sum" },
      { "key": "target_service_sales_amount", "label": "目标项目销售", "type": "number", "visible": true, "summary": "sum" },
      { "key": "remark", "label": "备注", "type": "text", "visible": true }
    ],
    "filters": [
      { "key": "target_date", "label": "日期", "type": "dateRange" },
      { "key": "org_unit", "label": "门店", "type": "text" }
    ],
    "import": {
      "requiredColumns": ["target_date", "org_unit"],
      "aliases": { "日期": "target_date", "目标日期": "target_date", "门店": "org_unit", "归属门店": "org_unit", "目标新客": "target_new_customers", "新客目标": "target_new_customers", "目标权益销售": "target_equity_sales_amount", "权益销售目标": "target_equity_sales_amount", "目标项目销售": "target_service_sales_amount", "项目销售目标": "target_service_sales_amount", "备注": "remark" }
    },
    "exportColumns": ["target_date", "org_unit", "target_new_customers", "target_equity_sales_amount", "target_service_sales_amount", "remark"]
  }'::jsonb)
on conflict (dataset) do update
set config = excluded.config,
    updated_at = now();
