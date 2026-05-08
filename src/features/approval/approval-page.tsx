import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getDictionary } from "@/lib/i18n";
import { getApprovalPageData } from "./approval-service";
import { ApprovalView } from "./approval-view";

export async function ApprovalPageView() {
  const data = await getApprovalPageData();
  const locale = data.state === "ready" ? data.locale : "zh-CN";
  const dictionary = getDictionary(locale);

  if (data.state === "signed_out") {
    return <SignedOutState active="approval" redirectTo="/approval" title={dictionary.approval.signedOutTitle} description={dictionary.approval.signedOutDescription} locale={locale} />;
  }

  if (data.state === "error") {
    return <ErrorState active="approval" title={dictionary.approval.loadErrorTitle} message={data.message} locale={locale} />;
  }

  return <ApprovalView data={data} />;
}
