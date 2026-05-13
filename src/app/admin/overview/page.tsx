import { getAdminGate } from "@/features/admin/admin-auth";
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
  const data = await getOpsOverviewData({
    preset: params.preset,
    startDate: params.startDate,
    endDate: params.endDate,
    scopeDepartmentId: params.scopeDepartmentId,
  });

  if ("state" in data) {
    return <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 text-sm text-[#c1121f] shadow-sm">{data.state === "signed_out" ? "请先登录。" : data.message}</div>;
  }

  return <AdminOpsOverviewView key={`${data.scope.currentDepartmentId ?? "all"}:${data.preset}:${data.startDate}:${data.endDate}`} initialData={data} />;
}
