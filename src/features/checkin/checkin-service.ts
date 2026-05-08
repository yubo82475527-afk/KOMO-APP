import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedAppContext } from "@/features/auth/app-context";

type AttendanceRecordRow = Database["public"]["Tables"]["attendance_records"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type CheckinPageData =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      viewer: {
        id: string;
        fullName: string;
        departmentName: string | null;
        employeeNo: string | null;
      };
      today: {
        firstIn: AttendanceRecordRow | null;
        lastOut: AttendanceRecordRow | null;
        records: AttendanceRecordRow[];
      };
    };

export async function getCheckinPageData(): Promise<CheckinPageData> {
  const context = await getCheckinContext();
  if (context.state !== "ready") {
    return context;
  }

  const todayRecords = await getTodayAttendanceRecords(context.adminClient, context.profile.id);

  return {
    state: "ready",
    viewer: {
      id: context.profile.id,
      fullName: context.profile.full_name,
      departmentName: context.departmentName,
      employeeNo: context.profile.employee_no,
    },
    today: todayRecords,
  };
}

export async function punchAttendance(input: {
  punchType: "in" | "out";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address?: string | null;
  deviceInfo?: Record<string, unknown>;
}) {
  const context = await getCheckinContext();
  if (context.state !== "ready") {
    return context;
  }

  const today = await getTodayAttendanceRecords(context.adminClient, context.profile.id);

  if (input.punchType === "in" && today.firstIn) {
    return { state: "error" as const, message: "今天已经完成上班打卡，无需重复提交。" };
  }

  if (input.punchType === "out" && !today.firstIn) {
    return { state: "error" as const, message: "请先完成上班打卡，再进行下班打卡。" };
  }

  if (input.punchType === "out" && today.lastOut) {
    return { state: "error" as const, message: "今天已经完成下班打卡，无需重复提交。" };
  }

  const location =
    input.latitude !== null && input.longitude !== null
      ? {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          address: input.address ?? null,
        }
      : null;

  const { error } = await context.adminClient.from("attendance_records").insert({
    profile_id: context.profile.id,
    punch_time: new Date().toISOString(),
    punch_type: input.punchType,
    location,
    device_info: input.deviceInfo ?? null,
  });

  if (error) {
    return { state: "error" as const, message: error.message };
  }

  const updated = await getTodayAttendanceRecords(context.adminClient, context.profile.id);
  return { state: "success" as const, today: updated };
}

async function getCheckinContext(): Promise<
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      adminClient: ReturnType<typeof createSupabaseAdminClient>;
      profile: ProfileRow;
      departmentName: string | null;
    }
> {
  const context = await getAuthenticatedAppContext();
  if (context.state !== "ready") {
    return context;
  }

  return {
    state: "ready",
    adminClient: context.adminClient,
    profile: context.profile,
    departmentName: context.departmentName,
  };
}

async function getTodayAttendanceRecords(adminClient: ReturnType<typeof createSupabaseAdminClient>, profileId: string) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const { data } = await adminClient
    .from("attendance_records")
    .select("id, profile_id, punch_time, punch_type, location, device_info, created_at")
    .eq("profile_id", profileId)
    .gte("punch_time", start.toISOString())
    .lte("punch_time", end.toISOString())
    .order("punch_time", { ascending: true });

  const records = (data ?? []) as AttendanceRecordRow[];
  const firstIn = records.find((record) => record.punch_type === "in") ?? null;
  const lastOut = [...records].reverse().find((record) => record.punch_type === "out") ?? null;

  return {
    firstIn,
    lastOut,
    records,
  };
}
