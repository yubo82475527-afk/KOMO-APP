import { MobileShell } from "@/components/layout/mobile-shell";
import { getDictionary } from "@/lib/i18n";
import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getAppViewer } from "@/features/auth/viewer";
import { ProfileView } from "./profile-view";

export async function ProfilePageView() {
  const viewer = await getAppViewer();
  const locale = viewer.state === "ready" ? viewer.locale : "zh-CN";
  const dictionary = getDictionary(locale);

  if (viewer.state === "signed_out") {
    return <SignedOutState active="profile" redirectTo="/profile" title={dictionary.profile.signedOutTitle} description={dictionary.profile.signedOutDescription} locale={locale} />;
  }

  if (viewer.state === "error") {
    return <ErrorState active="profile" title={dictionary.profile.loadErrorTitle} message={viewer.message} locale={locale} />;
  }

  return (
    <MobileShell active="profile" locale={viewer.locale}>
      <ProfileView viewer={viewer} />
    </MobileShell>
  );
}
