import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminViewConfigs } from "@/features/admin-data/admin-data-service";
import { AdminDataUploadView } from "@/features/admin-data/data-upload-view";

export default async function AdminDataUploadPage() {
  const gate = await getAdminGate("upload", "/admin/data-upload");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const configs = await getAdminViewConfigs();
  return <AdminDataUploadView configs={configs} />;
}
