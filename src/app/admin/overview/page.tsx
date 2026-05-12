import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";
import { getOpsOverviewData } from "@/features/admin-ops/ops-service";
import { AdminOpsOverviewView } from "@/features/admin-ops/overview-view";

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scopeDepartmentId?: string; preset?: string; startDate?: string; endDate?: string }>;
}) {
  const gate = await getAdminGate("overview", "/admin/overview");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const [data, scope] = await Promise.all([
    getOpsOverviewData({
      preset: params.preset,
      startDate: params.startDate,
      endDate: params.endDate,
      scopeDepartmentId: params.scopeDepartmentId,
    }),
    getAdminShellScope(params.scopeDepartmentId),
  ]);
  return (
    <AdminShell active="overview" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      {"state" in data ? (
        <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 text-sm text-[#c1121f] shadow-sm">{data.state === "signed_out" ? "请先登录。" : data.message}</div>
      ) : (
        <AdminOpsOverviewView key={`${data.scope.currentDepartmentId ?? "all"}:${data.preset}:${data.startDate}:${data.endDate}`} initialData={data} />
      )}
    </AdminShell>
  );
}
