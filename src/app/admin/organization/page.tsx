import { AdminPlaceholderPage } from "@/features/admin/admin-placeholder-page";

export default function AdminOrganizationPage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  return (
    <AdminPlaceholderPage
      active="organization"
      redirectTo="/admin/organization"
      title="组织与权限"
      description="组织与权限模块暂未开放，后续将补充组织树、角色、权限和审批配置的统一管理能力。"
      searchParams={searchParams}
    />
  );
}
