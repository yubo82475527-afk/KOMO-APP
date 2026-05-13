import type { AdminBusinessRecordInsert, AdminBusinessRecordRow, AdminCustomerRecordInsert, AdminCustomerRecordRow, Database, ExchangeRateInsert, ExchangeRateRow, Json, StoreDailyTargetInsert, StoreDailyTargetRow } from "@/lib/database.types";
import { applyOrgUnitScope, resolveAdminOrgScope } from "@/features/admin/admin-org-scope";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedAppContext } from "@/features/auth/app-context";
import { adminDatasets, defaultAdminReportConfigs, defaultAdminViewConfigs, normalizeAdminDataset, normalizeAdminReportDataset, normalizeAdminViewConfig, validateAdminReportConfig, validateAdminViewConfig } from "./admin-data-config";
import type {
  AdminAggregatedReportResult,
  AdminDataRecord,
  AdminDataset,
  AdminImportError,
  AdminImportPreview,
  AdminReportConfig,
  AdminReportConfigRecord,
  AdminReportFilters,
  AdminReportMeasure,
  AdminReportResult,
  AdminViewConfig,
} from "./admin-data-model";
import { parseCsv, toCsv } from "./csv";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type AdminContext =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      adminClient: AdminClient;
      profileId: string;
      profileDepartmentId: string | null;
      roles: string[];
    };

const salesTemplateKeys = [
  "sale_type",
  "sale_category",
  "item_no",
  "item_name",
  "standard_price",
  "receivable_amount",
  "payment_method",
  "payment_amount",
  "cash_payment_amount",
  "equity_payment_amount",
  "related_equity",
  "equity_book_change",
  "book_unit",
  "accounting_amount",
  "equity_store",
  "employee_name",
  "actual_performance",
  "assignment_type",
  "service_role",
  "employee_department",
  "customer_name",
  "customer_no",
  "customer_phone",
  "customer_email",
  "referrer",
  "document_no",
  "document_type",
  "customer_gender",
  "visit_channel",
  "cashier",
  "accounting_date",
  "operation_time",
] as const;

const salesHeaderAliases: Record<string, string> = {
  类型: "sale_type",
  分类: "sale_category",
  编号: "item_no",
  名称: "item_name",
  数量: "quantity",
  标准价: "standard_price",
  应收金额: "receivable_amount",
  支付方式: "payment_method",
  支付金额: "payment_amount",
  现金类支付: "cash_payment_amount",
  权益类支付: "equity_payment_amount",
  涉及权益: "related_equity",
  权益账面变动: "equity_book_change",
  账面单位: "book_unit",
  核算金额: "accounting_amount",
  权益归属门店: "equity_store",
  员工: "employee_name",
  实业绩: "actual_performance",
  指派类型: "assignment_type",
  服务角色: "service_role",
  员工部门: "employee_department",
  客户名称: "customer_name",
  客户编号: "customer_no",
  手机号: "customer_phone",
  邮箱: "customer_email",
  推荐人: "referrer",
  单据编号: "document_no",
  单据类型: "document_type",
  "男客/女客": "customer_gender",
  进店渠道: "visit_channel",
  收银员: "cashier",
  账务日期: "accounting_date",
  操作时间: "operation_time",
};

const writableRecordKeys = [
  "record_date",
  "org_unit",
  "employee_no",
  "person_name",
  "amount",
  "quantity",
  "category",
  "reference_no",
  "remark",
  ...salesTemplateKeys,
  "customer_name",
  "customer_no",
  "card_no",
  "phone",
  "email",
  "birthday",
  "tags",
  "channel",
  "referrer",
  "advisor",
  "last_consumed_on",
  "total_consumptions",
  "created_on",
  "source",
  "target_date",
  "target_new_customers",
  "target_equity_sales_amount",
  "target_service_sales_amount",
  "period_month",
  "from_currency",
  "to_currency",
  "rate",
  "source_file",
] as const;

export async function getAdminDataContext(): Promise<AdminContext> {
  const context = await getAuthenticatedAppContext();
  if (context.state !== "ready") {
    return context;
  }

  if (!context.roles.some((role) => role === "admin" || role === "hr" || role === "manager")) {
    return { state: "error", message: "当前账号没有管理端权限。" };
  }

  return {
    state: "ready",
    adminClient: context.adminClient,
    profileId: context.profile.id,
    profileDepartmentId: context.profile.department_id,
    roles: context.roles,
  };
}

export async function getAdminViewConfigs(adminClient = createSupabaseAdminClient()) {
  const { data } = await adminClient.from("admin_view_configs").select("dataset, config");
  const configs = { ...defaultAdminViewConfigs };

  (data ?? []).forEach((row) => {
    const dataset = normalizeAdminDataset(row.dataset);
    configs[dataset] = normalizeAdminViewConfig(row.config, dataset);
  });

  return configs;
}

export async function getAdminViewConfig(dataset: AdminDataset, adminClient = createSupabaseAdminClient()) {
  const configs = await getAdminViewConfigs(adminClient);
  return configs[dataset];
}

type AdminReportConfigRow = Database["public"]["Tables"]["admin_report_configs"]["Row"];

export async function getAdminReportConfigs(adminClient = createSupabaseAdminClient()): Promise<AdminReportConfigRecord[]> {
  const { data, error } = await adminClient.from("admin_report_configs").select("id, dataset, title, kind, config, updated_by, created_at, updated_at").order("updated_at", { ascending: false });
  if (error) return getDefaultAdminReportConfigRecords();
  if ((data ?? []).length > 0) {
    return (data ?? []).map((row) => normalizeAdminReportConfigRow(row));
  }

  return getDefaultAdminReportConfigRecords();
}

function getDefaultAdminReportConfigRecords(): AdminReportConfigRecord[] {
  const now = new Date().toISOString();
  return defaultAdminReportConfigs.map((config) => ({
    id: config.id,
    dataset: config.baseDataset,
    title: config.title,
    kind: config.kind ?? "detail",
    config: normalizeAdminReportConfig(config),
    updated_by: null,
    created_at: now,
    updated_at: now,
  }));
}

export async function getAdminReportConfig(reportId: string, adminClient = createSupabaseAdminClient()): Promise<AdminReportConfigRecord | null> {
  const { data } = await adminClient
    .from("admin_report_configs")
    .select("id, dataset, title, kind, config, updated_by, created_at, updated_at")
    .eq("id", reportId)
    .maybeSingle<AdminReportConfigRow>();

  if (data) {
    return normalizeAdminReportConfigRow(data);
  }

  const records = await getAdminReportConfigs(adminClient);
  const record = records.find((item) => item.id === reportId || item.config.id === reportId);
  if (record) return record;

  const fallback = defaultAdminReportConfigs.find((config) => config.id === reportId);
  return fallback
    ? {
        id: fallback.id,
        dataset: fallback.baseDataset,
        title: fallback.title,
        kind: fallback.kind ?? "detail",
        config: normalizeAdminReportConfig(fallback),
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;
}

export async function saveAdminReportConfig(input: { config: AdminReportConfig; id?: string }) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return context;
  }
  if (!context.roles.includes("admin") && !context.roles.includes("hr")) {
    return { state: "error" as const, message: "只有 admin 或 hr 可以保存报表模板。" };
  }

  const normalized = normalizeAdminReportConfig(input.config);
  const validationErrors = validateAdminReportConfig(normalized);
  if (validationErrors.length > 0) {
    return { state: "error" as const, message: validationErrors[0] };
  }
  if (false) {
    return { state: "error" as const, message: "报表模板 dataset 必须和当前数据类型一致。" };
  }

  const record: Database["public"]["Tables"]["admin_report_configs"]["Insert"] = {
    dataset: normalized.baseDataset,
    title: normalized.title,
    kind: normalized.kind ?? "detail",
    config: normalized as unknown as Json,
    updated_by: context.profileId,
    updated_at: new Date().toISOString(),
  };
  if (input.id && isUuid(input.id)) {
    record.id = input.id;
  }

  const { data, error } = await context.adminClient
    .from("admin_report_configs")
    .upsert(record, { onConflict: "id" })
    .select("id, dataset, title, kind, config, updated_by, created_at, updated_at")
    .single<AdminReportConfigRow>();

  if (error || !data) {
    return { state: "error" as const, message: error?.message ?? "保存报表模板失败。" };
  }

  return { state: "success" as const, config: normalizeAdminReportConfigRow(data) };
}

export async function createAdminReportConfig() {
  return saveAdminReportConfig({
    config: {
      id: `custom_report_${Date.now()}`,
      title: "新建报表模板",
      kind: "detail",
      description: "通过 JSON 配置这个报表的字段、筛选和展示方式。",
      baseDataset: "sales",
      columns: [
        { key: "record_date", label: "日期", type: "date" },
        { key: "org_unit", label: "门店", type: "text" },
        { key: "amount", label: "金额", type: "number" },
      ],
      defaultSort: { key: "record_date", direction: "desc" },
    },
  });
}

export async function deleteAdminReportConfig(reportId: string) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return context;
  }
  if (!context.roles.includes("admin") && !context.roles.includes("hr")) {
    return { state: "error" as const, message: "只有 admin 或 hr 可以删除报表模板。" };
  }

  const { error } = await context.adminClient.from("admin_report_configs").delete().eq("id", reportId);
  if (error) {
    return { state: "error" as const, message: error.message };
  }

  return { state: "success" as const };
}

export async function duplicateAdminReportConfig(reportId: string) {
  const source = await getAdminReportConfig(reportId);
  if (!source) {
    return { state: "error" as const, message: "找不到要复制的报表模板。" };
  }
  return saveAdminReportConfig({
    config: {
      ...source.config,
      id: `${source.config.id}-copy`,
      title: `${source.config.title} 副本`,
    },
  });
}

function normalizeAdminReportConfigRow(row: AdminReportConfigRow): AdminReportConfigRecord {
  const dataset = normalizeAdminReportDataset(row.dataset);
  const config = normalizeAdminReportConfig(row.config, dataset);
  return {
    id: row.id,
    dataset,
    title: row.title,
    kind: row.kind,
    config,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeAdminReportConfig(value: unknown, fallbackDataset?: AdminDataset): AdminReportConfig {
  const candidate = value && typeof value === "object" ? (value as Partial<AdminReportConfig>) : {};
  const dataset = normalizeAdminReportDataset(candidate.baseDataset ?? fallbackDataset);
  const fallback = defaultAdminReportConfigs.find((item) => item.id === candidate.id) ?? defaultAdminReportConfigs.find((item) => item.baseDataset === dataset) ?? defaultAdminReportConfigs[0];

  return {
    ...fallback,
    ...candidate,
    id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : fallback.id,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : fallback.title,
    kind: candidate.kind === "aggregate" ? "aggregate" : "detail",
    baseDataset: dataset,
    filters: Array.isArray(candidate.filters) ? candidate.filters : fallback.filters,
    joins: Array.isArray(candidate.joins) ? candidate.joins : fallback.joins,
    dimensions: Array.isArray(candidate.dimensions) ? candidate.dimensions : fallback.dimensions,
    measures: Array.isArray(candidate.measures) ? candidate.measures : fallback.measures,
    columns: Array.isArray(candidate.columns) && candidate.columns.length > 0 ? candidate.columns : fallback.columns,
    exportColumns: Array.isArray(candidate.exportColumns) ? candidate.exportColumns : fallback.exportColumns,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseAdminDataCsv(input: { dataset: AdminDataset; fileName: string; csvText: string; config: AdminViewConfig }): AdminImportPreview {
  const { headers, rows } = parseCsv(input.csvText);
  const normalizedHeaders = headers.map((header) => normalizeHeader(header, input.dataset, input.config));
  const errors: AdminImportError[] = [];
  const parsedRows: AdminDataRecord[] = [];

  if (headers.length === 0) {
    errors.push({ row: 1, message: "CSV 文件为空或缺少表头。" });
  }

  if (headers.length > 0 && rows.length === 0) {
    errors.push({ row: 2, message: "没有读取到数据行，请确认文件中表头下面至少有一行数据，并重新保存后上传。" });
  }

  input.config.import.requiredColumns.forEach((key) => {
    if (!normalizedHeaders.includes(key)) {
      errors.push({ row: 1, column: key, message: `缺少必填列：${key}` });
    }
  });

  rows.forEach((values, rowIndex) => {
    const raw: Record<string, string> = {};
    const rawOriginal: Record<string, string> = {};
    const normalizedSources: Record<string, string> = {};
    normalizedHeaders.forEach((key, index) => {
      const originalHeader = headers[index] ?? "";
      const value = values[index] ?? "";
      if (originalHeader) {
        rawOriginal[originalHeader] = value;
      }
      if (!key) return;
      if (shouldUseNormalizedValue(input.dataset, key, normalizedSources[key], originalHeader, raw[key], value)) {
        raw[key] = value;
        normalizedSources[key] = originalHeader;
      }
    });

    const rowNumber = rowIndex + 2;
    if (input.dataset === "exchange") {
      const periodMonth = normalizeMonth(raw.period_month || raw.record_date);
      const fromCurrency = normalizeCurrency(raw.from_currency || raw.currency_code);
      const toCurrency = normalizeCurrency(raw.to_currency) || "CNY";
      const rate = normalizeOptionalNumber(raw.rate ?? raw.amount);

      if (!periodMonth) {
        errors.push({ row: rowNumber, column: "period_month", message: "月份不能为空，请使用 YYYY-MM 或 YYYY-MM-DD。" });
      }
      if (!fromCurrency) {
        errors.push({ row: rowNumber, column: "from_currency", message: "源币种不能为空。" });
      }
      if (rate === null || rate <= 0) {
        errors.push({ row: rowNumber, column: "rate", message: "汇率必须是大于 0 的数字。" });
      }
      if (!periodMonth || !fromCurrency || rate === null || rate <= 0) {
        return;
      }

      parsedRows.push({
        period_month: periodMonth,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate,
        source_file: input.fileName,
        org_unit: null,
        employee_no: null,
        person_name: null,
        quantity: null,
        category: null,
        reference_no: `${periodMonth}:${fromCurrency}:${toCurrency}`,
        remark: null,
        raw_data: rawOriginal,
      });
      return;
    }

    if (input.dataset === "target") {
      const targetDate = normalizeDate(raw.target_date);
      const orgUnit = normalizeNullableText(raw.org_unit);
      const targetNewCustomers = normalizeOptionalNumber(raw.target_new_customers) ?? 0;
      const targetEquitySales = normalizeOptionalNumber(raw.target_equity_sales_amount) ?? 0;
      const targetServiceSales = normalizeOptionalNumber(raw.target_service_sales_amount) ?? 0;

      if (!targetDate) {
        errors.push({ row: rowNumber, column: "target_date", message: "日期格式无效，请使用 YYYY-MM-DD。" });
      }
      if (!orgUnit) {
        errors.push({ row: rowNumber, column: "org_unit", message: "门店不能为空。" });
      }
      if (raw.target_new_customers && normalizeOptionalNumber(raw.target_new_customers) === null) {
        errors.push({ row: rowNumber, column: "target_new_customers", message: "目标新客必须是数字。" });
      }
      if (raw.target_equity_sales_amount && normalizeOptionalNumber(raw.target_equity_sales_amount) === null) {
        errors.push({ row: rowNumber, column: "target_equity_sales_amount", message: "目标权益销售必须是数字。" });
      }
      if (raw.target_service_sales_amount && normalizeOptionalNumber(raw.target_service_sales_amount) === null) {
        errors.push({ row: rowNumber, column: "target_service_sales_amount", message: "目标项目销售必须是数字。" });
      }
      if (!targetDate || !orgUnit) {
        return;
      }

      parsedRows.push({
        target_date: targetDate,
        org_unit: orgUnit,
        employee_no: null,
        person_name: null,
        quantity: targetNewCustomers,
        category: null,
        reference_no: null,
        remark: normalizeNullableText(raw.remark),
        target_new_customers: targetNewCustomers,
        target_equity_sales_amount: targetEquitySales,
        target_service_sales_amount: targetServiceSales,
        raw_data: rawOriginal,
      });
      return;
    }

    if (input.dataset === "customer") {
      const customerName = normalizeNullableText(raw.customer_name);
      const totalConsumptions = normalizeOptionalNumber(raw.total_consumptions);

      if (!customerName) {
        errors.push({ row: rowNumber, column: "customer_name", message: "客户名称不能为空。" });
      }
      if (!normalizeNullableText(raw.customer_no)) {
        errors.push({ row: rowNumber, column: "customer_no", message: "客户编号不能为空。" });
      }
      if (raw.total_consumptions && totalConsumptions === null) {
        errors.push({ row: rowNumber, column: "total_consumptions", message: "总消费次数必须是数字。" });
      }
      if (!customerName || !normalizeNullableText(raw.customer_no) || (raw.total_consumptions && totalConsumptions === null)) {
        return;
      }

      parsedRows.push({
        customer_name: customerName,
        customer_no: normalizeNullableText(raw.customer_no),
        card_no: normalizeNullableText(raw.card_no),
        phone: normalizeNullableText(raw.phone),
        email: normalizeNullableText(raw.email),
        birthday: normalizeOptionalDate(raw.birthday),
        tags: normalizeNullableText(raw.tags),
        channel: normalizeNullableText(raw.channel),
        referrer: normalizeNullableText(raw.referrer),
        advisor: normalizeNullableText(raw.advisor),
        last_consumed_on: normalizeOptionalDate(raw.last_consumed_on),
        total_consumptions: totalConsumptions,
        created_on: normalizeOptionalDate(raw.created_on),
        source: normalizeNullableText(raw.source),
        org_unit: normalizeNullableText(raw.org_unit),
        employee_no: null,
        person_name: normalizeNullableText(raw.customer_name),
        quantity: null,
        category: normalizeNullableText(raw.tags),
        reference_no: normalizeNullableText(raw.customer_no),
        remark: normalizeNullableText(raw.remark),
        raw_data: rawOriginal,
      });
      return;
    }

    const accountingDate = normalizeOptionalDate(raw.accounting_date);
    const operationTime = normalizeOptionalTimestamp(raw.operation_time);
    const recordDate = normalizeDate(raw.record_date) || accountingDate || normalizeDate(raw.operation_time);
    const paymentAmount = normalizeOptionalNumber(raw.payment_amount);
    const receivableAmount = normalizeOptionalNumber(raw.receivable_amount);
    const accountingAmount = normalizeOptionalNumber(raw.accounting_amount);
    const amount = normalizeNumber(raw.amount) ?? paymentAmount ?? receivableAmount ?? accountingAmount;
    const quantity = normalizeOptionalNumber(raw.quantity);
    const standardPrice = normalizeOptionalNumber(raw.standard_price);
    const cashPaymentAmount = normalizeOptionalNumber(raw.cash_payment_amount);
    const equityPaymentAmount = normalizeOptionalNumber(raw.equity_payment_amount);
    const equityBookChange = normalizeOptionalNumber(raw.equity_book_change);
    const actualPerformance = normalizeOptionalNumber(raw.actual_performance);

    if (!recordDate) {
      errors.push({ row: rowNumber, column: "record_date", message: "日期格式无效，请使用 YYYY-MM-DD。" });
    }
    if (amount === null) {
      errors.push({ row: rowNumber, column: "amount", message: "金额必须是数字。" });
    }
    if (raw.quantity && quantity === null) {
      errors.push({ row: rowNumber, column: "quantity", message: "数量必须是数字。" });
    }

    const numberChecks: Array<{ column: keyof typeof raw; value: number | null; message: string }> = [
      { column: "standard_price", value: standardPrice, message: "标准价必须是数字。" },
      { column: "receivable_amount", value: receivableAmount, message: "应收金额必须是数字。" },
      { column: "payment_amount", value: paymentAmount, message: "支付金额必须是数字。" },
      { column: "cash_payment_amount", value: cashPaymentAmount, message: "现金类支付必须是数字。" },
      { column: "equity_payment_amount", value: equityPaymentAmount, message: "权益类支付必须是数字。" },
      { column: "equity_book_change", value: equityBookChange, message: "权益账面变动必须是数字。" },
      { column: "accounting_amount", value: accountingAmount, message: "核算金额必须是数字。" },
      { column: "actual_performance", value: actualPerformance, message: "实业绩必须是数字。" },
    ];
    numberChecks.forEach(({ column, value, message }) => {
      if (raw[column] && value === null) {
        errors.push({ row: rowNumber, column, message });
      }
    });
    if (raw.operation_time && !operationTime) {
      errors.push({ row: rowNumber, column: "operation_time", message: "操作时间格式无效。" });
    }

    if (!recordDate || amount === null || (raw.quantity && quantity === null) || (raw.operation_time && !operationTime)) {
      return;
    }

    parsedRows.push({
      record_date: recordDate,
      org_unit: normalizeNullableText(raw.org_unit) ?? normalizeNullableText(raw.equity_store),
      employee_no: normalizeNullableText(raw.employee_no),
      person_name: normalizeNullableText(raw.person_name) ?? normalizeNullableText(raw.employee_name),
      amount,
      quantity,
      category: normalizeNullableText(raw.category) ?? normalizeNullableText(raw.employee_department) ?? normalizeNullableText(raw.sale_category) ?? normalizeNullableText(raw.sale_type),
      reference_no: normalizeNullableText(raw.reference_no) ?? normalizeNullableText(raw.document_no),
      remark: normalizeNullableText(raw.remark) ?? normalizeNullableText(raw.item_name),
      sale_type: normalizeNullableText(raw.sale_type),
      sale_category: normalizeNullableText(raw.sale_category),
      item_no: normalizeNullableText(raw.item_no),
      item_name: normalizeNullableText(raw.item_name),
      standard_price: standardPrice,
      receivable_amount: receivableAmount,
      payment_method: normalizeNullableText(raw.payment_method),
      payment_amount: paymentAmount,
      cash_payment_amount: cashPaymentAmount,
      equity_payment_amount: equityPaymentAmount,
      related_equity: normalizeNullableText(raw.related_equity),
      equity_book_change: equityBookChange,
      book_unit: normalizeNullableText(raw.book_unit),
      accounting_amount: accountingAmount,
      equity_store: normalizeNullableText(raw.equity_store),
      employee_name: normalizeNullableText(raw.employee_name),
      actual_performance: actualPerformance,
      assignment_type: normalizeNullableText(raw.assignment_type),
      service_role: normalizeNullableText(raw.service_role),
      employee_department: normalizeNullableText(raw.employee_department),
      customer_name: normalizeNullableText(raw.customer_name),
      customer_no: normalizeNullableText(raw.customer_no),
      customer_phone: normalizeNullableText(raw.customer_phone),
      customer_email: normalizeNullableText(raw.customer_email),
      referrer: normalizeNullableText(raw.referrer),
      document_no: normalizeNullableText(raw.document_no),
      document_type: normalizeNullableText(raw.document_type),
      customer_gender: normalizeNullableText(raw.customer_gender),
      visit_channel: normalizeNullableText(raw.visit_channel),
      cashier: normalizeNullableText(raw.cashier),
      accounting_date: accountingDate,
      operation_time: operationTime,
      raw_data: rawOriginal,
    });
  });

  return {
    dataset: input.dataset,
    fileName: input.fileName,
    rows: parsedRows,
    totalRows: rows.length,
    validRows: parsedRows.length,
    invalidRows: errors.filter((error) => error.row > 1).length,
    errors,
    config: input.config,
  };
}

export async function commitAdminDataImport(input: { dataset: AdminDataset; fileName: string; rows: AdminDataRecord[] }) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return context;
  }

  const { data: upload, error: uploadError } = await context.adminClient
    .from("admin_data_uploads")
    .insert({
      dataset: input.dataset,
      uploaded_by: context.profileId,
      file_name: input.fileName,
      total_rows: input.rows.length,
      success_rows: 0,
      failed_rows: 0,
      errors: [],
    })
    .select("id")
    .single<{ id: string }>();

  if (uploadError || !upload) {
    return { state: "error" as const, message: uploadError?.message ?? "创建上传批次失败。" };
  }

  let committedRows = input.rows.length;
  let insertError: { message: string } | null = null;

  if (input.dataset === "exchange") {
    insertError = (
      await context.adminClient.from("exchange_rates").upsert(
        input.rows.map((row) => ({
          ...pickWritableExchangeRate(row),
          source_file: input.fileName,
          uploaded_by: context.profileId,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "period_month,from_currency,to_currency" },
      )
    ).error;
  } else if (input.dataset === "target") {
    const enrichedRows = await enrichTargetRowsWithCurrency(context.adminClient, input.rows);
    if ("state" in enrichedRows) {
      insertError = { message: enrichedRows.message ?? "目标数据币种折算失败。" };
    } else {
      insertError = (
        await context.adminClient.from("store_daily_targets").upsert(
          enrichedRows.rows.map((row) => ({
            ...pickWritableTargetRecord(row),
            upload_id: upload.id,
            created_by: context.profileId,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "target_date,org_unit" },
        )
      ).error;
    }
  } else if (input.dataset === "customer") {
    const rows = dedupeCustomerRows(input.rows);
    committedRows = rows.length;
    const refreshError = await deleteExistingCustomerRows(context.adminClient, rows);
    insertError =
      refreshError ??
      (
        await context.adminClient.from("customer_records").insert(
          rows.map((row) => ({
            ...pickWritableCustomerRecord(row),
            upload_id: upload.id,
            created_by: context.profileId,
          })),
        )
      ).error;
  } else {
    const enrichedRows = await enrichSalesRowsWithCurrency(context.adminClient, input.rows);
    if ("state" in enrichedRows) {
      insertError = { message: enrichedRows.message ?? "销售数据币种折算失败。" };
    } else {
      const refreshError = await deleteExistingSalesRows(context.adminClient, enrichedRows.rows);
      insertError =
        refreshError ??
        (
          await context.adminClient.from("sales_records").insert(
            enrichedRows.rows.map((row) => ({
              ...pickWritableRecord(row),
              upload_id: upload.id,
              created_by: context.profileId,
            })),
          )
        ).error;
    }
  }

  if (insertError) {
    await context.adminClient.from("admin_data_uploads").update({ failed_rows: input.rows.length, errors: [{ message: insertError.message }] }).eq("id", upload.id);
    return { state: "error" as const, message: insertError.message };
  }

  await context.adminClient
    .from("admin_data_uploads")
    .update({ success_rows: committedRows, failed_rows: 0, errors: [] })
    .eq("id", upload.id);

  return { state: "success" as const, uploadId: upload.id, successRows: committedRows };
}

export async function listAdminDataRecords(filters: AdminReportFilters): Promise<AdminReportResult | AdminAggregatedReportResult | { state: "signed_out" } | { state: "error"; message: string }> {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return context;
  }

  const reportRecord = filters.reportId ? await getAdminReportConfig(filters.reportId, context.adminClient) : null;
  const dataset = reportRecord?.config.baseDataset ?? normalizeAdminDataset(filters.dataset);
  const config = await getAdminViewConfig(dataset, context.adminClient);
  const report = reportRecord?.config ?? null;
  if (report?.kind === "aggregate") {
    return listAdminAggregatedReport({ ...filters, dataset });
  }
  const scope = await resolveAdminOrgScope(context, filters.scopeDepartmentId);
  if (scope.state === "error") return scope;
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = buildFilteredQuery(context.adminClient, dataset, filters, "*", { count: "exact" }, scope);
  query =
    dataset === "exchange"
      ? query.order("period_month", { ascending: false }).order("from_currency", { ascending: true }).range(from, to)
      : dataset === "customer"
      ? query.order("created_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).range(from, to)
      : dataset === "target"
        ? query.order("target_date", { ascending: false }).order("created_at", { ascending: false }).range(from, to)
        : query.order("record_date", { ascending: false }).order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return { state: "error", message: error.message };
  }

  const summary = await getAdminDataSummary(context.adminClient, dataset, filters, scope);
  return {
    mode: "detail",
    dataset,
    config,
    report: report ?? undefined,
    columns: report?.columns ?? config.columns,
    rows:
      dataset === "exchange"
        ? ((data ?? []) as unknown as ExchangeRateRow[]).map(mapExchangeRateRow)
        : dataset === "customer"
        ? ((data ?? []) as unknown as AdminCustomerRecordRow[]).map(mapCustomerRow)
        : dataset === "target"
          ? ((data ?? []) as unknown as StoreDailyTargetRow[]).map(mapTargetRow)
          : ((data ?? []) as unknown as AdminBusinessRecordRow[]).map(mapBusinessRow),
    total: count ?? 0,
    page,
    pageSize,
    summary,
  };
}

export async function listAdminAggregatedReport(filters: AdminReportFilters): Promise<AdminAggregatedReportResult | { state: "signed_out" } | { state: "error"; message: string }> {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return context;
  }

  const reportRecord = filters.reportId ? await getAdminReportConfig(filters.reportId, context.adminClient) : null;
  const dataset = reportRecord?.config.baseDataset ?? normalizeAdminDataset(filters.dataset);
  const config = await getAdminViewConfig(dataset, context.adminClient);
  const report = reportRecord?.config ?? null;
  if (!report) {
    return { state: "error", message: "没有可用的汇总报表模板。" };
  }
  if (report.baseDataset !== dataset) {
    return { state: "error", message: "报表模板的 baseDataset 必须和当前数据类型一致。" };
  }

  const scope = await resolveAdminOrgScope(context, filters.scopeDepartmentId);
  if (scope.state === "error") return scope;

  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 200);
  const aggregate = await buildAggregatedReportRows(context.adminClient, report, filters, scope);
  if ("state" in aggregate) return aggregate;

  const sortedRows = sortAggregatedRows(aggregate.rows, report);
  const from = (page - 1) * pageSize;
  const pagedRows = sortedRows.slice(from, from + pageSize);

  return {
    mode: "report",
    dataset,
    config,
    report,
    columns: report.columns,
    rows: pagedRows,
    total: sortedRows.length,
    page,
    pageSize,
    summary: aggregate.summary,
  };
}

export async function exportAdminDataCsv(filters: AdminReportFilters) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return context;
  }

  const reportRecord = filters.reportId ? await getAdminReportConfig(filters.reportId, context.adminClient) : null;
  const dataset = reportRecord?.config.baseDataset ?? normalizeAdminDataset(filters.dataset);
  const config = await getAdminViewConfig(dataset, context.adminClient);
  const report = reportRecord?.config ?? null;
  if (report?.kind === "aggregate") {
    return exportAdminAggregatedReportCsv({ ...filters, dataset });
  }
  const scope = await resolveAdminOrgScope(context, filters.scopeDepartmentId);
  if (scope.state === "error") return scope;
  const query = buildFilteredQuery(context.adminClient, dataset, filters, "*", undefined, scope);
  const { data, error } = await (
    dataset === "exchange"
      ? query.order("period_month", { ascending: false }).order("from_currency", { ascending: true })
      : dataset === "customer"
      ? query.order("created_on", { ascending: false, nullsFirst: false })
      : dataset === "target"
        ? query.order("target_date", { ascending: false })
        : query.order("record_date", { ascending: false })
  ).limit(5000);

  if (error) {
    return { state: "error" as const, message: error.message };
  }

  const columns = report?.columns?.length ? report.columns.map((column) => column.key) : config.exportColumns;
  const labelMap = new Map((report?.columns?.length ? report.columns : config.columns).map((column) => [column.key, column.label]));
  const headers = columns.map((key) => labelMap.get(key) ?? key);
  const rows = ((data ?? []) as unknown as Array<AdminBusinessRecordRow | AdminCustomerRecordRow | StoreDailyTargetRow | ExchangeRateRow>).map((row) => columns.map((key) => formatRecordValue(row, key)));

  return {
    state: "success" as const,
    fileName: `${dataset}-records.csv`,
    csv: toCsv(headers, rows),
  };
}

export async function exportAdminAggregatedReportCsv(filters: AdminReportFilters) {
  const result = await listAdminAggregatedReport({ ...filters, page: 1, pageSize: 10000 });
  if ("state" in result) return result;

  return {
    state: "success" as const,
    fileName: `${result.dataset}-${result.report.id}.csv`,
    csv: toCsv(
      result.columns.map((column) => column.label),
      result.rows.map((row) => result.columns.map((column) => row[column.key])),
    ),
  };
}

export async function saveAdminViewConfig(input: { dataset: AdminDataset; config: AdminViewConfig }) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return context;
  }

  if (!context.roles.includes("admin") && !context.roles.includes("hr")) {
    return { state: "error" as const, message: "只有 admin 或 hr 可以保存配置。" };
  }

  const config = normalizeAdminViewConfig(input.config, input.dataset);
  const validationErrors = validateAdminViewConfig(config);
  if (validationErrors.length > 0) {
    return { state: "error" as const, message: validationErrors[0] };
  }
  const { error } = await context.adminClient.from("admin_view_configs").upsert(
    {
      dataset: input.dataset,
      config: config as unknown as Json,
      updated_by: context.profileId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "dataset" },
  );

  if (error) {
    return { state: "error" as const, message: error.message };
  }

  return { state: "success" as const, config };
}

export { adminDatasets, defaultAdminViewConfigs, normalizeAdminDataset };

type ReportSourceRows = Record<string, AdminDataRecord | null>;
type ReportAggregateBucket = {
  values: Record<string, string | number | null>;
  distinct: Record<string, Set<string>>;
};

async function buildAggregatedReportRows(
  adminClient: AdminClient,
  report: AdminReportConfig,
  filters: AdminReportFilters,
  scope: Awaited<ReturnType<typeof resolveAdminOrgScope>>,
): Promise<{ rows: Array<Record<string, string | number | null>>; summary: AdminAggregatedReportResult["summary"] } | { state: "error"; message: string }> {
  const baseRowsResult = await loadReportDatasetRows(adminClient, report.baseDataset, filters, scope);
  if ("state" in baseRowsResult) return baseRowsResult;

  const joinLookups = new Map<string, { join: NonNullable<AdminReportConfig["joins"]>[number]; rowsByKey: Map<string, AdminDataRecord> }>();
  for (const join of report.joins ?? []) {
    const joinRowsResult = await loadReportDatasetRows(adminClient, join.dataset, { dataset: join.dataset, scopeDepartmentId: filters.scopeDepartmentId }, scope);
    if ("state" in joinRowsResult) return joinRowsResult;
    const rowsByKey = new Map<string, AdminDataRecord>();
    joinRowsResult.rows.forEach((row) => {
      const key = getRecordTextValue(row, join.rightKey);
      if (key && !rowsByKey.has(key)) rowsByKey.set(key, row);
    });
    joinLookups.set(join.alias, { join, rowsByKey });
  }

  const buckets = new Map<string, ReportAggregateBucket>();
  const totalDistinct = new Map<string, Set<string>>();
  const totalValues = new Map<string, number>();

  for (const base of baseRowsResult.rows) {
    const sources: ReportSourceRows = { base };
    let shouldSkip = false;
    for (const { join, rowsByKey } of joinLookups.values()) {
      const leftKey = getRecordTextValue(base, join.leftKey);
      const joinedRow = leftKey ? rowsByKey.get(leftKey) ?? null : null;
      if (!joinedRow && join.type === "inner") {
        shouldSkip = true;
        break;
      }
      sources[join.alias] = joinedRow;
    }
    if (shouldSkip) continue;

    const dimensionsList = report.dimensions ?? [];
    const measuresList = report.measures ?? [];
    const dimensions = Object.fromEntries(dimensionsList.map((dimension) => [dimension.key, getSourceFieldValue(sources, dimension.source, dimension.field)])) as Record<string, string | number | null>;
    const bucketKey = dimensionsList.map((dimension) => String(dimensions[dimension.key] ?? "")).join("\u0001");
    const bucket = buckets.get(bucketKey) ?? {
      values: { ...dimensions },
      distinct: {},
    };

    measuresList.forEach((measure) => {
      applyMeasure(bucket, measure, sources);
      applyTotalMeasure(totalValues, totalDistinct, measure, sources);
    });
    buckets.set(bucketKey, bucket);
  }

  const rows = [...buckets.values()].map((bucket) => {
    const row = { ...bucket.values };
    (report.measures ?? []).forEach((measure) => {
      if (measure.type === "countDistinct") {
        row[measure.key] = bucket.distinct[measure.key]?.size ?? 0;
      }
    });
    return row;
  });

  const summary = (report.measures ?? []).map((measure) => ({
    key: measure.key,
    label: measure.label,
    value: measure.type === "countDistinct" ? totalDistinct.get(measure.key)?.size ?? 0 : totalValues.get(measure.key) ?? 0,
  }));

  return { rows, summary };
}

async function loadReportDatasetRows(
  adminClient: AdminClient,
  dataset: AdminDataset,
  filters: AdminReportFilters,
  scope: Awaited<ReturnType<typeof resolveAdminOrgScope>>,
): Promise<{ rows: AdminDataRecord[] } | { state: "error"; message: string }> {
  const query = buildFilteredQuery(adminClient, dataset, { ...filters, dataset }, "*", undefined, scope).limit(10000);
  const orderedQuery =
    dataset === "exchange"
      ? query.order("period_month", { ascending: false }).order("from_currency", { ascending: true })
      : dataset === "customer"
      ? query.order("created_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })
      : dataset === "target"
        ? query.order("target_date", { ascending: false }).order("created_at", { ascending: false })
        : query.order("record_date", { ascending: false }).order("created_at", { ascending: false });
  const { data, error } = await orderedQuery;
  if (error) return { state: "error", message: error.message };

  return {
    rows:
      dataset === "exchange"
        ? ((data ?? []) as unknown as ExchangeRateRow[]).map(mapExchangeRateRow)
        : dataset === "customer"
        ? ((data ?? []) as unknown as AdminCustomerRecordRow[]).map(mapCustomerRow)
        : dataset === "target"
          ? ((data ?? []) as unknown as StoreDailyTargetRow[]).map(mapTargetRow)
          : ((data ?? []) as unknown as AdminBusinessRecordRow[]).map(mapBusinessRow),
  };
}

function applyMeasure(bucket: ReportAggregateBucket, measure: AdminReportMeasure, sources: ReportSourceRows) {
  if (measure.type === "count") {
    bucket.values[measure.key] = Number(bucket.values[measure.key] ?? 0) + 1;
    return;
  }

  if (!measure.field) return;
  const value = getSourceFieldValue(sources, measure.source, measure.field);
  if (measure.type === "countDistinct") {
    const set = bucket.distinct[measure.key] ?? new Set<string>();
    if (value !== null && value !== "") set.add(String(value));
    bucket.distinct[measure.key] = set;
    return;
  }

  bucket.values[measure.key] = Number(bucket.values[measure.key] ?? 0) + toNumber(value);
}

function applyTotalMeasure(totalValues: Map<string, number>, totalDistinct: Map<string, Set<string>>, measure: AdminReportMeasure, sources: ReportSourceRows) {
  if (measure.type === "count") {
    totalValues.set(measure.key, (totalValues.get(measure.key) ?? 0) + 1);
    return;
  }

  if (!measure.field) return;
  const value = getSourceFieldValue(sources, measure.source, measure.field);
  if (measure.type === "countDistinct") {
    const set = totalDistinct.get(measure.key) ?? new Set<string>();
    if (value !== null && value !== "") set.add(String(value));
    totalDistinct.set(measure.key, set);
    return;
  }

  totalValues.set(measure.key, (totalValues.get(measure.key) ?? 0) + toNumber(value));
}

function getSourceFieldValue(sources: ReportSourceRows, source: string | undefined, field: string) {
  const row = sources[source || "base"];
  if (!row) return null;
  const value = row[field as keyof AdminDataRecord];
  if (value === undefined || value === null) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  return JSON.stringify(value);
}

function getRecordTextValue(row: AdminDataRecord, field: string) {
  const value = row[field as keyof AdminDataRecord];
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value);
}

function toNumber(value: string | number | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const number = Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(number) ? number : 0;
}

function getEquityAmountFromRecord(row: AdminDataRecord) {
  if (!isEquityDataRecord(row)) return null;
  return row.receivable_amount ?? row.amount ?? null;
}

function getServiceAmountFromRecord(row: AdminDataRecord) {
  if (!isServiceDataRecord(row)) return null;
  return row.amount ?? row.receivable_amount ?? null;
}

function isEquityDataRecord(row: AdminDataRecord) {
  if (row.sale_type?.trim() === "权益") return true;
  if (row.sale_type?.trim() === "项目") return false;
  const haystack = [row.sale_type, row.sale_category, row.payment_method, row.related_equity, row.item_name, getRawRecordText(row.raw_data)].join(" ");
  return /权益|套餐|储值|会员|package|membership|member|wallet/i.test(haystack);
}

function isServiceDataRecord(row: AdminDataRecord) {
  if (row.sale_type?.trim() === "项目") return true;
  if (row.sale_type?.trim() === "权益") return false;
  const haystack = [row.sale_type, row.sale_category, row.item_name, row.category, row.remark, getRawRecordText(row.raw_data)].join(" ");
  return /项目|服务|护理|养护|service|scalp|hair|care|treatment/i.test(haystack) && !isEquityDataRecord(row);
}

function getRawRecordText(rawData: Json) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return "";
  return Object.values(rawData)
    .map((value) => String(value ?? ""))
    .join(" ");
}

function sortAggregatedRows(rows: Array<Record<string, string | number | null>>, report: AdminReportConfig) {
  const sort = report.defaultSort;
  if (!sort) return rows;
  return [...rows].sort((left, right) => {
    const leftValue = left[sort.key];
    const rightValue = right[sort.key];
    const direction = sort.direction === "asc" ? 1 : -1;
    if (typeof leftValue === "number" || typeof rightValue === "number") {
      return (Number(leftValue ?? 0) - Number(rightValue ?? 0)) * direction;
    }
    return String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "zh-CN") * direction;
  });
}

function buildFilteredQuery(adminClient: AdminClient, dataset: AdminDataset, filters: AdminReportFilters, columns = "*", options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }, scope?: Awaited<ReturnType<typeof resolveAdminOrgScope>>) {
  let query = getDatasetTable(adminClient, dataset).select(columns, options);

  const dateColumn = dataset === "customer" ? "created_on" : dataset === "target" ? "target_date" : dataset === "exchange" ? "period_month" : "record_date";
  if (filters.startDate) query = query.gte(dateColumn, filters.startDate);
  if (filters.endDate) query = query.lte(dateColumn, filters.endDate);
  if (filters.orgUnit) query = query.ilike("org_unit", `%${filters.orgUnit}%`);
  if (scope && dataset !== "exchange") query = applyOrgUnitScope(query, scope, { allowHeadquartersAll: true });
  if (filters.personName && dataset !== "target") query = dataset === "customer" ? query.ilike("customer_name", `%${filters.personName}%`) : query.ilike("person_name", `%${filters.personName}%`);
  if (filters.category && dataset !== "target") query = dataset === "customer" ? query.ilike("tags", `%${filters.category}%`) : query.ilike("category", `%${filters.category}%`);
  if (filters.keyword) {
    const keyword = filters.keyword.replaceAll(",", " ");
    query =
      dataset === "target"
        ? query.or(`org_unit.ilike.%${keyword}%,remark.ilike.%${keyword}%`)
        : dataset === "exchange"
        ? query.or(`from_currency.ilike.%${keyword}%,to_currency.ilike.%${keyword}%,source_file.ilike.%${keyword}%`)
        : dataset === "customer"
        ? query.or(`org_unit.ilike.%${keyword}%,customer_name.ilike.%${keyword}%,customer_no.ilike.%${keyword}%,phone.ilike.%${keyword}%,email.ilike.%${keyword}%,remark.ilike.%${keyword}%`)
        : query.or(`org_unit.ilike.%${keyword}%,person_name.ilike.%${keyword}%,employee_no.ilike.%${keyword}%,reference_no.ilike.%${keyword}%,remark.ilike.%${keyword}%,customer_name.ilike.%${keyword}%,customer_no.ilike.%${keyword}%,customer_phone.ilike.%${keyword}%,document_no.ilike.%${keyword}%,item_name.ilike.%${keyword}%`);
  }

  return query;
}

async function getAdminDataSummary(adminClient: AdminClient, dataset: AdminDataset, filters: AdminReportFilters, scope: Awaited<ReturnType<typeof resolveAdminOrgScope>>): Promise<{ amount: number; quantity: number }> {
  if (dataset === "exchange") {
    const { data } = await buildFilteredQuery(adminClient, dataset, filters, "rate", undefined, scope).limit(5000);
    return {
      amount: ((data ?? []) as unknown as Array<{ rate: number | string | null }>).reduce((sum, row) => sum + Number(row.rate ?? 0), 0),
      quantity: (data ?? []).length,
    };
  }
  if (dataset === "customer") {
    const { data } = await buildFilteredQuery(adminClient, dataset, filters, "total_consumptions", undefined, scope).limit(5000);
    return {
      amount: 0,
      quantity: ((data ?? []) as unknown as Array<{ total_consumptions: number | string | null }>).reduce((sum, row) => sum + Number(row.total_consumptions ?? 0), 0),
    };
  }
  if (dataset === "target") {
    const { data } = await buildFilteredQuery(adminClient, dataset, filters, "target_new_customers, target_equity_sales_amount, target_service_sales_amount", undefined, scope).limit(5000);
    const rows = (data ?? []) as unknown as Array<{ target_new_customers: number | string | null; target_equity_sales_amount: number | string | null; target_service_sales_amount: number | string | null }>;
    return {
      amount: rows.reduce((sum, row) => sum + Number(row.target_equity_sales_amount ?? 0) + Number(row.target_service_sales_amount ?? 0), 0),
      quantity: rows.reduce((sum, row) => sum + Number(row.target_new_customers ?? 0), 0),
    };
  }

  const { data } = await buildFilteredQuery(adminClient, dataset, filters, "amount, quantity", undefined, scope).limit(5000);
  const summary = { amount: 0, quantity: 0 };
  for (const row of (data ?? []) as unknown as Array<{ amount: number | string | null; quantity: number | string | null }>) {
    summary.amount += Number(row.amount ?? 0);
    summary.quantity += Number(row.quantity ?? 0);
  }
  return summary;
}

function getDatasetTable(adminClient: AdminClient, dataset: AdminDataset) {
  if (dataset === "exchange") return adminClient.from("exchange_rates");
  if (dataset === "target") return adminClient.from("store_daily_targets");
  if (dataset === "customer") return adminClient.from("customer_records");
  return adminClient.from("sales_records");
}

function normalizeHeader(header: string, dataset: AdminDataset, config: AdminViewConfig) {
  const trimmed = header.trim();
  const directKey = writableRecordKeys.find((key) => key === trimmed);
  if (directKey) return directKey;
  if (dataset === "sales" && salesHeaderAliases[trimmed]) return salesHeaderAliases[trimmed];
  return config.import.aliases[trimmed] ?? "";
}

function normalizeDate(value: string | undefined) {
  const text = String(value ?? "").trim().replaceAll("/", "-");
  const serialDate = parseExcelSerialDate(text);
  if (serialDate) return serialDate.slice(0, 10);
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeOptionalDate(value: string | undefined) {
  if (!String(value ?? "").trim()) return null;
  return normalizeDate(value) || null;
}

function normalizeMonth(value: string | undefined) {
  const date = normalizeDate(value);
  if (date) return `${date.slice(0, 7)}-01`;
  const text = String(value ?? "").trim().replaceAll("/", "-");
  const match = text.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return "";
  return `${match[1]}-${match[2].padStart(2, "0")}-01`;
}

function normalizeCurrency(value: string | undefined | null) {
  const text = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
}

function normalizeOptionalTimestamp(value: string | undefined) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const serialDate = parseExcelSerialDate(text);
  if (serialDate) return serialDate;
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseExcelSerialDate(text: string) {
  if (!/^\d{4,6}(\.\d+)?$/.test(text)) return null;
  const serial = Number(text);
  if (!Number.isFinite(serial) || serial < 20000 || serial > 90000) return null;
  const millis = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(millis).toISOString();
}

function shouldUseNormalizedValue(dataset: AdminDataset, key: string, existingHeader: string | undefined, nextHeader: string, existingValue: string | undefined, nextValue: string) {
  if (!String(nextValue ?? "").trim()) return !String(existingValue ?? "").trim();
  if (!String(existingValue ?? "").trim()) return true;

  const priority = getHeaderPriority(dataset, key);
  if (priority.length === 0) return false;

  const existingPriority = getPriorityIndex(priority, existingHeader);
  const nextPriority = getPriorityIndex(priority, nextHeader);
  return nextPriority < existingPriority;
}

function getHeaderPriority(dataset: AdminDataset, key: string) {
  if (key === "record_date") return ["账务日期", "日期", "操作时间"];
  if (dataset === "sales" && key === "amount") return ["支付金额", "销售额", "应收金额", "金额", "核算金额"];
  if (dataset === "sales" && key === "category") return ["员工部门", "分类", "类型"];
  return [];
}

function getPriorityIndex(priority: string[], header: string | undefined) {
  const index = priority.indexOf(String(header ?? "").trim());
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function normalizeNumber(value: string | undefined) {
  const text = String(value ?? "").replaceAll(",", "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function normalizeOptionalNumber(value: string | undefined) {
  if (!String(value ?? "").trim()) return null;
  return normalizeNumber(value);
}

function normalizeNullableText(value: string | undefined) {
  const text = String(value ?? "").trim();
  return text || null;
}

async function deleteExistingSalesRows(adminClient: AdminClient, rows: AdminDataRecord[]) {
  const referenceNos = uniqueNonEmpty(rows.map((row) => row.reference_no));
  for (const batch of chunk(referenceNos, 200)) {
    const { error } = await adminClient.from("sales_records").delete().in("reference_no", batch);
    if (error) return error;
  }
  return null;
}

async function deleteExistingCustomerRows(adminClient: AdminClient, rows: AdminDataRecord[]) {
  const customerNos = uniqueNonEmpty(rows.map((row) => row.customer_no));
  for (const batch of chunk(customerNos, 200)) {
    const { error } = await adminClient.from("customer_records").delete().in("customer_no", batch);
    if (error) return error;
  }
  return null;
}

function dedupeCustomerRows(rows: AdminDataRecord[]) {
  const keyedRows = new Map<string, AdminDataRecord>();
  const rowsWithoutCustomerNo: AdminDataRecord[] = [];

  rows.forEach((row) => {
    const customerNo = row.customer_no?.trim();
    if (!customerNo) {
      rowsWithoutCustomerNo.push(row);
      return;
    }
    keyedRows.set(customerNo, row);
  });

  return [...keyedRows.values(), ...rowsWithoutCustomerNo];
}

type CurrencyMeta = {
  currencyByOrgUnit: Map<string, string>;
  ratesByMonthCurrency: Map<string, number>;
};

type CurrencyEnrichmentResult = { rows: AdminDataRecord[] } | { state: "error"; message: string };

async function loadCurrencyMeta(adminClient: AdminClient, rows: AdminDataRecord[]): Promise<CurrencyMeta | { state: "error"; message: string }> {
  const orgUnits = uniqueNonEmpty(rows.map((row) => row.org_unit));
  const months = uniqueNonEmpty(rows.map((row) => getRowMonth(row)));

  const [departmentResult, rateResult] = await Promise.all([
    orgUnits.length > 0 ? adminClient.from("departments").select("name, currency_code").in("name", orgUnits) : Promise.resolve({ data: [], error: null }),
    months.length > 0 ? adminClient.from("exchange_rates").select("period_month, from_currency, to_currency, rate").in("period_month", months).eq("to_currency", "CNY") : Promise.resolve({ data: [], error: null }),
  ]);

  if (departmentResult.error) return { state: "error" as const, message: departmentResult.error.message };
  if (rateResult.error) return { state: "error" as const, message: rateResult.error.message };

  const currencyByOrgUnit = new Map<string, string>();
  ((departmentResult.data ?? []) as Array<{ name: string; currency_code: string | null }>).forEach((department) => {
    const currency = normalizeCurrency(department.currency_code);
    if (currency) currencyByOrgUnit.set(department.name, currency);
  });

  const ratesByMonthCurrency = new Map<string, number>();
  ((rateResult.data ?? []) as Array<{ period_month: string; from_currency: string; to_currency: string; rate: number | string }>).forEach((rate) => {
    ratesByMonthCurrency.set(getRateKey(rate.period_month, rate.from_currency), Number(rate.rate));
  });
  months.forEach((month) => ratesByMonthCurrency.set(getRateKey(month, "CNY"), 1));

  return { currencyByOrgUnit, ratesByMonthCurrency };
}

async function enrichSalesRowsWithCurrency(adminClient: AdminClient, rows: AdminDataRecord[]): Promise<CurrencyEnrichmentResult> {
  const meta = await loadCurrencyMeta(adminClient, rows);
  if ("state" in meta) return meta;

  const missing = new Set<string>();
  const enriched = rows.map((row) => {
    const currency = normalizeCurrency(row.currency_code) || getCurrencyForOrgUnit(meta.currencyByOrgUnit, row.org_unit);
    const month = getRowMonth(row);
    const rate = currency && month ? meta.ratesByMonthCurrency.get(getRateKey(month, currency)) : undefined;
    if (!currency) missing.add(`${row.org_unit ?? "未绑定门店"} 缺少币种`);
    if (currency && !rate) missing.add(`${month} ${currency}->CNY 缺少汇率`);
    const effectiveRate = rate ?? 1;
    return {
      ...row,
      currency_code: currency || null,
      exchange_rate_to_cny: rate ?? null,
      amount_cny: convertToCny(row.amount, effectiveRate),
      receivable_amount_cny: convertToCny(row.receivable_amount, effectiveRate),
      payment_amount_cny: convertToCny(row.payment_amount, effectiveRate),
      equity_amount_cny: convertToCny(getEquityAmountFromRecord(row), effectiveRate),
      service_amount_cny: convertToCny(getServiceAmountFromRecord(row), effectiveRate),
    };
  });

  if (missing.size > 0) return { state: "error" as const, message: `缺少币种或汇率：${[...missing].slice(0, 8).join("；")}` };
  return { rows: enriched };
}

async function enrichTargetRowsWithCurrency(adminClient: AdminClient, rows: AdminDataRecord[]): Promise<CurrencyEnrichmentResult> {
  const meta = await loadCurrencyMeta(adminClient, rows);
  if ("state" in meta) return meta;

  const missing = new Set<string>();
  const enriched = rows.map((row) => {
    const currency = normalizeCurrency(row.currency_code) || getCurrencyForOrgUnit(meta.currencyByOrgUnit, row.org_unit);
    const month = getRowMonth(row);
    const rate = currency && month ? meta.ratesByMonthCurrency.get(getRateKey(month, currency)) : undefined;
    if (!currency) missing.add(`${row.org_unit ?? "未绑定门店"} 缺少币种`);
    if (currency && !rate) missing.add(`${month} ${currency}->CNY 缺少汇率`);
    const effectiveRate = rate ?? 1;
    return {
      ...row,
      currency_code: currency || null,
      exchange_rate_to_cny: rate ?? null,
      target_equity_sales_amount_cny: convertToCny(row.target_equity_sales_amount, effectiveRate),
      target_service_sales_amount_cny: convertToCny(row.target_service_sales_amount, effectiveRate),
    };
  });

  if (missing.size > 0) return { state: "error" as const, message: `缺少币种或汇率：${[...missing].slice(0, 8).join("；")}` };
  return { rows: enriched };
}

function getCurrencyForOrgUnit(currencyByOrgUnit: Map<string, string>, orgUnit: string | null | undefined) {
  return orgUnit ? currencyByOrgUnit.get(orgUnit) ?? "" : "";
}

function getRowMonth(row: AdminDataRecord) {
  const date = row.record_date ?? row.target_date ?? row.period_month;
  return date ? `${date.slice(0, 7)}-01` : "";
}

function getRateKey(month: string, currency: string) {
  return `${month}:${normalizeCurrency(currency)}`;
}

function convertToCny(value: number | null | undefined, rate: number) {
  if (value === null || value === undefined) return null;
  return Math.round(Number(value) * rate * 100) / 100;
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function pickWritableRecord(row: AdminDataRecord): AdminBusinessRecordInsert {
  return {
    record_date: row.record_date ?? "",
    org_unit: row.org_unit,
    employee_no: row.employee_no,
    person_name: row.person_name,
    amount: row.amount ?? 0,
    quantity: row.quantity,
    category: row.category,
    reference_no: row.reference_no,
    remark: row.remark,
    sale_type: row.sale_type,
    sale_category: row.sale_category,
    item_no: row.item_no,
    item_name: row.item_name,
    standard_price: row.standard_price,
    receivable_amount: row.receivable_amount,
    payment_method: row.payment_method,
    payment_amount: row.payment_amount,
    cash_payment_amount: row.cash_payment_amount,
    equity_payment_amount: row.equity_payment_amount,
    related_equity: row.related_equity,
    equity_book_change: row.equity_book_change,
    book_unit: row.book_unit,
    accounting_amount: row.accounting_amount,
    equity_store: row.equity_store,
    employee_name: row.employee_name,
    actual_performance: row.actual_performance,
    assignment_type: row.assignment_type,
    service_role: row.service_role,
    employee_department: row.employee_department,
    customer_name: row.customer_name,
    customer_no: row.customer_no,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email,
    referrer: row.referrer,
    document_no: row.document_no,
    document_type: row.document_type,
    customer_gender: row.customer_gender,
    visit_channel: row.visit_channel,
    cashier: row.cashier,
    accounting_date: row.accounting_date,
    operation_time: row.operation_time,
    currency_code: row.currency_code,
    exchange_rate_to_cny: row.exchange_rate_to_cny,
    amount_cny: row.amount_cny,
    receivable_amount_cny: row.receivable_amount_cny,
    payment_amount_cny: row.payment_amount_cny,
    equity_amount_cny: row.equity_amount_cny,
    service_amount_cny: row.service_amount_cny,
    raw_data: row.raw_data,
  };
}

function pickWritableCustomerRecord(row: AdminDataRecord): AdminCustomerRecordInsert {
  return {
    customer_name: row.customer_name ?? "",
    customer_no: row.customer_no,
    card_no: row.card_no,
    phone: row.phone,
    email: row.email,
    birthday: row.birthday,
    tags: row.tags,
    channel: row.channel,
    referrer: row.referrer,
    advisor: row.advisor,
    last_consumed_on: row.last_consumed_on,
    total_consumptions: row.total_consumptions,
    created_on: row.created_on,
    source: row.source,
    org_unit: row.org_unit,
    remark: row.remark,
    raw_data: row.raw_data,
  };
}

function pickWritableTargetRecord(row: AdminDataRecord): StoreDailyTargetInsert {
  return {
    target_date: row.target_date ?? "",
    org_unit: row.org_unit ?? "",
    target_new_customers: row.target_new_customers ?? 0,
    target_equity_sales_amount: row.target_equity_sales_amount ?? 0,
    target_service_sales_amount: row.target_service_sales_amount ?? 0,
    currency_code: row.currency_code,
    exchange_rate_to_cny: row.exchange_rate_to_cny,
    target_equity_sales_amount_cny: row.target_equity_sales_amount_cny,
    target_service_sales_amount_cny: row.target_service_sales_amount_cny,
    remark: row.remark,
    raw_data: row.raw_data,
  };
}

function pickWritableExchangeRate(row: AdminDataRecord): ExchangeRateInsert {
  return {
    period_month: row.period_month ?? "",
    from_currency: normalizeCurrency(row.from_currency) || "CNY",
    to_currency: normalizeCurrency(row.to_currency) || "CNY",
    rate: row.rate ?? 1,
    source_file: row.source_file,
    raw_data: row.raw_data,
  };
}

function mapBusinessRow(row: AdminBusinessRecordRow): AdminDataRecord {
  return {
    id: row.id,
    record_date: row.record_date,
    org_unit: row.org_unit,
    employee_no: row.employee_no,
    person_name: row.person_name,
    amount: Number(row.amount ?? 0),
    quantity: row.quantity === null ? null : Number(row.quantity),
    category: row.category,
    reference_no: row.reference_no,
    remark: row.remark,
    sale_type: row.sale_type,
    sale_category: row.sale_category,
    item_no: row.item_no,
    item_name: row.item_name,
    standard_price: row.standard_price === null ? null : Number(row.standard_price),
    receivable_amount: row.receivable_amount === null ? null : Number(row.receivable_amount),
    payment_method: row.payment_method,
    payment_amount: row.payment_amount === null ? null : Number(row.payment_amount),
    cash_payment_amount: row.cash_payment_amount === null ? null : Number(row.cash_payment_amount),
    equity_payment_amount: row.equity_payment_amount === null ? null : Number(row.equity_payment_amount),
    related_equity: row.related_equity,
    equity_book_change: row.equity_book_change === null ? null : Number(row.equity_book_change),
    book_unit: row.book_unit,
    accounting_amount: row.accounting_amount === null ? null : Number(row.accounting_amount),
    equity_store: row.equity_store,
    employee_name: row.employee_name,
    actual_performance: row.actual_performance === null ? null : Number(row.actual_performance),
    assignment_type: row.assignment_type,
    service_role: row.service_role,
    employee_department: row.employee_department,
    customer_name: row.customer_name,
    customer_no: row.customer_no,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email,
    referrer: row.referrer,
    document_no: row.document_no,
    document_type: row.document_type,
    customer_gender: row.customer_gender,
    visit_channel: row.visit_channel,
    cashier: row.cashier,
    accounting_date: row.accounting_date,
    operation_time: row.operation_time,
    currency_code: row.currency_code,
    exchange_rate_to_cny: row.exchange_rate_to_cny === null ? null : Number(row.exchange_rate_to_cny),
    amount_cny: row.amount_cny === null ? null : Number(row.amount_cny),
    receivable_amount_cny: row.receivable_amount_cny === null ? null : Number(row.receivable_amount_cny),
    payment_amount_cny: row.payment_amount_cny === null ? null : Number(row.payment_amount_cny),
    equity_amount_cny: row.equity_amount_cny === null ? null : Number(row.equity_amount_cny),
    service_amount_cny: row.service_amount_cny === null ? null : Number(row.service_amount_cny),
    raw_data: row.raw_data,
  };
}

function mapCustomerRow(row: AdminCustomerRecordRow): AdminDataRecord {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_no: row.customer_no,
    card_no: row.card_no,
    phone: row.phone,
    email: row.email,
    birthday: row.birthday,
    tags: row.tags,
    channel: row.channel,
    referrer: row.referrer,
    advisor: row.advisor,
    last_consumed_on: row.last_consumed_on,
    total_consumptions: row.total_consumptions === null ? null : Number(row.total_consumptions),
    created_on: row.created_on,
    source: row.source,
    org_unit: row.org_unit,
    employee_no: null,
    person_name: row.customer_name,
    quantity: row.total_consumptions === null ? null : Number(row.total_consumptions),
    category: row.tags,
    reference_no: row.customer_no,
    remark: row.remark,
    raw_data: row.raw_data,
  };
}

function mapTargetRow(row: StoreDailyTargetRow): AdminDataRecord {
  return {
    id: row.id,
    target_date: row.target_date,
    org_unit: row.org_unit,
    employee_no: null,
    person_name: null,
    quantity: Number(row.target_new_customers ?? 0),
    category: null,
    reference_no: null,
    remark: row.remark,
    target_new_customers: Number(row.target_new_customers ?? 0),
    target_equity_sales_amount: Number(row.target_equity_sales_amount ?? 0),
    target_service_sales_amount: Number(row.target_service_sales_amount ?? 0),
    currency_code: row.currency_code,
    exchange_rate_to_cny: row.exchange_rate_to_cny === null ? null : Number(row.exchange_rate_to_cny),
    target_equity_sales_amount_cny: row.target_equity_sales_amount_cny === null ? null : Number(row.target_equity_sales_amount_cny),
    target_service_sales_amount_cny: row.target_service_sales_amount_cny === null ? null : Number(row.target_service_sales_amount_cny),
    raw_data: row.raw_data,
  };
}

function mapExchangeRateRow(row: ExchangeRateRow): AdminDataRecord {
  return {
    id: row.id,
    period_month: row.period_month,
    from_currency: row.from_currency,
    to_currency: row.to_currency,
    rate: Number(row.rate),
    source_file: row.source_file,
    org_unit: null,
    employee_no: null,
    person_name: null,
    quantity: null,
    category: null,
    reference_no: `${row.period_month}:${row.from_currency}:${row.to_currency}`,
    remark: null,
    raw_data: row.raw_data,
  };
}

function formatRecordValue(row: AdminBusinessRecordRow | AdminCustomerRecordRow | StoreDailyTargetRow | ExchangeRateRow, key: string) {
  const value = row[key as keyof typeof row];
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "string") return value;
  return JSON.stringify(value);
}
