import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";
import { getAdminScheduleList } from "./admin-schedule-data";
import { AdminScheduleView } from "./admin-schedule-view";

export async function AdminSchedulePageView({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  const gate = await getAdminGate("schedule", "/admin/schedule");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const [scope, scheduleResult] = await Promise.all([getAdminShellScope(params.scopeDepartmentId), getAdminScheduleList(params.scopeDepartmentId)]);

  return (
    <AdminShell active="schedule" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      {"state" in scheduleResult && scheduleResult.state !== "success" ? (
        <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 text-sm text-[#c1121f] shadow-sm">{scheduleResult.state === "signed_out" ? "请先登录。" : scheduleResult.message}</div>
      ) : (
        <AdminScheduleView locale={gate.viewer.locale} rows={scheduleResult.rows} scopeDepartmentId={params.scopeDepartmentId ?? ""} />
      )}
    </AdminShell>
  );
}
