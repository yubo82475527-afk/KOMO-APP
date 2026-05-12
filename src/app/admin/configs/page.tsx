import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";
import { getAdminViewConfigs } from "@/features/admin-data/admin-data-service";
import { AdminConfigsView } from "@/features/admin-data/configs-view";

export default async function AdminConfigsPage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  const gate = await getAdminGate("configs", "/admin/configs");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const [configs, scope] = await Promise.all([getAdminViewConfigs(), getAdminShellScope(params.scopeDepartmentId)]);
  const canEdit = gate.viewer.roles.includes("admin") || gate.viewer.roles.includes("hr");

  return (
    <AdminShell active="configs" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      <AdminConfigsView configs={configs} canEdit={canEdit} />
    </AdminShell>
  );
}
