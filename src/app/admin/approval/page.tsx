import { getAdminGate } from "@/features/admin/admin-auth";
import { getApprovalTemplateAdminData } from "@/features/approval/approval-service";
import { ApprovalTemplateAdminView } from "@/features/approval/approval-template-admin-view";

export default async function AdminApprovalPage() {
  const gate = await getAdminGate("approval", "/admin/approval");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const data = await getApprovalTemplateAdminData();
  if (data.state !== "ready") {
    const message = data.state === "signed_out" ? "请先登录后再进入审批配置。" : data.message;
    return (
      <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">暂时无法加载审批配置</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">{message}</p>
      </div>
    );
  }

  return <ApprovalTemplateAdminView data={data} />;
}
