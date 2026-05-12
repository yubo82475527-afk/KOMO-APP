import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";
import { getAdminViewConfigs } from "@/features/admin-data/admin-data-service";
import { AdminDataUploadView } from "@/features/admin-data/data-upload-view";

export default async function AdminDataUploadPage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  const gate = await getAdminGate("upload", "/admin/data-upload");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const [configs, scope] = await Promise.all([getAdminViewConfigs(), getAdminShellScope(params.scopeDepartmentId)]);
  return (
    <AdminShell active="upload" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      <AdminDataUploadView configs={configs} />
    </AdminShell>
  );
}
