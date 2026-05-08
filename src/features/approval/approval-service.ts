import type { Database, Json } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedAppContext } from "@/features/auth/app-context";
import type {
  ApprovalDetailPageData,
  ApprovalDetailRecord,
  ApprovalListItem,
  ApprovalPageData,
  ApprovalTemplateAdminData,
  ApprovalTemplateForm,
  ApprovalUserOption,
  ApproverType,
  LeaveApplyPageData,
  LeavePayload,
} from "./approval-model";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ApprovalRequestRow = Database["public"]["Tables"]["approval_requests"]["Row"];
type ApprovalStepRow = Database["public"]["Tables"]["approval_steps"]["Row"];
type ApprovalTemplateRow = Database["public"]["Tables"]["approval_templates"]["Row"];
type ApprovalTemplateStepRow = Database["public"]["Tables"]["approval_template_steps"]["Row"];

type AuthContext =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      adminClient: AdminClient;
      userId: string;
      profile: ProfileRow;
      roles: string[];
      departmentName: string | null;
    };

export async function getApprovalPageData(): Promise<ApprovalPageData> {
  const context = await getAuthContext();
  if (context.state !== "ready") {
    return context;
  }

  const [template, myRequests, pendingApprovals] = await Promise.all([
    getActiveLeaveTemplate(context.adminClient),
    listApprovalRequestsByRequester(context.adminClient, context.profile.id),
    listPendingApprovalsForUser(context.adminClient, context.profile.id),
  ]);

  return {
    state: "ready",
    viewer: {
      id: context.profile.id,
      fullName: context.profile.full_name,
      departmentName: context.departmentName,
      roles: context.roles,
    },
    myRequests,
    pendingApprovals,
    activeTemplateName: template?.name ?? null,
  };
}

export async function getLeaveApplyPageData(): Promise<LeaveApplyPageData> {
  const context = await getAuthContext();
  if (context.state !== "ready") {
    return context;
  }

  const template = await getActiveLeaveTemplate(context.adminClient);
  return {
    state: "ready",
    viewer: {
      id: context.profile.id,
      fullName: context.profile.full_name,
      departmentName: context.departmentName,
    },
    activeTemplateName: template?.name ?? null,
  };
}

export async function getApprovalDetailPageData(id: string): Promise<ApprovalDetailPageData> {
  const context = await getAuthContext();
  if (context.state !== "ready") {
    return context;
  }

  const detail = await getApprovalDetail(context.adminClient, id);
  if (!detail) {
    return { state: "not_found" };
  }

  const [canAct, isAssignedApprover] = await Promise.all([
    hasPendingStep(context.adminClient, id, context.profile.id),
    isApproverForRequest(context.adminClient, id, context.profile.id),
  ]);

  const isRequester = detail.requesterId === context.profile.id;
  const isAdminLike = context.roles.includes("admin") || context.roles.includes("hr");

  if (!isRequester && !isAssignedApprover && !isAdminLike) {
    return { state: "error", message: "你没有查看这条审批的权限。" };
  }

  return {
    state: "ready",
    viewer: {
      id: context.profile.id,
      fullName: context.profile.full_name,
      roles: context.roles,
    },
    detail,
    canAct,
  };
}

export async function getApprovalTemplateAdminData(): Promise<ApprovalTemplateAdminData> {
  const context = await getAuthContext();
  if (context.state !== "ready") {
    return context;
  }

  if (!context.roles.includes("admin") && !context.roles.includes("hr")) {
    return { state: "forbidden", message: "当前账号没有审批模板管理权限。" };
  }

  const [template, userOptions] = await Promise.all([getActiveLeaveTemplate(context.adminClient), listApprovalUserOptions(context.adminClient)]);

  return {
    state: "ready",
    template: {
      id: template?.id ?? null,
      name: template?.name ?? "请假审批默认流程",
      requestType: "leave",
      isActive: template?.is_active ?? true,
      steps: (template?.steps ?? []).map((step) => ({
        id: step.id,
        stepOrder: step.step_order,
        name: step.name,
        approverType: step.approver_type,
        roleCode: step.role_code ?? null,
        approverId: step.approver_id ?? null,
      })),
    },
    userOptions,
  };
}

export async function submitLeaveApproval(input: { leaveType: string; startDate: string; endDate: string; days: number; reason: string }) {
  const context = await getAuthContext();
  if (context.state !== "ready") {
    return context;
  }

  const validationError = validateLeavePayload(input);
  if (validationError) {
    return { state: "error" as const, message: validationError };
  }

  const template = await getActiveLeaveTemplate(context.adminClient);
  if (!template || template.steps.length === 0) {
    return { state: "error" as const, message: "当前没有可用的请假审批模板，请先在管理端配置。" };
  }

  const payload: LeavePayload = {
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate: input.endDate,
    days: input.days,
    reason: input.reason.trim(),
    attachments: [],
  };

  const approverSteps = await buildApprovalSteps(context.adminClient, context.profile, template.steps);
  if ("message" in approverSteps) {
    return { state: "error" as const, message: approverSteps.message };
  }

  const now = new Date().toISOString();
  const title = `${payload.leaveType} ${payload.startDate} 至 ${payload.endDate}`;

  const { data: requestRow, error: requestError } = await context.adminClient
    .from("approval_requests")
    .insert({
      requester_id: context.profile.id,
      type: "leave",
      title,
      payload: payload as unknown as Json,
      status: "submitted",
      submitted_at: now,
    })
    .select("id, requester_id, type, title, payload, status, submitted_at, created_at")
    .single<ApprovalRequestRow>();

  if (requestError || !requestRow) {
    return { state: "error" as const, message: requestError?.message ?? "请假申请提交失败。" };
  }

  const { error: stepsError } = await context.adminClient.from("approval_steps").insert(
    approverSteps.map((step, index) => ({
      request_id: requestRow.id,
      template_step_id: step.templateStepId,
      approver_id: step.approverId,
      approver_type: step.approverType,
      role_code: step.roleCode,
      step_order: step.stepOrder,
      status: index === 0 ? "pending" : "waiting",
      comment: null,
      acted_at: null,
    })),
  );

  if (stepsError) {
    await context.adminClient.from("approval_requests").delete().eq("id", requestRow.id);
    return { state: "error" as const, message: stepsError.message };
  }

  const firstApprover = approverSteps[0];
  if (firstApprover) {
    await context.adminClient.from("notifications").insert({
      recipient_id: firstApprover.approverId,
      title: "新的请假审批待处理",
      body: `${context.profile.full_name} 提交了请假申请：${title}`,
    });
  }

  return { state: "success" as const, requestId: requestRow.id };
}

export async function actOnApprovalRequest(id: string, action: "approved" | "rejected", comment: string) {
  const context = await getAuthContext();
  if (context.state !== "ready") {
    return context;
  }

  const { data: currentStep, error: currentStepError } = await context.adminClient
    .from("approval_steps")
    .select("id, request_id, template_step_id, approver_id, approver_type, role_code, step_order, status, comment, acted_at, created_at")
    .eq("request_id", id)
    .eq("approver_id", context.profile.id)
    .eq("status", "pending")
    .maybeSingle<ApprovalStepRow>();

  if (currentStepError) {
    return { state: "error" as const, message: currentStepError.message };
  }

  if (!currentStep) {
    return { state: "error" as const, message: "当前账号没有这条审批的待办处理权限。" };
  }

  const actedAt = new Date().toISOString();
  const { error: updateCurrentError } = await context.adminClient
    .from("approval_steps")
    .update({
      status: action,
      comment: comment.trim() || null,
      acted_at: actedAt,
    })
    .eq("id", currentStep.id);

  if (updateCurrentError) {
    return { state: "error" as const, message: updateCurrentError.message };
  }

  const { data: request, error: requestError } = await context.adminClient
    .from("approval_requests")
    .select("id, requester_id, type, title, payload, status, submitted_at, created_at")
    .eq("id", id)
    .single<ApprovalRequestRow>();

  if (requestError || !request) {
    return { state: "error" as const, message: requestError?.message ?? "审批单不存在。" };
  }

  if (action === "rejected") {
    await context.adminClient.from("approval_requests").update({ status: "rejected" }).eq("id", id);
    await context.adminClient.from("notifications").insert({
      recipient_id: request.requester_id,
      title: "请假审批被拒绝",
      body: `${request.title} 已被拒绝${comment.trim() ? `，意见：${comment.trim()}` : ""}`,
    });
    return { state: "success" as const };
  }

  const { data: waitingStep, error: waitingStepError } = await context.adminClient
    .from("approval_steps")
    .select("id, request_id, template_step_id, approver_id, approver_type, role_code, step_order, status, comment, acted_at, created_at")
    .eq("request_id", id)
    .eq("status", "waiting")
    .order("step_order", { ascending: true })
    .limit(1)
    .maybeSingle<ApprovalStepRow>();

  if (waitingStepError) {
    return { state: "error" as const, message: waitingStepError.message };
  }

  if (waitingStep) {
    await context.adminClient.from("approval_steps").update({ status: "pending" }).eq("id", waitingStep.id);
    await context.adminClient.from("approval_requests").update({ status: "pending" }).eq("id", id);
    if (waitingStep.approver_id) {
      await context.adminClient.from("notifications").insert({
        recipient_id: waitingStep.approver_id,
        title: "新的请假审批待处理",
        body: `${request.title} 轮到你审批了。`,
      });
    }
  } else {
    await context.adminClient.from("approval_requests").update({ status: "approved" }).eq("id", id);
    await context.adminClient.from("notifications").insert({
      recipient_id: request.requester_id,
      title: "请假审批已通过",
      body: `${request.title} 已全部审批通过。`,
    });
  }

  return { state: "success" as const };
}

export async function saveApprovalTemplate(input: ApprovalTemplateForm) {
  const context = await getAuthContext();
  if (context.state !== "ready") {
    return context;
  }

  if (!context.roles.includes("admin") && !context.roles.includes("hr")) {
    return { state: "error" as const, message: "当前账号没有审批模板管理权限。" };
  }

  const name = input.name.trim();
  if (!name) {
    return { state: "error" as const, message: "模板名称不能为空。" };
  }

  if (input.steps.length === 0) {
    return { state: "error" as const, message: "至少需要一个审批节点。" };
  }

  const normalizedSteps = input.steps
    .slice()
    .sort((left, right) => left.stepOrder - right.stepOrder)
    .map((step, index) => ({
      ...step,
      stepOrder: index + 1,
      name: step.name.trim() || `第 ${index + 1} 级审批`,
      roleCode: step.approverType === "role" ? step.roleCode ?? "hr" : null,
      approverId: step.approverType === "user" ? step.approverId : null,
    }));

  const invalidStep = normalizedSteps.find((step) => (step.approverType === "role" && !step.roleCode) || (step.approverType === "user" && !step.approverId));
  if (invalidStep) {
    return { state: "error" as const, message: `第 ${invalidStep.stepOrder} 级审批配置不完整。` };
  }

  let templateId = input.id;
  await context.adminClient.from("approval_templates").update({ is_active: false }).eq("request_type", "leave");

  if (templateId) {
    const { error: updateTemplateError } = await context.adminClient
      .from("approval_templates")
      .update({
        name,
        request_type: "leave",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId);

    if (updateTemplateError) {
      return { state: "error" as const, message: updateTemplateError.message };
    }

    await context.adminClient.from("approval_template_steps").delete().eq("template_id", templateId);
  } else {
    const { data: templateRow, error: insertTemplateError } = await context.adminClient
      .from("approval_templates")
      .insert({
        name,
        request_type: "leave",
        is_active: true,
        created_by: context.profile.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertTemplateError || !templateRow) {
      return { state: "error" as const, message: insertTemplateError?.message ?? "创建审批模板失败。" };
    }

    templateId = templateRow.id;
  }

  const { error: stepsError } = await context.adminClient.from("approval_template_steps").insert(
    normalizedSteps.map((step) => ({
      template_id: templateId!,
      step_order: step.stepOrder,
      name: step.name,
      approver_type: step.approverType,
      role_code: step.roleCode,
      approver_id: step.approverId,
    })),
  );

  if (stepsError) {
    return { state: "error" as const, message: stepsError.message };
  }

  return { state: "success" as const, templateId: templateId! };
}

async function getAuthContext(): Promise<AuthContext> {
  const context = await getAuthenticatedAppContext();
  if (context.state !== "ready") {
    return context;
  }

  return {
    state: "ready",
    adminClient: context.adminClient,
    userId: context.user.id,
    profile: context.profile,
    roles: context.roles,
    departmentName: context.departmentName,
  };
}

async function listApprovalRequestsByRequester(adminClient: AdminClient, requesterId: string) {
  const { data: requests, error } = await adminClient
    .from("approval_requests")
    .select("id, requester_id, type, title, payload, status, submitted_at, created_at")
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: false });

  if (error || !requests) {
    return [];
  }

  return buildApprovalListItems(adminClient, requests as ApprovalRequestRow[]);
}

async function listPendingApprovalsForUser(adminClient: AdminClient, approverId: string) {
  const { data: pendingSteps, error: stepError } = await adminClient
    .from("approval_steps")
    .select("request_id")
    .eq("approver_id", approverId)
    .eq("status", "pending");

  if (stepError || !pendingSteps || pendingSteps.length === 0) {
    return [];
  }

  const requestIds = [...new Set(pendingSteps.map((item) => item.request_id).filter(Boolean))];
  if (requestIds.length === 0) {
    return [];
  }

  const { data: requests, error: requestError } = await adminClient
    .from("approval_requests")
    .select("id, requester_id, type, title, payload, status, submitted_at, created_at")
    .in("id", requestIds)
    .order("created_at", { ascending: false });

  if (requestError || !requests) {
    return [];
  }

  return buildApprovalListItems(adminClient, requests as ApprovalRequestRow[]);
}

async function buildApprovalListItems(adminClient: AdminClient, requests: ApprovalRequestRow[]): Promise<ApprovalListItem[]> {
  if (requests.length === 0) {
    return [];
  }

  const requestIds = requests.map((request) => request.id);
  const requesterIds = [...new Set(requests.map((request) => request.requester_id))];
  const { steps, templateStepNameMap, profileNameMap } = await loadStepContext(adminClient, requestIds);
  const requesterMap = await loadRequesterContext(adminClient, requesterIds);

  return requests.map((request) => {
    const requestSteps = steps.filter((step) => step.request_id === request.id).sort((left, right) => left.step_order - right.step_order);
    const activeStep = requestSteps.find((step) => step.status === "pending") ?? requestSteps.find((step) => step.status === "waiting") ?? null;
    const requester = requesterMap.get(request.requester_id);

    return {
      id: request.id,
      title: request.title,
      status: request.status,
      submittedAt: request.submitted_at,
      requesterName: requester?.fullName ?? "未知员工",
      requesterDepartment: requester?.departmentName ?? null,
      currentStepName: activeStep ? templateStepNameMap.get(activeStep.template_step_id ?? "") ?? `第 ${activeStep.step_order} 级审批` : null,
      currentApproverName: activeStep?.approver_id ? profileNameMap.get(activeStep.approver_id) ?? null : null,
      payload: parseLeavePayload(request.payload),
    };
  });
}

async function getApprovalDetail(adminClient: AdminClient, id: string): Promise<ApprovalDetailRecord | null> {
  const { data: request, error: requestError } = await adminClient
    .from("approval_requests")
    .select("id, requester_id, type, title, payload, status, submitted_at, created_at")
    .eq("id", id)
    .maybeSingle<ApprovalRequestRow>();

  if (requestError || !request) {
    return null;
  }

  const { steps, templateStepNameMap, profileNameMap } = await loadStepContext(adminClient, [id]);
  const requesterMap = await loadRequesterContext(adminClient, [request.requester_id]);
  const requester = requesterMap.get(request.requester_id);

  return {
    id: request.id,
    title: request.title,
    status: request.status,
    submittedAt: request.submitted_at,
    createdAt: request.created_at,
    requesterId: request.requester_id,
    requesterName: requester?.fullName ?? "未知员工",
    requesterDepartment: requester?.departmentName ?? null,
    payload: parseLeavePayload(request.payload),
    steps: steps
      .filter((step) => step.request_id === request.id)
      .sort((left, right) => left.step_order - right.step_order)
      .map((step) => ({
        id: step.id,
        stepOrder: step.step_order,
        name: templateStepNameMap.get(step.template_step_id ?? "") ?? `第 ${step.step_order} 级审批`,
        approverName: step.approver_id ? profileNameMap.get(step.approver_id) ?? "未配置审批人" : step.role_code ? `角色：${step.role_code}` : "未配置审批人",
        approverType: step.approver_type,
        status: step.status as "waiting" | "pending" | "approved" | "rejected",
        comment: step.comment,
        actedAt: step.acted_at,
      })),
  };
}

async function loadStepContext(adminClient: AdminClient, requestIds: string[]) {
  const { data: steps } = await adminClient
    .from("approval_steps")
    .select("id, request_id, template_step_id, approver_id, approver_type, role_code, step_order, status, comment, acted_at, created_at")
    .in("request_id", requestIds)
    .order("step_order", { ascending: true });

  const typedSteps = (steps ?? []) as ApprovalStepRow[];
  const templateStepIds = [...new Set(typedSteps.map((step) => step.template_step_id).filter(Boolean))];
  const approverIds = [...new Set(typedSteps.map((step) => step.approver_id).filter(Boolean))];

  const templateStepNameMap = new Map<string, string>();
  if (templateStepIds.length > 0) {
    const { data: templateSteps } = await adminClient.from("approval_template_steps").select("id, name").in("id", templateStepIds);
    (templateSteps ?? []).forEach((step) => {
      templateStepNameMap.set(step.id, step.name);
    });
  }

  const profileNameMap = new Map<string, string>();
  if (approverIds.length > 0) {
    const { data: profiles } = await adminClient.from("profiles").select("id, full_name").in("id", approverIds);
    (profiles ?? []).forEach((profile) => {
      profileNameMap.set(profile.id, profile.full_name);
    });
  }

  return { steps: typedSteps, templateStepNameMap, profileNameMap };
}

async function loadRequesterContext(adminClient: AdminClient, requesterIds: string[]) {
  const result = new Map<string, { fullName: string; departmentName: string | null }>();
  if (requesterIds.length === 0) {
    return result;
  }

  const { data: profiles } = await adminClient.from("profiles").select("id, full_name, department_id").in("id", requesterIds);

  const departmentIds = [...new Set((profiles ?? []).map((profile) => profile.department_id).filter(Boolean))];
  const departmentMap = new Map<string, string>();
  if (departmentIds.length > 0) {
    const { data: departments } = await adminClient.from("departments").select("id, name").in("id", departmentIds);
    (departments ?? []).forEach((department) => {
      departmentMap.set(department.id, department.name);
    });
  }

  (profiles ?? []).forEach((profile) => {
    result.set(profile.id, {
      fullName: profile.full_name,
      departmentName: profile.department_id ? departmentMap.get(profile.department_id) ?? null : null,
    });
  });

  return result;
}

async function listApprovalUserOptions(adminClient: AdminClient): Promise<ApprovalUserOption[]> {
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, employee_no, full_name, department_id, status")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const departmentIds = [...new Set((profiles ?? []).map((profile) => profile.department_id).filter(Boolean))];
  const departmentMap = new Map<string, string>();
  if (departmentIds.length > 0) {
    const { data: departments } = await adminClient.from("departments").select("id, name").in("id", departmentIds);
    (departments ?? []).forEach((department) => {
      departmentMap.set(department.id, department.name);
    });
  }

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    departmentName: profile.department_id ? departmentMap.get(profile.department_id) ?? null : null,
    employeeNo: profile.employee_no,
  }));
}

async function getActiveLeaveTemplate(adminClient: AdminClient) {
  const { data: template } = await adminClient
    .from("approval_templates")
    .select("id, name, request_type, is_active, created_by, created_at, updated_at")
    .eq("request_type", "leave")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<ApprovalTemplateRow>();

  if (!template) {
    return null;
  }

  const { data: steps } = await adminClient
    .from("approval_template_steps")
    .select("id, template_id, step_order, name, approver_type, role_code, approver_id, created_at")
    .eq("template_id", template.id)
    .order("step_order", { ascending: true });

  return {
    ...template,
    steps: (steps ?? []) as ApprovalTemplateStepRow[],
  };
}

async function buildApprovalSteps(adminClient: AdminClient, requester: ProfileRow, templateSteps: ApprovalTemplateStepRow[]) {
  const departmentHeadId = requester.department_id ? await getDepartmentHeadId(adminClient, requester.department_id) : null;

  const rows = [];
  for (const templateStep of templateSteps.slice().sort((left, right) => left.step_order - right.step_order)) {
    const approver = await resolveApprover(adminClient, requester, departmentHeadId, templateStep);
    if (!approver) {
      return { message: `审批模板中的“${templateStep.name}”没有找到有效审批人，请先在管理端修正。` };
    }

    rows.push({
      templateStepId: templateStep.id,
      stepOrder: templateStep.step_order,
      approverId: approver.id,
      approverType: templateStep.approver_type as ApproverType,
      roleCode: templateStep.role_code,
    });
  }

  return rows;
}

async function resolveApprover(adminClient: AdminClient, requester: ProfileRow, departmentHeadId: string | null, templateStep: ApprovalTemplateStepRow) {
  if (templateStep.approver_type === "direct_manager") {
    if (!requester.manager_id) return null;
    return getActiveProfileById(adminClient, requester.manager_id);
  }

  if (templateStep.approver_type === "department_head") {
    if (!departmentHeadId) return null;
    return getActiveProfileById(adminClient, departmentHeadId);
  }

  if (templateStep.approver_type === "role") {
    if (!templateStep.role_code) return null;
    return getFirstActiveProfileByRole(adminClient, templateStep.role_code, requester.id);
  }

  if (!templateStep.approver_id) return null;
  return getActiveProfileById(adminClient, templateStep.approver_id);
}

async function getFirstActiveProfileByRole(adminClient: AdminClient, roleCode: string, excludeUserId?: string) {
  const { data: role } = await adminClient.from("roles").select("id").eq("code", roleCode).maybeSingle<{ id: string }>();
  if (!role) return null;

  const { data: roleRows } = await adminClient.from("user_roles").select("profile_id").eq("role_id", role.id);
  const profileIds = [...new Set((roleRows ?? []).map((row) => row.profile_id).filter((id) => id && id !== excludeUserId))];
  if (profileIds.length === 0) return null;

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, employee_no, full_name, email, department_id, manager_id, status, created_at")
    .in("id", profileIds)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  return ((profiles ?? [])[0] as ProfileRow | undefined) ?? null;
}

async function getActiveProfileById(adminClient: AdminClient, id: string) {
  const { data } = await adminClient
    .from("profiles")
    .select("id, employee_no, full_name, email, department_id, manager_id, status, created_at")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle<ProfileRow>();
  return data ?? null;
}

async function getDepartmentHeadId(adminClient: AdminClient, departmentId: string) {
  const { data } = await adminClient.from("departments").select("head_id").eq("id", departmentId).maybeSingle();
  return data?.head_id ?? null;
}

async function hasPendingStep(adminClient: AdminClient, requestId: string, approverId: string) {
  const { count } = await adminClient
    .from("approval_steps")
    .select("*", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("approver_id", approverId)
    .eq("status", "pending");
  return (count ?? 0) > 0;
}

async function isApproverForRequest(adminClient: AdminClient, requestId: string, approverId: string) {
  const { count } = await adminClient
    .from("approval_steps")
    .select("*", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("approver_id", approverId);
  return (count ?? 0) > 0;
}

function parseLeavePayload(value: Json): LeavePayload {
  const payload = (value ?? {}) as Record<string, unknown>;
  return {
    leaveType: typeof payload.leaveType === "string" ? payload.leaveType : "请假",
    startDate: typeof payload.startDate === "string" ? payload.startDate : "",
    endDate: typeof payload.endDate === "string" ? payload.endDate : "",
    days: typeof payload.days === "number" ? payload.days : Number(payload.days ?? 0),
    reason: typeof payload.reason === "string" ? payload.reason : "",
    attachments: Array.isArray(payload.attachments) ? payload.attachments.filter((item): item is string => typeof item === "string") : [],
  };
}

function validateLeavePayload(input: { leaveType: string; startDate: string; endDate: string; days: number; reason: string }) {
  if (!input.leaveType.trim()) return "请假类型不能为空。";
  if (!input.startDate || !input.endDate) return "请填写完整的请假日期。";
  if (input.endDate < input.startDate) return "结束日期不能早于开始日期。";
  if (!Number.isFinite(input.days) || input.days <= 0) return "请假天数必须大于 0。";
  if (!input.reason.trim()) return "请假原因不能为空。";
  return null;
}
