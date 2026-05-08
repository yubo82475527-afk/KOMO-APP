export type ApprovalRequestStatus = "draft" | "submitted" | "waiting" | "pending" | "approved" | "rejected" | "cancelled";
export type ApprovalStepStatus = "waiting" | "pending" | "approved" | "rejected";
export type ApproverType = "direct_manager" | "department_head" | "role" | "user";

export type LeavePayload = {
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  attachments: string[];
};

export type ApprovalTemplateStepForm = {
  id: string;
  stepOrder: number;
  name: string;
  approverType: ApproverType;
  roleCode: string | null;
  approverId: string | null;
};

export type ApprovalTemplateForm = {
  id: string | null;
  name: string;
  requestType: "leave";
  isActive: boolean;
  steps: ApprovalTemplateStepForm[];
};

export type ApprovalUserOption = {
  id: string;
  fullName: string;
  departmentName: string | null;
  employeeNo: string | null;
};

export type ApprovalListItem = {
  id: string;
  title: string;
  status: ApprovalRequestStatus;
  submittedAt: string | null;
  requesterName: string;
  requesterDepartment: string | null;
  currentStepName: string | null;
  currentApproverName: string | null;
  payload: LeavePayload;
};

export type ApprovalDetailStep = {
  id: string;
  stepOrder: number;
  name: string;
  approverName: string;
  approverType: ApproverType;
  status: ApprovalStepStatus;
  comment: string | null;
  actedAt: string | null;
};

export type ApprovalDetailRecord = {
  id: string;
  title: string;
  status: ApprovalRequestStatus;
  submittedAt: string | null;
  createdAt: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string | null;
  payload: LeavePayload;
  steps: ApprovalDetailStep[];
};

export type ApprovalPageReadyData = {
  state: "ready";
  viewer: {
    id: string;
    fullName: string;
    departmentName: string | null;
    roles: string[];
  };
  myRequests: ApprovalListItem[];
  pendingApprovals: ApprovalListItem[];
  activeTemplateName: string | null;
};

export type ApprovalPageData =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | ApprovalPageReadyData;

export type LeaveApplyPageData =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      viewer: {
        id: string;
        fullName: string;
        departmentName: string | null;
      };
      activeTemplateName: string | null;
    };

export type ApprovalDetailPageData =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | { state: "not_found" }
  | {
      state: "ready";
      viewer: {
        id: string;
        fullName: string;
        roles: string[];
      };
      detail: ApprovalDetailRecord;
      canAct: boolean;
    };

export type ApprovalTemplateAdminData =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | { state: "forbidden"; message: string }
  | {
      state: "ready";
      template: ApprovalTemplateForm;
      userOptions: ApprovalUserOption[];
    };
