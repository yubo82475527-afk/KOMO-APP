import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminViewConfigs } from "@/features/admin-data/admin-data-service";
import { AdminConfigsView } from "@/features/admin-data/configs-view";

export default async function AdminConfigsPage() {
  const gate = await getAdminGate("configs", "/admin/configs");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const configs = await getAdminViewConfigs();
  const canEdit = gate.viewer.roles.includes("admin") || gate.viewer.roles.includes("hr");

  return <AdminConfigsView configs={configs} canEdit={canEdit} />;
}
