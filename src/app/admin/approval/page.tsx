import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getApprovalTemplateAdminData } from "@/features/approval/approval-service";
import { ApprovalTemplateAdminView } from "@/features/approval/approval-template-admin-view";

export default async function AdminApprovalPage() {
  const data = await getApprovalTemplateAdminData();

  if (data.state === "signed_out") {
    return <SignedOutState active="adminApproval" redirectTo="/admin/approval" title="登录后进入审批配置" description="审批模板管理需要真实账号登录，并且具备 admin 或 hr 权限。" />;
  }

  if (data.state === "forbidden") {
    return <ErrorState active="adminApproval" title="当前账号没有审批配置权限" message={data.message} />;
  }

  if (data.state === "error") {
    return <ErrorState active="adminApproval" title="暂时无法加载审批配置" message={data.message} />;
  }

  return <ApprovalTemplateAdminView data={data} />;
}
