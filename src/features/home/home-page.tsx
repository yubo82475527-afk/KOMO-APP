import { MobileShell } from "@/components/layout/mobile-shell";
import { getDictionary } from "@/lib/i18n";
import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getAppViewer } from "@/features/auth/viewer";
import { HomeView } from "./home-view";

export async function HomePageView() {
  const viewer = await getAppViewer();
  const locale = viewer.state === "ready" ? viewer.locale : "zh-CN";
  const dictionary = getDictionary(locale);

  if (viewer.state === "signed_out") {
    return <SignedOutState active="home" redirectTo="/" title={dictionary.home.signedOutTitle} description={dictionary.home.signedOutDescription} locale={locale} />;
  }

  if (viewer.state === "error") {
    return <ErrorState active="home" title={dictionary.home.loadErrorTitle} message={viewer.message} locale={locale} />;
  }

  return (
    <MobileShell active="home" locale={viewer.locale}>
      <HomeView viewer={viewer} />
    </MobileShell>
  );
}
