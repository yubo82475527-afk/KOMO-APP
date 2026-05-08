CSV columns:

```csv
工号,姓名,部门,2024/1/1,2024/1/2,2024/1/3
E001,张三,客服部,ZC,ZB,XIU
E002,李四,客服部,XIU,ZC,ZB
```

Shift codes: `ZC` early shift, `ZB` middle shift, `WC` night shift, `XIU` rest, `-` unscheduled.

Deploy:

```bash
supabase functions deploy import-schedule
```
