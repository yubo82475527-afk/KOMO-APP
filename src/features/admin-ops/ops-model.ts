import type { AdminScopeOption } from "@/features/admin/admin-org-scope";
import type { Json, OpsTaskRow } from "@/lib/database.types";

export type OpsAlertType = OpsTaskRow["task_type"];
export type OpsTaskStatus = OpsTaskRow["status"];
export type OpsMetricKey = "sales" | "newCustomers" | "equitySales" | "serviceSales";

export type OpsOverviewMetric = {
  key: OpsMetricKey;
  label: string;
  actual: number;
  target: number;
  achievementRate: number | null;
  currencyCode?: string;
};

export type OpsScopeSummary = {
  isHeadquarters: boolean;
  currentDepartmentId: string | null;
  currentDepartmentName: string;
  scopeType: "company" | "department" | "store";
  visibleOrgUnits: string[];
  switcherOptions: AdminScopeOption[];
  displayCurrency: string;
  currencyMode: "base" | "local";
  missingExchangeRates: string[];
};

export type OpsStorePerformance = {
  orgUnit: string;
  sales: number;
  newCustomers: number;
  equitySales: number;
  serviceSales: number;
  targetNewCustomers: number;
  targetEquitySales: number;
  targetServiceSales: number;
  hasTarget: boolean;
  currencyCode?: string | null;
};

export type OpsAlert = {
  id: string;
  taskType: OpsAlertType;
  orgUnit: string;
  metricKey: OpsMetricKey;
  title: string;
  summary: string;
  actual: number;
  target: number;
  achievementRate: number | null;
  severity: "warning" | "danger";
  reportHref: string;
  reasonSnapshot: Json;
};

export type OpsTask = {
  id: string;
  taskDate: string;
  orgUnit: string;
  taskType: OpsAlertType;
  title: string;
  summary: string;
  status: OpsTaskStatus;
  dueAt: string | null;
  resolvedAt: string | null;
  assigneeProfileId: string | null;
  createdAt: string;
  reasonSnapshot: Json;
};

export type OpsDatePreset = "today" | "week" | "month" | "year" | "custom";

export type OpsOverviewData = {
  startDate: string;
  endDate: string;
  preset: OpsDatePreset;
  scope: OpsScopeSummary;
  metrics: OpsOverviewMetric[];
  stores: OpsStorePerformance[];
  alerts: OpsAlert[];
  tasks: OpsTask[];
  missingTargetStores: string[];
  unboundOrgUnits: string[];
};

export type CreateOpsTaskInput = {
  taskDate?: string;
  orgUnit: string;
  taskType: OpsAlertType;
  title: string;
  summary: string;
  reasonSnapshot?: Json;
  dueAt?: string | null;
  assigneeProfileId?: string | null;
};

export type UpdateOpsTaskInput = {
  status?: OpsTaskStatus;
  dueAt?: string | null;
  assigneeProfileId?: string | null;
  summary?: string;
};
