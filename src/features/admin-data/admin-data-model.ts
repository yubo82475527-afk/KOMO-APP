import type { Json } from "@/lib/database.types";

export type AdminDataset = "sales" | "customer" | "target" | "exchange";
export type AdminReportDataset = Exclude<AdminDataset, "exchange">;

export type AdminColumnType = "text" | "number" | "date";
export type AdminFilterType = "text" | "dateRange";

export type AdminReportJoinType = "left" | "inner";
export type AdminReportMeasureType = "sum" | "count" | "countDistinct";
export type AdminReportSource = "base" | string;
export type AdminReportKind = "detail" | "aggregate";

export type AdminReportJoin = {
  alias: string;
  dataset: AdminReportDataset;
  leftKey: string;
  rightKey: string;
  type?: AdminReportJoinType;
};

export type AdminReportDimension = {
  key: string;
  label: string;
  source?: AdminReportSource;
  field: string;
};

export type AdminReportMeasure = {
  key: string;
  label: string;
  type: AdminReportMeasureType;
  source?: AdminReportSource;
  field?: string;
};

export type AdminReportColumn = {
  key: string;
  label: string;
  type?: AdminColumnType;
  source?: AdminReportSource;
  field?: string;
};

export type AdminReportConfig = {
  id: string;
  title: string;
  kind?: AdminReportKind;
  description?: string;
  baseDataset: AdminReportDataset;
  filters?: AdminViewFilter[];
  joins?: AdminReportJoin[];
  dimensions?: AdminReportDimension[];
  measures?: AdminReportMeasure[];
  columns: AdminReportColumn[];
  exportColumns?: string[];
  defaultSort?: {
    key: string;
    direction: "asc" | "desc";
  };
};

export type AdminViewColumn = {
  key: string;
  label: string;
  type: AdminColumnType;
  visible?: boolean;
  summary?: "sum";
};

export type AdminViewFilter = {
  key: string;
  label: string;
  type: AdminFilterType;
};

export type AdminViewConfig = {
  dataset: AdminDataset;
  title: string;
  columns: AdminViewColumn[];
  filters: AdminViewFilter[];
  reports?: AdminReportConfig[];
  import: {
    requiredColumns: string[];
    aliases: Record<string, string>;
  };
  exportColumns: string[];
};

export type AdminReportConfigRecord = {
  id: string;
  dataset: AdminReportDataset;
  title: string;
  kind: AdminReportKind;
  config: AdminReportConfig;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminDataRecord = {
  id?: string;
  record_date?: string;
  org_unit: string | null;
  employee_no: string | null;
  person_name: string | null;
  amount?: number;
  quantity: number | null;
  category: string | null;
  reference_no: string | null;
  remark: string | null;
  sale_type?: string | null;
  sale_category?: string | null;
  item_no?: string | null;
  item_name?: string | null;
  standard_price?: number | null;
  receivable_amount?: number | null;
  payment_method?: string | null;
  payment_amount?: number | null;
  cash_payment_amount?: number | null;
  equity_payment_amount?: number | null;
  related_equity?: string | null;
  equity_book_change?: number | null;
  book_unit?: string | null;
  accounting_amount?: number | null;
  equity_store?: string | null;
  employee_name?: string | null;
  actual_performance?: number | null;
  assignment_type?: string | null;
  service_role?: string | null;
  employee_department?: string | null;
  customer_name?: string | null;
  customer_no?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  card_no?: string | null;
  phone?: string | null;
  email?: string | null;
  birthday?: string | null;
  tags?: string | null;
  channel?: string | null;
  referrer?: string | null;
  advisor?: string | null;
  last_consumed_on?: string | null;
  total_consumptions?: number | null;
  created_on?: string | null;
  source?: string | null;
  target_date?: string;
  target_new_customers?: number | null;
  target_equity_sales_amount?: number | null;
  target_service_sales_amount?: number | null;
  currency_code?: string | null;
  exchange_rate_to_cny?: number | null;
  amount_cny?: number | null;
  receivable_amount_cny?: number | null;
  payment_amount_cny?: number | null;
  equity_amount_cny?: number | null;
  service_amount_cny?: number | null;
  target_equity_sales_amount_cny?: number | null;
  target_service_sales_amount_cny?: number | null;
  period_month?: string;
  from_currency?: string | null;
  to_currency?: string | null;
  rate?: number | null;
  source_file?: string | null;
  document_no?: string | null;
  document_type?: string | null;
  customer_gender?: string | null;
  visit_channel?: string | null;
  cashier?: string | null;
  accounting_date?: string | null;
  operation_time?: string | null;
  raw_data: Json;
};

export type AdminImportError = {
  row: number;
  column?: string;
  message: string;
};

export type AdminImportPreview = {
  dataset: AdminDataset;
  fileName: string;
  rows: AdminDataRecord[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: AdminImportError[];
  config: AdminViewConfig;
};

export type AdminReportFilters = {
  dataset?: AdminDataset;
  reportId?: string;
  startDate?: string;
  endDate?: string;
  orgUnit?: string;
  scopeDepartmentId?: string;
  personName?: string;
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

export type AdminReportResult = {
  mode: "detail";
  dataset: AdminDataset;
  config: AdminViewConfig;
  report?: AdminReportConfig;
  columns: AdminReportColumn[];
  rows: AdminDataRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    amount: number;
    quantity: number;
  };
};

export type AdminAggregatedReportResult = {
  mode: "report";
  dataset: AdminDataset;
  config: AdminViewConfig;
  report: AdminReportConfig;
  columns: AdminReportColumn[];
  rows: Array<Record<string, string | number | null>>;
  total: number;
  page: number;
  pageSize: number;
  summary: Array<{
    key: string;
    label: string;
    value: number;
  }>;
};
