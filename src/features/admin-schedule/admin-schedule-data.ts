import { resolveAdminOrgScope } from "@/features/admin/admin-org-scope";
import { getAdminDataContext } from "@/features/admin-data/admin-data-service";

export type AdminScheduleListRow = {
  profileId: string;
  employeeNo: string | null;
  employeeName: string;
  departmentName: string;
  week: Array<{
    date: string;
    label: string;
    shift: string;
  }>;
};

export async function getAdminScheduleList(scopeDepartmentId?: string | null) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") return context;

  const scope = await resolveAdminOrgScope(context, scopeDepartmentId);
  if (scope.state !== "ready") return scope;

  const weekDates = getCurrentWeekDates();
  const { data: departments, error: departmentError } = await context.adminClient.from("departments").select("id, name");
  if (departmentError) return { state: "error" as const, message: departmentError.message };
  const departmentNameById = new Map((departments ?? []).map((department) => [department.id, department.name]));

  let profileQuery = context.adminClient.from("profiles").select("id, employee_no, full_name, department_id").eq("status", "active").order("employee_no", { ascending: true });
  if (!(scope.isHeadquarters && scope.currentDepartmentId === null)) {
    if (scope.visibleDepartmentIds.length === 0) {
      return { state: "success" as const, rows: [], weekDates, scope };
    }
    profileQuery = profileQuery.in("department_id", scope.visibleDepartmentIds);
  }

  const { data: profiles, error: profileError } = await profileQuery;
  if (profileError) return { state: "error" as const, message: profileError.message };

  const profileIds = (profiles ?? []).map((profile) => profile.id);
  const { data: schedules, error: scheduleError } = profileIds.length
    ? await context.adminClient
        .from("schedules")
        .select("profile_id, work_date, schedule_type, shift_templates(code, name)")
        .in("profile_id", profileIds)
        .in("work_date", weekDates)
    : { data: [], error: null };
  if (scheduleError) return { state: "error" as const, message: scheduleError.message };

  const scheduleByProfileDate = new Map(
    (schedules ?? []).map((schedule) => {
      const shift = readShift(schedule);
      return [`${schedule.profile_id}:${schedule.work_date}`, shift];
    }),
  );

  return {
    state: "success" as const,
    weekDates,
    scope,
    rows: (profiles ?? []).map((profile) => ({
      profileId: profile.id,
      employeeNo: profile.employee_no,
      employeeName: profile.full_name,
      departmentName: profile.department_id ? departmentNameById.get(profile.department_id) ?? "未归属部门" : "未归属部门",
      week: weekDates.map((date) => ({
        date,
        label: date.slice(5),
        shift: scheduleByProfileDate.get(`${profile.id}:${date}`) ?? "未排班",
      })),
    })),
  };
}

function readShift(schedule: { schedule_type: string; shift_templates?: { code?: string | null; name?: string | null } | Array<{ code?: string | null; name?: string | null }> | null }) {
  if (schedule.schedule_type === "rest") return "休";
  if (schedule.schedule_type === "holiday") return "-";
  const shift = Array.isArray(schedule.shift_templates) ? schedule.shift_templates[0] : schedule.shift_templates;
  return shift?.code ?? shift?.name ?? "班";
}

function getCurrentWeekDates() {
  const today = new Date();
  const day = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  });
}
