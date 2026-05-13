import type { AdminDataset, AdminReportColumn, AdminReportConfig, AdminViewConfig } from "./admin-data-model";

export const adminDatasets: Array<{ key: AdminDataset; label: string }> = [
  { key: "sales", label: "销售数据" },
  { key: "customer", label: "客户资料" },
  { key: "target", label: "目标数据" },
  { key: "exchange", label: "汇率数据" },
];

const sharedFilters = [
  { key: "record_date", label: "日期", type: "dateRange" as const },
  { key: "org_unit", label: "门店/部门", type: "text" as const },
  { key: "person_name", label: "人员", type: "text" as const },
  { key: "category", label: "分类", type: "text" as const },
];

const baseAliases = {
  日期: "record_date",
  门店: "org_unit",
  部门: "org_unit",
  门店部门: "org_unit",
  工号: "employee_no",
  员工编号: "employee_no",
  人员: "person_name",
  姓名: "person_name",
  数量: "quantity",
  分类: "category",
  类型: "category",
  单号: "reference_no",
  备注: "remark",
};

const salesColumns = [
  { key: "record_date", label: "日期", type: "date" as const, visible: true },
  { key: "org_unit", label: "门店/部门", type: "text" as const, visible: true },
  { key: "person_name", label: "人员", type: "text" as const, visible: true },
  { key: "amount", label: "销售额", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "quantity", label: "数量", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "sale_type", label: "类型", type: "text" as const, visible: true },
  { key: "sale_category", label: "分类", type: "text" as const, visible: true },
  { key: "item_no", label: "编号", type: "text" as const, visible: false },
  { key: "item_name", label: "名称", type: "text" as const, visible: true },
  { key: "standard_price", label: "标准价", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "receivable_amount", label: "应收金额", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "payment_method", label: "支付方式", type: "text" as const, visible: true },
  { key: "payment_amount", label: "支付金额", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "cash_payment_amount", label: "现金类支付", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "equity_payment_amount", label: "权益类支付", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "related_equity", label: "涉及权益", type: "text" as const, visible: false },
  { key: "equity_book_change", label: "权益账面变动", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "book_unit", label: "账面单位", type: "text" as const, visible: false },
  { key: "accounting_amount", label: "核算金额", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "equity_store", label: "权益归属门店", type: "text" as const, visible: false },
  { key: "employee_name", label: "员工", type: "text" as const, visible: false },
  { key: "actual_performance", label: "实际业绩", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "assignment_type", label: "指派类型", type: "text" as const, visible: false },
  { key: "service_role", label: "服务角色", type: "text" as const, visible: false },
  { key: "employee_department", label: "员工部门", type: "text" as const, visible: false },
  { key: "customer_name", label: "客户名称", type: "text" as const, visible: true },
  { key: "customer_no", label: "客户编号", type: "text" as const, visible: true },
  { key: "customer_phone", label: "手机号", type: "text" as const, visible: false },
  { key: "customer_email", label: "邮箱", type: "text" as const, visible: false },
  { key: "referrer", label: "推荐人", type: "text" as const, visible: false },
  { key: "document_no", label: "单据编号", type: "text" as const, visible: true },
  { key: "document_type", label: "单据类型", type: "text" as const, visible: false },
  { key: "customer_gender", label: "男客/女客", type: "text" as const, visible: false },
  { key: "visit_channel", label: "进店渠道", type: "text" as const, visible: false },
  { key: "cashier", label: "收银员", type: "text" as const, visible: false },
  { key: "accounting_date", label: "财务日期", type: "date" as const, visible: false },
  { key: "operation_time", label: "操作时间", type: "date" as const, visible: false },
  { key: "currency_code", label: "币种", type: "text" as const, visible: true },
  { key: "exchange_rate_to_cny", label: "兑 CNY 汇率", type: "number" as const, visible: false },
  { key: "amount_cny", label: "销售额 CNY", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "receivable_amount_cny", label: "应收金额 CNY", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "payment_amount_cny", label: "支付金额 CNY", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "equity_amount_cny", label: "权益销售 CNY", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "service_amount_cny", label: "项目销售 CNY", type: "number" as const, visible: false, summary: "sum" as const },
  { key: "reference_no", label: "单号", type: "text" as const, visible: false },
  { key: "remark", label: "备注", type: "text" as const, visible: false },
];

const salesExportColumns = salesColumns.map((column) => column.key);

const salesReports: AdminReportConfig[] = [
  {
    id: "sales_detail",
    title: "销售明细",
    kind: "detail",
    description: "按原始销售记录查看明细数据，可通过当前范围和日期继续筛选。",
    baseDataset: "sales",
    columns: toReportColumns(salesColumns),
    defaultSort: { key: "record_date", direction: "desc" },
  },
  {
    id: "store_sales_summary",
    title: "门店销售汇总",
    kind: "aggregate",
    description: "按门店汇总销售额、应收金额、支付金额、订单数和客户数。",
    baseDataset: "sales",
    dimensions: [{ key: "org_unit", label: "门店", source: "base", field: "org_unit" }],
    measures: [
      { key: "sales_amount", label: "销售额", type: "sum", source: "base", field: "amount" },
      { key: "sales_amount_cny", label: "销售额 CNY", type: "sum", source: "base", field: "amount_cny" },
      { key: "receivable_amount", label: "应收金额", type: "sum", source: "base", field: "receivable_amount" },
      { key: "payment_amount", label: "支付金额", type: "sum", source: "base", field: "payment_amount" },
      { key: "order_count", label: "订单数", type: "count", source: "base" },
      { key: "customer_count", label: "客户数", type: "countDistinct", source: "base", field: "customer_no" },
    ],
    columns: [
      { key: "org_unit", label: "门店", type: "text" },
      { key: "sales_amount", label: "销售额", type: "number" },
      { key: "sales_amount_cny", label: "销售额 CNY", type: "number" },
      { key: "receivable_amount", label: "应收金额", type: "number" },
      { key: "payment_amount", label: "支付金额", type: "number" },
      { key: "order_count", label: "订单数", type: "number" },
      { key: "customer_count", label: "客户数", type: "number" },
    ],
    defaultSort: { key: "sales_amount_cny", direction: "desc" },
  },
  {
    id: "item_sales_summary",
    title: "项目销售汇总",
    kind: "aggregate",
    description: "按项目和分类汇总销售额、数量、订单数和客户数。",
    baseDataset: "sales",
    dimensions: [
      { key: "sale_category", label: "分类", source: "base", field: "sale_category" },
      { key: "item_name", label: "项目", source: "base", field: "item_name" },
    ],
    measures: [
      { key: "sales_amount", label: "销售额", type: "sum", source: "base", field: "amount" },
      { key: "sales_amount_cny", label: "销售额 CNY", type: "sum", source: "base", field: "amount_cny" },
      { key: "quantity", label: "数量", type: "sum", source: "base", field: "quantity" },
      { key: "order_count", label: "订单数", type: "count", source: "base" },
      { key: "customer_count", label: "客户数", type: "countDistinct", source: "base", field: "customer_no" },
    ],
    columns: [
      { key: "sale_category", label: "分类", type: "text" },
      { key: "item_name", label: "项目", type: "text" },
      { key: "sales_amount", label: "销售额", type: "number" },
      { key: "sales_amount_cny", label: "销售额 CNY", type: "number" },
      { key: "quantity", label: "数量", type: "number" },
      { key: "order_count", label: "订单数", type: "number" },
      { key: "customer_count", label: "客户数", type: "number" },
    ],
    defaultSort: { key: "sales_amount_cny", direction: "desc" },
  },
  {
    id: "sales_customer_analysis",
    title: "销售客户分析",
    kind: "aggregate",
    description: "销售数据关联客户资料，查看客户维度画像和消费情况。",
    baseDataset: "sales",
    joins: [{ alias: "customer", dataset: "customer", leftKey: "customer_no", rightKey: "customer_no", type: "left" }],
    dimensions: [
      { key: "org_unit", label: "门店", source: "base", field: "org_unit" },
      { key: "customer_name", label: "客户名称", source: "customer", field: "customer_name" },
      { key: "tags", label: "客户标签", source: "customer", field: "tags" },
      { key: "channel", label: "渠道", source: "customer", field: "channel" },
      { key: "advisor", label: "顾问", source: "customer", field: "advisor" },
    ],
    measures: [
      { key: "sales_amount", label: "销售额", type: "sum", source: "base", field: "amount" },
      { key: "sales_amount_cny", label: "销售额 CNY", type: "sum", source: "base", field: "amount_cny" },
      { key: "order_count", label: "订单数", type: "count", source: "base" },
      { key: "customer_count", label: "客户数", type: "countDistinct", source: "base", field: "customer_no" },
      { key: "consumption_count", label: "消费次数", type: "sum", source: "customer", field: "total_consumptions" },
    ],
    columns: [
      { key: "org_unit", label: "门店", type: "text" },
      { key: "customer_name", label: "客户名称", type: "text" },
      { key: "tags", label: "客户标签", type: "text" },
      { key: "channel", label: "渠道", type: "text" },
      { key: "advisor", label: "顾问", type: "text" },
      { key: "sales_amount", label: "销售额", type: "number" },
      { key: "sales_amount_cny", label: "销售额 CNY", type: "number" },
      { key: "order_count", label: "订单数", type: "number" },
      { key: "customer_count", label: "客户数", type: "number" },
      { key: "consumption_count", label: "消费次数", type: "number" },
    ],
    defaultSort: { key: "sales_amount_cny", direction: "desc" },
  },
];

const customerColumns = [
  { key: "customer_name", label: "客户名称", type: "text" as const, visible: true },
  { key: "customer_no", label: "客户编号", type: "text" as const, visible: true },
  { key: "card_no", label: "实体卡", type: "text" as const, visible: false },
  { key: "phone", label: "电话", type: "text" as const, visible: true },
  { key: "email", label: "邮箱", type: "text" as const, visible: true },
  { key: "birthday", label: "生日", type: "date" as const, visible: true },
  { key: "tags", label: "客户标签", type: "text" as const, visible: true },
  { key: "channel", label: "进店渠道", type: "text" as const, visible: true },
  { key: "referrer", label: "推荐人", type: "text" as const, visible: false },
  { key: "advisor", label: "顾问", type: "text" as const, visible: true },
  { key: "last_consumed_on", label: "上次消费日期", type: "date" as const, visible: true },
  { key: "total_consumptions", label: "总消费次数", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "created_on", label: "创建日期", type: "date" as const, visible: true },
  { key: "source", label: "创建来源", type: "text" as const, visible: true },
  { key: "org_unit", label: "归属门店", type: "text" as const, visible: true },
  { key: "remark", label: "备注", type: "text" as const, visible: true },
];

const targetColumns = [
  { key: "target_date", label: "日期", type: "date" as const, visible: true },
  { key: "org_unit", label: "门店", type: "text" as const, visible: true },
  { key: "target_new_customers", label: "目标新客", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "target_equity_sales_amount", label: "目标权益销售", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "target_service_sales_amount", label: "目标项目销售", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "currency_code", label: "币种", type: "text" as const, visible: true },
  { key: "exchange_rate_to_cny", label: "兑 CNY 汇率", type: "number" as const, visible: false },
  { key: "target_equity_sales_amount_cny", label: "目标权益销售 CNY", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "target_service_sales_amount_cny", label: "目标项目销售 CNY", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "remark", label: "备注", type: "text" as const, visible: true },
];

const exchangeColumns = [
  { key: "period_month", label: "月份", type: "date" as const, visible: true },
  { key: "from_currency", label: "源币种", type: "text" as const, visible: true },
  { key: "to_currency", label: "目标币种", type: "text" as const, visible: true },
  { key: "rate", label: "汇率", type: "number" as const, visible: true, summary: "sum" as const },
  { key: "source_file", label: "来源文件", type: "text" as const, visible: true },
];

const customerReports: AdminReportConfig[] = [
  { id: "customer_detail", title: "客户明细", kind: "detail", description: "按客户资料查看明细数据。", baseDataset: "customer", columns: toReportColumns(customerColumns), defaultSort: { key: "created_on", direction: "desc" } },
];

const targetReports: AdminReportConfig[] = [
  { id: "target_detail", title: "目标明细", kind: "detail", description: "按门店和日期查看目标数据明细。", baseDataset: "target", columns: toReportColumns(targetColumns), defaultSort: { key: "target_date", direction: "desc" } },
];

export const defaultAdminReportConfigs: AdminReportConfig[] = [...salesReports, ...customerReports, ...targetReports];

export const defaultAdminViewConfigs: Record<AdminDataset, AdminViewConfig> = {
  sales: {
    dataset: "sales",
    title: "销售数据",
    columns: salesColumns,
    filters: sharedFilters,
    import: {
      requiredColumns: [],
      aliases: {
        ...baseAliases,
        财务日期: "accounting_date",
        操作时间: "operation_time",
        权益归属门店: "equity_store",
        员工: "employee_name",
        类型: "sale_type",
        分类: "sale_category",
        编号: "item_no",
        名称: "item_name",
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
        实际业绩: "actual_performance",
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
        销售额: "amount",
        金额: "amount",
        销售数量: "quantity",
      },
    },
    exportColumns: salesExportColumns,
  },
  customer: {
    dataset: "customer",
    title: "客户资料",
    columns: customerColumns,
    filters: [
      { key: "created_on", label: "创建日期", type: "dateRange" as const },
      { key: "org_unit", label: "归属门店", type: "text" as const },
      { key: "customer_name", label: "客户名称", type: "text" as const },
      { key: "tags", label: "客户标签", type: "text" as const },
    ],
    import: {
      requiredColumns: ["customer_name", "customer_no"],
      aliases: {
        名称: "customer_name",
        客户名称: "customer_name",
        编号: "customer_no",
        客户编号: "customer_no",
        实体卡: "card_no",
        电话: "phone",
        手机号: "phone",
        邮箱: "email",
        生日: "birthday",
        客户标签: "tags",
        进店渠道: "channel",
        推荐人: "referrer",
        顾问: "advisor",
        上次消费日期: "last_consumed_on",
        总消费次数: "total_consumptions",
        创建日期: "created_on",
        创建来源: "source",
        归属门店: "org_unit",
        备注: "remark",
      },
    },
    exportColumns: ["customer_name", "customer_no", "phone", "email", "birthday", "tags", "channel", "advisor", "last_consumed_on", "total_consumptions", "created_on", "source", "org_unit", "remark"],
  },
  target: {
    dataset: "target",
    title: "目标数据",
    columns: targetColumns,
    filters: [
      { key: "target_date", label: "日期", type: "dateRange" as const },
      { key: "org_unit", label: "门店", type: "text" as const },
    ],
    import: {
      requiredColumns: ["target_date", "org_unit"],
      aliases: {
        日期: "target_date",
        目标日期: "target_date",
        门店: "org_unit",
        归属门店: "org_unit",
        目标新客: "target_new_customers",
        新客目标: "target_new_customers",
        目标权益销售: "target_equity_sales_amount",
        权益销售目标: "target_equity_sales_amount",
        目标项目销售: "target_service_sales_amount",
        项目销售目标: "target_service_sales_amount",
        备注: "remark",
      },
    },
    exportColumns: ["target_date", "org_unit", "target_new_customers", "target_equity_sales_amount", "target_service_sales_amount", "currency_code", "exchange_rate_to_cny", "target_equity_sales_amount_cny", "target_service_sales_amount_cny", "remark"],
  },
  exchange: {
    dataset: "exchange",
    title: "汇率数据",
    columns: exchangeColumns,
    filters: [
      { key: "period_month", label: "月份", type: "dateRange" as const },
      { key: "from_currency", label: "源币种", type: "text" as const },
    ],
    import: {
      requiredColumns: ["period_month", "from_currency", "rate"],
      aliases: {
        Month: "period_month",
        Period: "period_month",
        月份: "period_month",
        期间: "period_month",
        FromCurrency: "from_currency",
        from_currency: "from_currency",
        源币种: "from_currency",
        原币: "from_currency",
        币种: "from_currency",
        ToCurrency: "to_currency",
        to_currency: "to_currency",
        目标币种: "to_currency",
        Rate: "rate",
        rate: "rate",
        汇率: "rate",
      },
    },
    exportColumns: ["period_month", "from_currency", "to_currency", "rate", "source_file"],
  },
};

export function normalizeAdminDataset(value: unknown): AdminDataset {
  return value === "customer" || value === "target" || value === "exchange" ? value : "sales";
}

export function normalizeAdminReportDataset(value: unknown): Exclude<AdminDataset, "exchange"> {
  return value === "customer" || value === "target" ? value : "sales";
}

export function normalizeAdminViewConfig(value: unknown, fallbackDataset: AdminDataset): AdminViewConfig {
  if (!value || typeof value !== "object") {
    return defaultAdminViewConfigs[fallbackDataset];
  }

  const candidate = value as Partial<AdminViewConfig>;
  const dataset = normalizeAdminDataset(candidate.dataset ?? fallbackDataset);
  const fallback = defaultAdminViewConfigs[dataset];

  return {
    dataset,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : fallback.title,
    columns: Array.isArray(candidate.columns) && candidate.columns.length > 0 ? mergeColumns(fallback.columns, candidate.columns) : fallback.columns,
    filters: Array.isArray(candidate.filters) ? candidate.filters : fallback.filters,
    import: {
      requiredColumns: dataset === "sales" ? fallback.import.requiredColumns : Array.isArray(candidate.import?.requiredColumns) ? candidate.import.requiredColumns : fallback.import.requiredColumns,
      aliases: candidate.import?.aliases && typeof candidate.import.aliases === "object" ? { ...fallback.import.aliases, ...candidate.import.aliases } : fallback.import.aliases,
    },
    exportColumns: Array.isArray(candidate.exportColumns) && candidate.exportColumns.length > 0 ? mergeKeys(fallback.exportColumns, candidate.exportColumns) : fallback.exportColumns,
  };
}

function mergeColumns(fallbackColumns: AdminViewConfig["columns"], customColumns: AdminViewConfig["columns"]) {
  const customKeys = new Set(customColumns.map((column) => column.key));
  return [...customColumns, ...fallbackColumns.filter((column) => !customKeys.has(column.key))];
}

function mergeKeys(fallbackKeys: string[], customKeys: string[]) {
  const nextKeys = new Set(customKeys);
  return [...customKeys, ...fallbackKeys.filter((key) => !nextKeys.has(key))];
}

export function validateAdminViewConfig(config: AdminViewConfig) {
  const errors: string[] = [];
  const dataset = normalizeAdminDataset(config.dataset);
  if (dataset !== config.dataset) errors.push("dataset 只能是 sales / customer / target / exchange。");
  return errors;
}

export function validateAdminReportConfig(report: AdminReportConfig, ownerDataset: AdminDataset = report.baseDataset, path = "config") {
  const errors: string[] = [];
  const kind = report.kind ?? "detail";

  if (!report.id || !report.title) errors.push(`${path} 必须配置 id 和 title。`);
  if (!isAdminDataset(report.baseDataset)) {
    errors.push(`${path}.baseDataset 只能是 sales / customer / target / exchange。`);
    return errors;
  }
  if (report.baseDataset !== ownerDataset) errors.push(`${path}.baseDataset 必须等于当前配置 dataset。`);

  const aliases = new Map<string, AdminDataset>();
  if (kind === "aggregate") {
    (report.joins ?? []).forEach((join, joinIndex) => {
      const joinPath = `${path}.joins[${joinIndex}]`;
      if (!join.alias || aliases.has(join.alias) || join.alias === "base") errors.push(`${joinPath}.alias 不能为空、不能重复，也不能使用 base。`);
      if (!isAdminDataset(join.dataset)) {
        errors.push(`${joinPath}.dataset 只能是 sales / customer / target / exchange。`);
        return;
      }
      if (join.type && join.type !== "left" && join.type !== "inner") errors.push(`${joinPath}.type 只能是 left / inner。`);
      if (!isAllowedReportField(report.baseDataset, join.leftKey)) errors.push(`${joinPath}.leftKey 不是 ${report.baseDataset} 的允许字段。`);
      if (!isAllowedReportField(join.dataset, join.rightKey)) errors.push(`${joinPath}.rightKey 不是 ${join.dataset} 的允许字段。`);
      aliases.set(join.alias, join.dataset);
    });
  }

  if (kind === "aggregate") {
    if (!Array.isArray(report.dimensions) || report.dimensions.length === 0) errors.push(`${path}.dimensions 至少需要 1 个维度。`);
    (report.dimensions ?? []).forEach((dimension, dimensionIndex) => {
      const sourceDataset = resolveReportSourceDataset(report.baseDataset, aliases, dimension.source);
      if (!dimension.key || !dimension.label || !dimension.field) {
        errors.push(`${path}.dimensions[${dimensionIndex}] 必须配置 key / label / field。`);
        return;
      }
      if (!sourceDataset) errors.push(`${path}.dimensions[${dimensionIndex}].source 不在 base 或 joins 中。`);
      else if (!isAllowedReportField(sourceDataset, dimension.field)) errors.push(`${path}.dimensions[${dimensionIndex}].field 不是 ${sourceDataset} 的允许字段。`);
    });

    if (!Array.isArray(report.measures) || report.measures.length === 0) errors.push(`${path}.measures 至少需要 1 个指标。`);
    (report.measures ?? []).forEach((measure, measureIndex) => {
      const sourceDataset = resolveReportSourceDataset(report.baseDataset, aliases, measure.source);
      if (!measure.key || !measure.label || !measure.type) {
        errors.push(`${path}.measures[${measureIndex}] 必须配置 key / label / type。`);
        return;
      }
      if (measure.type !== "sum" && measure.type !== "count" && measure.type !== "countDistinct") errors.push(`${path}.measures[${measureIndex}].type 只能是 sum / count / countDistinct。`);
      if (measure.type !== "count" && !measure.field) errors.push(`${path}.measures[${measureIndex}].field 在 sum / countDistinct 时必填。`);
      if (measure.field) {
        if (!sourceDataset) errors.push(`${path}.measures[${measureIndex}].source 不在 base 或 joins 中。`);
        else if (!isAllowedReportField(sourceDataset, measure.field)) errors.push(`${path}.measures[${measureIndex}].field 不是 ${sourceDataset} 的允许字段。`);
      }
    });
  }

  if (!Array.isArray(report.columns) || report.columns.length === 0) errors.push(`${path}.columns 至少需要 1 个展示列。`);
  const dimensionKeys = new Set((report.dimensions ?? []).map((dimension) => dimension.key));
  const measureKeys = new Set((report.measures ?? []).map((measure) => measure.key));
  report.columns.forEach((column, columnIndex) => {
    if (!column.key || !column.label) errors.push(`${path}.columns[${columnIndex}] 必须配置 key / label。`);
    if (kind === "aggregate" && !dimensionKeys.has(column.key) && !measureKeys.has(column.key)) errors.push(`${path}.columns[${columnIndex}].key 必须来自 dimensions 或 measures。`);
  });

  if (kind === "aggregate" && report.defaultSort && !dimensionKeys.has(report.defaultSort.key) && !measureKeys.has(report.defaultSort.key)) errors.push(`${path}.defaultSort.key 必须来自 dimensions 或 measures。`);
  return errors;
}

function isAdminDataset(value: unknown): value is AdminDataset {
  return value === "sales" || value === "customer" || value === "target" || value === "exchange";
}

function resolveReportSourceDataset(baseDataset: AdminDataset, aliases: Map<string, AdminDataset>, source?: string) {
  if (!source || source === "base") return baseDataset;
  return aliases.get(source) ?? null;
}

function isAllowedReportField(dataset: AdminDataset, field: string | undefined) {
  if (!field) return false;
  return new Set(defaultAdminViewConfigs[dataset].columns.map((column) => column.key)).has(field);
}

function toReportColumns(columns: Array<{ key: string; label: string; type: AdminViewConfig["columns"][number]["type"]; visible?: boolean }>): AdminReportColumn[] {
  return columns.map((column) => ({
    key: column.key,
    label: column.label,
    type: column.type,
  }));
}
