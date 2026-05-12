insert into public.admin_view_configs (dataset, config)
values
  ('customer', '{
    "dataset": "customer",
    "title": "客户资料",
    "columns": [
      { "key": "customer_name", "label": "客户名称", "type": "text", "visible": true },
      { "key": "customer_no", "label": "客户编号", "type": "text", "visible": true },
      { "key": "phone", "label": "电话", "type": "text", "visible": true },
      { "key": "email", "label": "邮箱", "type": "text", "visible": true },
      { "key": "birthday", "label": "生日", "type": "date", "visible": true },
      { "key": "tags", "label": "客户标签", "type": "text", "visible": true },
      { "key": "channel", "label": "进店渠道", "type": "text", "visible": true },
      { "key": "advisor", "label": "顾问", "type": "text", "visible": true },
      { "key": "last_consumed_on", "label": "上次消费日期", "type": "date", "visible": true },
      { "key": "total_consumptions", "label": "总消费次数", "type": "number", "visible": true, "summary": "sum" },
      { "key": "created_on", "label": "创建日期", "type": "date", "visible": true },
      { "key": "source", "label": "创建来源", "type": "text", "visible": true },
      { "key": "org_unit", "label": "归属门店", "type": "text", "visible": true },
      { "key": "remark", "label": "备注", "type": "text", "visible": true }
    ],
    "filters": [
      { "key": "created_on", "label": "创建日期", "type": "dateRange" },
      { "key": "org_unit", "label": "归属门店", "type": "text" },
      { "key": "customer_name", "label": "客户名称", "type": "text" },
      { "key": "tags", "label": "客户标签", "type": "text" }
    ],
    "import": {
      "requiredColumns": ["customer_name", "customer_no"],
      "aliases": { "名称": "customer_name", "客户名称": "customer_name", "编号": "customer_no", "客户编号": "customer_no", "实体卡": "card_no", "电话": "phone", "手机号": "phone", "邮箱": "email", "生日": "birthday", "客户标签": "tags", "进店渠道": "channel", "推荐人": "referrer", "顾问": "advisor", "上次消费日期": "last_consumed_on", "总消费次数": "total_consumptions", "创建日期": "created_on", "创建来源": "source", "归属门店": "org_unit", "备注": "remark" }
    },
    "exportColumns": ["customer_name", "customer_no", "phone", "email", "birthday", "tags", "channel", "advisor", "last_consumed_on", "total_consumptions", "created_on", "source", "org_unit", "remark"]
  }'::jsonb)
on conflict (dataset) do update
set config = excluded.config,
    updated_at = now();
