import { MobileShell } from "@/components/layout/mobile-shell";
import { getDictionary } from "@/lib/i18n";
import { AuthCard } from "@/features/auth/auth-card";
import { ScheduleView } from "@/features/schedule/schedule-view";
import { getSchedulePageData } from "@/features/schedule/schedule-data";

export async function SchedulePageView() {
  const data = await getSchedulePageData();
  const locale = data.state === "ready" ? data.locale : "zh-CN";
  const dictionary = getDictionary(locale);

  return (
    <MobileShell active="schedule" locale={locale}>
      {data.state === "signed_out" && <AuthCard redirectTo="/schedule" locale={locale} />}
      {data.state === "error" && (
        <section className="rounded-3xl border border-[#ffd6d6] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#17202f]">{dictionary.schedule.loadErrorTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[#607089]">{data.message}</p>
        </section>
      )}
      {data.state === "ready" && <ScheduleView data={data} />}
    </MobileShell>
  );
}
