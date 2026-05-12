import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];

export type AdminOrgScopeContext = {
  adminClient: AdminClient;
  profileId: string;
  profileDepartmentId: string | null;
  roles: string[];
};

export type AdminScopeOption = {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  isCurrent: boolean;
};

export type AdminOrgScope =
  | {
      state: "ready";
      isHeadquarters: boolean;
      currentDepartmentId: string | null;
      currentDepartmentName: string;
      scopeType: "company" | "department" | "store";
      visibleDepartmentIds: string[];
      visibleOrgUnits: string[];
      switcherOptions: AdminScopeOption[];
      allOrgUnits: string[];
    }
  | {
      state: "error";
      message: string;
    };

export async function resolveAdminOrgScope(context: AdminOrgScopeContext, requestedDepartmentId?: string | null): Promise<AdminOrgScope> {
  const departments = await loadDepartments(context.adminClient);
  const isHeadquarters = context.roles.some((role) => role === "admin" || role === "hr");

  if (departments.length === 0) {
    return {
      state: "ready",
      isHeadquarters,
      currentDepartmentId: null,
      currentDepartmentName: "全公司",
      scopeType: "company",
      visibleDepartmentIds: [],
      visibleOrgUnits: [],
      switcherOptions: [],
      allOrgUnits: [],
    };
  }

  const departmentById = new Map(departments.map((department) => [department.id, department]));
  const allDepartmentIds = departments.map((department) => department.id);
  const allOrgUnits = departments.map((department) => department.name);

  if (isHeadquarters) {
    const currentDepartmentId = requestedDepartmentId && departmentById.has(requestedDepartmentId) ? requestedDepartmentId : null;
    const visibleDepartmentIds = currentDepartmentId ? collectDescendantIds(departments, currentDepartmentId) : allDepartmentIds;
    return {
      state: "ready",
      isHeadquarters,
      currentDepartmentId,
      currentDepartmentName: currentDepartmentId ? departmentById.get(currentDepartmentId)?.name ?? "经营范围" : "全公司",
      scopeType: getScopeType(departments, currentDepartmentId),
      visibleDepartmentIds,
      visibleOrgUnits: namesForIds(departments, visibleDepartmentIds),
      switcherOptions: flattenDepartmentOptions(departments, null, currentDepartmentId),
      allOrgUnits,
    };
  }

  if (!context.profileDepartmentId || !departmentById.has(context.profileDepartmentId)) {
    return { state: "error", message: "当前账号还没有配置管辖门店/部门，请先在员工档案里绑定 department_id。" };
  }

  const allowedDepartmentIds = collectDescendantIds(departments, context.profileDepartmentId);
  const allowedSet = new Set(allowedDepartmentIds);
  const currentDepartmentId = requestedDepartmentId && allowedSet.has(requestedDepartmentId) ? requestedDepartmentId : context.profileDepartmentId;
  if (requestedDepartmentId && !allowedSet.has(requestedDepartmentId)) {
    return { state: "error", message: "无权查看该经营范围。" };
  }

  const visibleDepartmentIds = collectDescendantIds(departments, currentDepartmentId);
  return {
    state: "ready",
    isHeadquarters,
    currentDepartmentId,
    currentDepartmentName: departmentById.get(currentDepartmentId)?.name ?? "经营范围",
    scopeType: getScopeType(departments, currentDepartmentId),
    visibleDepartmentIds,
    visibleOrgUnits: namesForIds(departments, visibleDepartmentIds),
    switcherOptions: flattenDepartmentOptions(departments, context.profileDepartmentId, currentDepartmentId),
    allOrgUnits,
  };
}

export function applyOrgUnitScope<Query>(query: Query, scope: AdminOrgScope, options?: { allowHeadquartersAll?: boolean }): Query {
  if (scope.state !== "ready") return query;
  if (options?.allowHeadquartersAll && scope.isHeadquarters && scope.currentDepartmentId === null) return query;
  if (scope.visibleOrgUnits.length === 0) {
    return (query as { eq: (column: string, value: string) => Query }).eq("org_unit", "__NO_VISIBLE_ORG_UNIT__");
  }
  return (query as { in: (column: string, values: string[]) => Query }).in("org_unit", scope.visibleOrgUnits);
}

export function isOrgUnitInScope(scope: AdminOrgScope, orgUnit: string | null | undefined) {
  if (scope.state !== "ready") return false;
  if (!orgUnit) return false;
  if (scope.isHeadquarters && scope.currentDepartmentId === null) return true;
  return scope.visibleOrgUnits.includes(orgUnit);
}

export function isDepartmentInScope(scope: AdminOrgScope, departmentId: string | null | undefined) {
  if (scope.state !== "ready") return false;
  if (!departmentId) return false;
  if (scope.isHeadquarters && scope.currentDepartmentId === null) return true;
  return scope.visibleDepartmentIds.includes(departmentId);
}

function namesForIds(departments: DepartmentRow[], ids: string[]) {
  const names = new Map(departments.map((department) => [department.id, department.name]));
  return ids.map((id) => names.get(id)).filter((name): name is string => Boolean(name));
}

async function loadDepartments(adminClient: AdminClient) {
  const { data, error } = await adminClient.from("departments").select("id, parent_id, head_id, name, sort_order, created_at").order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DepartmentRow[];
}

function collectDescendantIds(departments: DepartmentRow[], rootId: string) {
  const childrenByParent = groupByParent(departments);
  const result: string[] = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.shift();
    if (!id || result.includes(id)) continue;
    result.push(id);
    stack.push(...(childrenByParent.get(id) ?? []).map((department) => department.id));
  }
  return result;
}

function flattenDepartmentOptions(departments: DepartmentRow[], rootId: string | null, currentDepartmentId: string | null) {
  const childrenByParent = groupByParent(departments);
  const roots = rootId ? departments.filter((department) => department.id === rootId) : childrenByParent.get(null) ?? [];
  const result: AdminScopeOption[] = [];
  const visit = (department: DepartmentRow, depth: number) => {
    result.push({
      id: department.id,
      name: department.name,
      parentId: department.parent_id,
      depth,
      isCurrent: department.id === currentDepartmentId,
    });
    (childrenByParent.get(department.id) ?? []).forEach((child) => visit(child, depth + 1));
  };
  roots.forEach((department) => visit(department, 0));
  return result;
}

function groupByParent(departments: DepartmentRow[]) {
  const childrenByParent = new Map<string | null, DepartmentRow[]>();
  departments.forEach((department) => {
    const group = childrenByParent.get(department.parent_id) ?? [];
    group.push(department);
    childrenByParent.set(department.parent_id, group);
  });
  return childrenByParent;
}

function getScopeType(departments: DepartmentRow[], currentDepartmentId: string | null): "company" | "department" | "store" {
  if (!currentDepartmentId) return "company";
  return departments.some((department) => department.parent_id === currentDepartmentId) ? "department" : "store";
}
