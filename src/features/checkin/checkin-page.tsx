import { MobileShell } from "@/components/layout/mobile-shell";
import { getDictionary } from "@/lib/i18n";
import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getCheckinPageData } from "./checkin-service";
import { CheckinView } from "./checkin-view";

export async function CheckinPageView() {
  const data = await getCheckinPageData();
  const locale = data.state === "ready" ? data.locale : "zh-CN";
  const dictionary = getDictionary(locale);

  if (data.state === "signed_out") {
    return <SignedOutState active="checkin" redirectTo="/checkin" title={dictionary.checkin.signedOutTitle} description={dictionary.checkin.signedOutDescription} locale={locale} />;
  }

  if (data.state === "error") {
    return <ErrorState active="checkin" title={dictionary.checkin.loadErrorTitle} message={data.message} locale={locale} />;
  }

  return (
    <MobileShell active="checkin" locale={data.locale}>
      <CheckinView data={data} />
    </MobileShell>
  );
}
