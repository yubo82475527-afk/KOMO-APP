import { applyOrgUnitScope, isOrgUnitInScope, resolveAdminOrgScope, type AdminOrgScope } from "@/features/admin/admin-org-scope";
import { getAdminDataContext } from "@/features/admin-data/admin-data-service";
import type { AdminBusinessRecordRow, AdminCustomerRecordRow, Json, OpsTaskInsert, OpsTaskRow, StoreDailyTargetRow } from "@/lib/database.types";
import type { CreateOpsTaskInput, OpsAlert, OpsDatePreset, OpsMetricKey, OpsOverviewData, OpsStorePerformance, OpsTask, UpdateOpsTaskInput } from "./ops-model";

const alertThreshold = 0.8;

type OverviewQueryInput =
  | string
  | {
      startDate?: string;
      endDate?: string;
      preset?: string;
      scopeDepartmentId?: string | null;
    };

export async function getOpsOverviewData(input?: OverviewQueryInput): Promise<OpsOverviewData | { state: "signed_out" } | { state: "error"; message: string }> {
  const range = resolveOverviewRange(input);
  const scopeDepartmentId = typeof input === "string" ? null : input?.scopeDepartmentId;
  const context = await getAdminDataContext();
  if (context.state !== "ready") return context;

  const scope = await resolveAdminOrgScope(context, scopeDepartmentId);
  if (scope.state === "error") return scope;

  const [salesResult, customerResult, targetResult, taskResult, unboundResult] = await Promise.all([
    applyOrgUnitScope(context.adminClient.from("sales_records").select("*").gte("record_date", range.startDate).lte("record_date", range.endDate), scope),
    applyOrgUnitScope(context.adminClient.from("customer_records").select("*").gte("created_on", range.startDate).lte("created_on", range.endDate), scope),
    applyOrgUnitScope(context.adminClient.from("store_daily_targets").select("*").gte("target_date", range.startDate).lte("target_date", range.endDate), scope),
    applyOrgUnitScope(context.adminClient.from("ops_tasks").select("*").gte("task_date", range.startDate).lte("task_date", range.endDate).order("created_at", { ascending: false }), scope),
    scope.isHeadquarters && scope.currentDepartmentId === null
      ? context.adminClient.from("sales_records").select("org_unit").gte("record_date", range.startDate).lte("record_date", range.endDate)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError = salesResult.error ?? customerResult.error ?? targetResult.error ?? taskResult.error ?? unboundResult.error;
  if (firstError) return { state: "error", message: firstError.message };

  const stores = buildStorePerformance({
    sales: (salesResult.data ?? []) as unknown as AdminBusinessRecordRow[],
    customers: (customerResult.data ?? []) as unknown as AdminCustomerRecordRow[],
    targets: (targetResult.data ?? []) as unknown as StoreDailyTargetRow[],
  });

  const metrics = buildOverviewMetrics(stores);
  const alerts = buildAlerts(range.startDate, range.endDate, stores, scope.currentDepartmentId);

  return {
    startDate: range.startDate,
    endDate: range.endDate,
    preset: range.preset,
    scope: {
      isHeadquarters: scope.isHeadquarters,
      currentDepartmentId: scope.currentDepartmentId,
      currentDepartmentName: scope.currentDepartmentName,
      scopeType: scope.scopeType,
      visibleOrgUnits: scope.visibleOrgUnits,
      switcherOptions: scope.switcherOptions,
    },
    metrics,
    stores: stores.sort((left, right) => right.sales - left.sales),
    alerts,
    tasks: ((taskResult.data ?? []) as unknown as OpsTaskRow[]).map(mapTaskRow),
    missingTargetStores: stores.filter((store) => !store.hasTarget && hasActivity(store)).map((store) => store.orgUnit),
    unboundOrgUnits: getUnboundOrgUnits((unboundResult.data ?? []) as Array<{ org_unit: string | null }>, scope),
  };
}

export async function listOpsTasks(date?: string) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") return context;
  const scope = await resolveAdminOrgScope(context);
  if (scope.state === "error") return scope;

  let query = context.adminClient.from("ops_tasks").select("*").order("created_at", { ascending: false }).limit(100);
  if (date) query = query.eq("task_date", date);
  query = applyOrgUnitScope(query, scope);

  const { data, error } = await query;
  if (error) return { state: "error" as const, message: error.message };
  return { state: "success" as const, tasks: ((data ?? []) as unknown as OpsTaskRow[]).map(mapTaskRow) };
}

export async function createOpsTask(input: CreateOpsTaskInput) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") return context;
  const scope = await resolveAdminOrgScope(context);
  if (scope.state === "error") return scope;
  if (!isOrgUnitInScope(scope, input.orgUnit)) return { state: "error" as const, message: "无权为该门店创建经营待办。" };

  const payload: OpsTaskInsert = {
    task_date: input.taskDate ?? getBusinessDate(),
    org_unit: input.orgUnit,
    task_type: input.taskType,
    title: input.title,
    summary: input.summary,
    reason_snapshot: input.reasonSnapshot ?? {},
    assignee_profile_id: input.assigneeProfileId ?? context.profileId,
    due_at: input.dueAt ?? null,
    status: "open",
    created_by: context.profileId,
  };

  const { data, error } = await context.adminClient.from("ops_tasks").insert(payload).select("*").single<OpsTaskRow>();
  if (error || !data) return { state: "error" as const, message: error?.message ?? "创建待办失败。" };
  return { state: "success" as const, task: mapTaskRow(data) };
}

export async function updateOpsTask(id: string, input: UpdateOpsTaskInput) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") return context;
  const scope = await resolveAdminOrgScope(context);
  if (scope.state === "error") return scope;

  const { data: existing, error: existingError } = await context.adminClient.from("ops_tasks").select("*").eq("id", id).maybeSingle<OpsTaskRow>();
  if (existingError || !existing) return { state: "error" as const, message: existingError?.message ?? "待办不存在。" };
  if (!isOrgUnitInScope(scope, existing.org_unit)) return { state: "error" as const, message: "无权更新该门店待办。" };

  const status = input.status;
  const payload = {
    ...(status ? { status, resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null } : {}),
    ...(input.dueAt !== undefined ? { due_at: input.dueAt } : {}),
    ...(input.assigneeProfileId !== undefined ? { assignee_profile_id: input.assigneeProfileId } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await context.adminClient.from("ops_tasks").update(payload).eq("id", id).select("*").single<OpsTaskRow>();
  if (error || !data) return { state: "error" as const, message: error?.message ?? "更新待办失败。" };
  return { state: "success" as const, task: mapTaskRow(data) };
}

function buildStorePerformance(input: { sales: AdminBusinessRecordRow[]; customers: AdminCustomerRecordRow[]; targets: StoreDailyTargetRow[] }) {
  const stores = new Map<string, OpsStorePerformance>();

  input.targets.forEach((target) => {
    const store = ensureStore(stores, target.org_unit);
    store.targetNewCustomers += Number(target.target_new_customers ?? 0);
    store.targetEquitySales += Number(target.target_equity_sales_amount ?? 0);
    store.targetServiceSales += Number(target.target_service_sales_amount ?? 0);
    store.hasTarget = true;
  });

  input.sales.forEach((sale) => {
    if (!sale.org_unit) return;
    const store = ensureStore(stores, sale.org_unit);
    const equityAmount = getEquitySaleAmount(sale);
    const serviceAmount = getServiceSaleAmount(sale);
    const amount = equityAmount + serviceAmount || getNumericValue(sale.amount);
    store.sales += amount;
    store.equitySales += equityAmount;
    store.serviceSales += serviceAmount;
  });

  input.customers.forEach((customer) => {
    if (!customer.org_unit) return;
    const store = ensureStore(stores, customer.org_unit);
    store.newCustomers += 1;
  });

  return [...stores.values()];
}

function buildOverviewMetrics(stores: OpsStorePerformance[]) {
  const actualSales = sum(stores, "sales");
  const actualNewCustomers = sum(stores, "newCustomers");
  const actualEquitySales = sum(stores, "equitySales");
  const actualServiceSales = sum(stores, "serviceSales");
  const targetNewCustomers = sum(stores, "targetNewCustomers");
  const targetEquitySales = sum(stores, "targetEquitySales");
  const targetServiceSales = sum(stores, "targetServiceSales");

  return [
    { key: "sales" as const, label: "销售", actual: actualSales, target: targetEquitySales + targetServiceSales, achievementRate: getRate(actualSales, targetEquitySales + targetServiceSales) },
    { key: "newCustomers" as const, label: "新客", actual: actualNewCustomers, target: targetNewCustomers, achievementRate: getRate(actualNewCustomers, targetNewCustomers) },
    { key: "equitySales" as const, label: "权益销售", actual: actualEquitySales, target: targetEquitySales, achievementRate: getRate(actualEquitySales, targetEquitySales) },
    { key: "serviceSales" as const, label: "项目销售", actual: actualServiceSales, target: targetServiceSales, achievementRate: getRate(actualServiceSales, targetServiceSales) },
  ];
}

function buildAlerts(startDate: string, endDate: string, stores: OpsStorePerformance[], scopeDepartmentId: string | null) {
  return stores.flatMap((store) => {
    if (!store.hasTarget) return [];
    return [
      makeAlert(startDate, endDate, store, "newCustomers", "new_customer_alert", "新客低于目标", store.newCustomers, store.targetNewCustomers, scopeDepartmentId),
      makeAlert(startDate, endDate, store, "equitySales", "equity_sales_alert", "权益销售低于目标", store.equitySales, store.targetEquitySales, scopeDepartmentId),
      makeAlert(startDate, endDate, store, "serviceSales", "service_sales_alert", "项目销售低于目标", store.serviceSales, store.targetServiceSales, scopeDepartmentId),
      makeAlert(startDate, endDate, store, "sales", "sales_alert", "销售低于目标", store.sales, store.targetEquitySales + store.targetServiceSales, scopeDepartmentId),
    ].filter(Boolean) as OpsAlert[];
  });
}

function makeAlert(
  startDate: string,
  endDate: string,
  store: OpsStorePerformance,
  metricKey: OpsMetricKey,
  taskType: OpsAlert["taskType"],
  label: string,
  actual: number,
  target: number,
  scopeDepartmentId: string | null,
): OpsAlert | null {
  if (target <= 0) return null;
  const rate = getRate(actual, target);
  if (rate === null || rate >= alertThreshold) return null;
  const severity = rate < 0.5 ? "danger" : "warning";
  const title = `${store.orgUnit} ${label}`;
  const summary = `${label}：实际 ${formatNumber(actual)}，目标 ${formatNumber(target)}，达成率 ${Math.round(rate * 100)}%。`;
  const reportParams = new URLSearchParams({
    dataset: metricKey === "newCustomers" ? "customer" : "sales",
    startDate,
    endDate,
    orgUnit: store.orgUnit,
  });
  if (scopeDepartmentId) reportParams.set("scopeDepartmentId", scopeDepartmentId);
  return {
    id: `${startDate}:${endDate}:${store.orgUnit}:${taskType}`,
    taskType,
    orgUnit: store.orgUnit,
    metricKey,
    title,
    summary,
    actual,
    target,
    achievementRate: rate,
    severity,
    reportHref: `/admin/reports?${reportParams.toString()}`,
    reasonSnapshot: { startDate, endDate, orgUnit: store.orgUnit, metricKey, actual, target, achievementRate: rate, scopeDepartmentId },
  };
}

function ensureStore(stores: Map<string, OpsStorePerformance>, orgUnit: string) {
  const existing = stores.get(orgUnit);
  if (existing) return existing;
  const next: OpsStorePerformance = {
    orgUnit,
    sales: 0,
    newCustomers: 0,
    equitySales: 0,
    serviceSales: 0,
    targetNewCustomers: 0,
    targetEquitySales: 0,
    targetServiceSales: 0,
    hasTarget: false,
  };
  stores.set(orgUnit, next);
  return next;
}

function mapTaskRow(row: OpsTaskRow): OpsTask {
  return {
    id: row.id,
    taskDate: row.task_date,
    orgUnit: row.org_unit,
    taskType: row.task_type,
    title: row.title,
    summary: row.summary,
    status: row.status,
    dueAt: row.due_at,
    resolvedAt: row.resolved_at,
    assigneeProfileId: row.assignee_profile_id,
    createdAt: row.created_at,
    reasonSnapshot: row.reason_snapshot,
  };
}

function isEquitySale(row: AdminBusinessRecordRow) {
  if (row.sale_type?.trim() === "权益") return true;
  if (row.sale_type?.trim() === "项目") return false;
  const haystack = [row.sale_type, row.sale_category, row.payment_method, row.related_equity, row.item_name, getRawText(row.raw_data)].join(" ");
  return /权益|套餐|储值|会员|package|membership|member|wallet/i.test(haystack);
}

function isServiceSale(row: AdminBusinessRecordRow) {
  if (row.sale_type?.trim() === "项目") return true;
  if (row.sale_type?.trim() === "权益") return false;
  const haystack = [row.sale_type, row.sale_category, row.item_name, row.category, row.remark, getRawText(row.raw_data)].join(" ");
  return /项目|服务|护理|养护|service|scalp|hair|care|treatment/i.test(haystack) && !isEquitySale(row);
}

function getEquitySaleAmount(row: AdminBusinessRecordRow) {
  if (!isEquitySale(row)) return 0;
  return getNumericValue(row.receivable_amount ?? row.amount);
}

function getServiceSaleAmount(row: AdminBusinessRecordRow) {
  if (!isServiceSale(row)) return 0;
  return getNumericValue(row.amount ?? row.receivable_amount);
}

function getNumericValue(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function getRawText(rawData: Json) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return "";
  return Object.values(rawData)
    .map((value) => String(value ?? ""))
    .join(" ");
}

function getUnboundOrgUnits(rows: Array<{ org_unit: string | null }>, scope: AdminOrgScope) {
  if (scope.state !== "ready" || !scope.isHeadquarters || scope.currentDepartmentId !== null) return [];
  const known = new Set(scope.allOrgUnits);
  return [
    ...new Set(
      rows
        .map((row) => row.org_unit?.trim() ?? "")
        .filter((orgUnit) => orgUnit.length > 0 && !known.has(orgUnit)),
    ),
  ];
}

function hasActivity(store: OpsStorePerformance) {
  return store.sales > 0 || store.newCustomers > 0 || store.equitySales > 0 || store.serviceSales > 0;
}

function sum(stores: OpsStorePerformance[], key: keyof OpsStorePerformance) {
  return stores.reduce((total, store) => total + Number(store[key] ?? 0), 0);
}

function getRate(actual: number, target: number) {
  return target > 0 ? actual / target : null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value);
}

export function getBusinessDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function resolveOverviewRange(input?: OverviewQueryInput) {
  if (typeof input === "string") {
    const date = normalizeDate(input) ?? getBusinessDate();
    return { startDate: date, endDate: date, preset: "today" as OpsDatePreset };
  }

  const preset = normalizePreset(input?.preset);
  const startDate = normalizeDate(input?.startDate);
  const endDate = normalizeDate(input?.endDate);

  if (preset === "custom") {
    const today = getBusinessDate();
    const normalizedStart = startDate ?? endDate ?? today;
    const normalizedEnd = endDate ?? startDate ?? today;
    return normalizedStart <= normalizedEnd
      ? { startDate: normalizedStart, endDate: normalizedEnd, preset }
      : { startDate: normalizedEnd, endDate: normalizedStart, preset };
  }

  return getPresetRange(preset);
}

function normalizePreset(value?: string | null): OpsDatePreset {
  switch (value) {
    case "today":
    case "week":
    case "month":
    case "year":
    case "custom":
      return value;
    default:
      return "month";
  }
}

function getPresetRange(preset: Exclude<OpsDatePreset, "custom">) {
  const today = parseDateAtMidday(getBusinessDate());
  if (preset === "today") {
    const date = formatDate(today);
    return { startDate: date, endDate: date, preset };
  }
  if (preset === "week") {
    const day = today.getDay() || 7;
    const start = addDays(today, 1 - day);
    return { startDate: formatDate(start), endDate: formatDate(today), preset };
  }
  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    return { startDate: formatDate(start), endDate: formatDate(today), preset };
  }
  const start = new Date(today.getFullYear(), 0, 1, 12);
  return { startDate: formatDate(start), endDate: formatDate(today), preset };
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function parseDateAtMidday(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
