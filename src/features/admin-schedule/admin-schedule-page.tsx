import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminScheduleList } from "./admin-schedule-data";
import { AdminScheduleView } from "./admin-schedule-view";

export async function AdminSchedulePageView({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  const gate = await getAdminGate("schedule", "/admin/schedule");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const scheduleResult = await getAdminScheduleList(params.scopeDepartmentId);

  if ("state" in scheduleResult && scheduleResult.state !== "success") {
    return <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 text-sm text-[#c1121f] shadow-sm">{scheduleResult.state === "signed_out" ? "请先登录。" : scheduleResult.message}</div>;
  }

  return <AdminScheduleView locale={gate.viewer.locale} rows={scheduleResult.rows} scopeDepartmentId={params.scopeDepartmentId ?? ""} />;
}
