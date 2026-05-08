import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getApprovalPageData } from "./approval-service";
import { ApprovalView } from "./approval-view";

export async function ApprovalPageView() {
  const data = await getApprovalPageData();

  if (data.state === "signed_out") {
    return <SignedOutState active="approval" redirectTo="/approval" title="登录后查看审批" description="审批列表、待办和请假提交都需要真实账号登录后使用。" />;
  }

  if (data.state === "error") {
    return <ErrorState active="approval" title="暂时无法加载审批" message={data.message} />;
  }

  return <ApprovalView data={data} />;
}
