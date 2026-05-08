import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getApprovalDetailPageData } from "./approval-service";
import { ApprovalDetailView } from "./approval-detail-view";

export async function ApprovalDetailPageView({ id }: { id: string }) {
  const data = await getApprovalDetailPageData(id);

  if (data.state === "signed_out") {
    return <SignedOutState active="approval" redirectTo={`/approval/${id}`} title="登录后查看审批详情" description="审批详情和处理动作都需要真实账号登录后使用。" />;
  }

  if (data.state === "not_found") {
    return <ErrorState active="approval" title="没有找到这条审批" message="请确认审批单链接是否正确，或返回审批列表重新进入。" />;
  }

  if (data.state === "error") {
    return <ErrorState active="approval" title="暂时无法加载审批详情" message={data.message} />;
  }

  return <ApprovalDetailView data={data} />;
}
