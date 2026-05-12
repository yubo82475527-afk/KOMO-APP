import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";
import { getAdminViewConfigs, listAdminDataRecords, normalizeAdminDataset } from "@/features/admin-data/admin-data-service";
import { AdminReportsView } from "@/features/admin-data/reports-view";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ scopeDepartmentId?: string; reportId?: string; dataset?: string; startDate?: string; endDate?: string; orgUnit?: string; personName?: string; category?: string; keyword?: string }>;
}) {
  const gate = await getAdminGate("reports", "/admin/reports");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const reportFilters = {
    dataset: normalizeAdminDataset(params.dataset),
    reportId: params.reportId,
    startDate: params.startDate,
    endDate: params.endDate,
    orgUnit: params.orgUnit,
    scopeDepartmentId: params.scopeDepartmentId,
    personName: params.personName,
    category: params.category,
    keyword: params.keyword,
    page: 1,
    pageSize: 20,
  };
  const [configs, scope, reportResult] = await Promise.all([
    getAdminViewConfigs(),
    getAdminShellScope(params.scopeDepartmentId),
    listAdminDataRecords(reportFilters),
  ]);
  const reportsKey = [
    params.scopeDepartmentId ?? "all",
    params.reportId ?? "",
    params.dataset ?? "sales",
    params.startDate ?? "",
    params.endDate ?? "",
    params.orgUnit ?? "",
    params.personName ?? "",
    params.category ?? "",
    params.keyword ?? "",
  ].join(":");
  return (
    <AdminShell active="reports" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      <AdminReportsView
        key={reportsKey}
        configs={configs}
        initialReportId={params.reportId}
        initialResult={"state" in reportResult ? null : reportResult}
      />
    </AdminShell>
  );
}
