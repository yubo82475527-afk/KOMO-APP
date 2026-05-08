import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedAppContext } from "@/features/auth/app-context";

type ShiftTemplateRow = Database["public"]["Tables"]["shift_templates"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type SchedulePageData =
  | {
      state: "signed_out";
    }
  | {
      state: "error";
      message: string;
    }
  | {
      state: "ready";
      profile: ProfileRow;
      items: Array<{
        id: string;
        workDate: string;
        scheduleType: Database["public"]["Tables"]["schedules"]["Row"]["schedule_type"];
        shiftName: string;
        shiftCode: string;
        startTime: string | null;
        endTime: string | null;
      }>;
    };

export async function getSchedulePageData(): Promise<SchedulePageData> {
  const supabase = await createSupabaseServerClient();
  const context = await getAuthenticatedAppContext();
  if (context.state !== "ready") {
    return context;
  }

  const profile = context.profile as ProfileRow;

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  const { data: schedules, error: scheduleError } = await supabase
    .from("schedules")
    .select("id, work_date, schedule_type, shift_template_id")
    .eq("profile_id", profile.id)
    .gte("work_date", start.toISOString().slice(0, 10))
    .lte("work_date", end.toISOString().slice(0, 10))
    .order("work_date", { ascending: true });

  if (scheduleError) {
    return { state: "error", message: scheduleError.message };
  }

  const shiftIds = [...new Set((schedules ?? []).map((item) => item.shift_template_id).filter(Boolean))];
  const shiftMap = new Map<string, ShiftTemplateRow>();

  if (shiftIds.length > 0) {
    const { data: shifts, error: shiftError } = await supabase
      .from("shift_templates")
      .select("id, code, name, start_time, end_time, grace_minutes, crosses_day, is_active, created_at")
      .in("id", shiftIds);

    if (shiftError) {
      return { state: "error", message: shiftError.message };
    }

    (shifts ?? []).forEach((shift) => {
      shiftMap.set(shift.id, shift);
    });
  }

  return {
    state: "ready",
    profile,
    items: (schedules ?? []).map((item) => {
      const shift = item.shift_template_id ? shiftMap.get(item.shift_template_id) : undefined;
      return {
        id: item.id,
        workDate: item.work_date,
        scheduleType: item.schedule_type,
        shiftName: shift?.name ?? (item.schedule_type === "rest" ? "休息" : item.schedule_type === "holiday" ? "未排班" : "未配置班次"),
        shiftCode: shift?.code ?? (item.schedule_type === "rest" ? "XIU" : "-"),
        startTime: shift?.start_time ?? null,
        endTime: shift?.end_time ?? null,
      };
    }),
  };
}
