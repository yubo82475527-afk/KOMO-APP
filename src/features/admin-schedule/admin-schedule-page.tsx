import { MobileShell } from "@/components/layout/mobile-shell";
import { getDictionary } from "@/lib/i18n";
import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getAppViewer } from "@/features/auth/viewer";
import { AdminScheduleView } from "./admin-schedule-view";

export async function AdminSchedulePageView() {
  const viewer = await getAppViewer();
  const locale = viewer.state === "ready" ? viewer.locale : "zh-CN";
  const dictionary = getDictionary(locale);

  if (viewer.state === "signed_out") {
    return (
      <SignedOutState
        active="adminSchedule"
        redirectTo="/admin/schedule"
        title={dictionary.adminSchedule.signedOutTitle}
        description={dictionary.adminSchedule.signedOutDescription}
        locale={locale}
      />
    );
  }

  if (viewer.state === "error") {
    return <ErrorState active="adminSchedule" title={dictionary.adminSchedule.loadErrorTitle} message={viewer.message} locale={locale} />;
  }

  if (!viewer.roles.includes("admin") && !viewer.roles.includes("hr")) {
    return <ErrorState active="adminSchedule" title={dictionary.adminSchedule.noPermissionTitle} message={dictionary.adminSchedule.noPermissionDescription} locale={locale} />;
  }

  return (
    <MobileShell active="adminSchedule" locale={viewer.locale}>
      <AdminScheduleView locale={viewer.locale} />
    </MobileShell>
  );
}
