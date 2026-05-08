import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getLeaveApplyPageData } from "./approval-service";
import { LeaveApplyView } from "./leave-apply-view";

export async function LeaveApplyPageView() {
  const data = await getLeaveApplyPageData();

  if (data.state === "signed_out") {
    return <SignedOutState active="approval" redirectTo="/leave/apply" title="登录后提交请假申请" description="请假申请会写入真实审批流，需要登录后再操作。" />;
  }

  if (data.state === "error") {
    return <ErrorState active="approval" title="暂时无法加载请假申请" message={data.message} />;
  }

  return <LeaveApplyView data={data} />;
}
