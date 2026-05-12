import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";
import { getApprovalTemplateAdminData } from "@/features/approval/approval-service";
import { ApprovalTemplateAdminView } from "@/features/approval/approval-template-admin-view";

export default async function AdminApprovalPage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  const gate = await getAdminGate("approval", "/admin/approval");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const [data, scope] = await Promise.all([getApprovalTemplateAdminData(), getAdminShellScope(params.scopeDepartmentId)]);
  if (data.state !== "ready") {
    const message = data.state === "signed_out" ? "请先登录后再进入审批配置。" : data.message;
    return (
      <AdminShell active="approval" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
        <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">暂时无法加载审批配置</h2>
          <p className="mt-2 text-sm leading-6 text-[#607089]">{message}</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="approval" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      <ApprovalTemplateAdminView data={data} />
    </AdminShell>
  );
}
