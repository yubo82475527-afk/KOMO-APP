import { MobileShell } from "@/components/layout/mobile-shell";
import { AuthCard } from "@/features/auth/auth-card";
import { ScheduleView } from "@/features/schedule/schedule-view";
import { getSchedulePageData } from "@/features/schedule/schedule-data";

export async function SchedulePageView() {
  const data = await getSchedulePageData();

  return (
    <MobileShell active="schedule">
      {data.state === "signed_out" && <AuthCard redirectTo="/schedule" />}
      {data.state === "error" && (
        <section className="rounded-3xl border border-[#ffd6d6] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#17202f]">暂时无法读取排班</h2>
          <p className="mt-2 text-sm leading-6 text-[#607089]">{data.message}</p>
        </section>
      )}
      {data.state === "ready" && <ScheduleView data={data} />}
    </MobileShell>
  );
}
