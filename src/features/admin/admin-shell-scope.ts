import { getAdminDataContext } from "@/features/admin-data/admin-data-service";
import { resolveAdminOrgScope, type AdminScopeOption } from "./admin-org-scope";

export type AdminShellScope = {
  isHeadquarters: boolean;
  currentDepartmentId: string | null;
  currentDepartmentName: string;
  scopeType: "company" | "department" | "store";
  switcherOptions: AdminScopeOption[];
};

export async function getAdminShellScope(scopeDepartmentId?: string | null): Promise<AdminShellScope | null> {
  const context = await getAdminDataContext();
  if (context.state !== "ready") return null;

  const scope = await resolveAdminOrgScope(context, scopeDepartmentId);
  if (scope.state !== "ready") return null;

  return {
    isHeadquarters: scope.isHeadquarters,
    currentDepartmentId: scope.currentDepartmentId,
    currentDepartmentName: scope.currentDepartmentName,
    scopeType: scope.scopeType,
    switcherOptions: scope.switcherOptions,
  };
}
