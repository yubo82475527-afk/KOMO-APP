import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findProfileForUser } from "@/features/auth/profile-resolution";
import { normalizeDuplicateMode, validateRows, type ImportValidationError, type NormalizedScheduleRow } from "@/features/admin-schedule/import-parser";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "请先登录后再导入排班。" }, { status: 401 });
  }

  const profileResult = await findProfileForUser(adminClient, user.id, user.email ?? null);
  if (profileResult.state === "error") {
    return NextResponse.json({ error: profileResult.message }, { status: 403 });
  }

  const operatorProfile = profileResult.profile;
  const body = await request.json();
  const fileName = String(body.fileName ?? "schedule-import.csv");
  const duplicateMode = normalizeDuplicateMode(String(body.duplicateMode ?? "overwrite"));
  const rows = Array.isArray(body.rows) ? (body.rows as NormalizedScheduleRow[]) : [];
  const targetMonth = typeof body.targetMonth === "string" ? body.targetMonth : null;

  const isAllowed = await hasAnyRole(adminClient, operatorProfile.id, ["admin", "hr"]);
  if (!isAllowed) {
    return NextResponse.json({ error: "只有管理员或 HR 可以导入排班。" }, { status: 403 });
  }

  const validationErrors = validateRows(rows);

  const { data: importRecord, error: importError } = await adminClient
    .from("schedule_imports")
    .insert({
      uploaded_by: operatorProfile.id,
      file_name: fileName,
      target_month: targetMonth,
      duplicate_mode: duplicateMode,
      total_rows: rows.length,
      failed_rows: validationErrors.length,
      errors: validationErrors,
    })
    .select("id")
    .single();

  if (importError) {
    return NextResponse.json({ error: importError.message }, { status: 500 });
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { import_id: importRecord.id, success_rows: 0, failed_rows: validationErrors.length, errors: validationErrors },
      { status: 422 },
    );
  }

  const employeeNos = [...new Set(rows.map((row) => row.employee_no))];
  const shiftCodes = [...new Set(rows.filter((row) => row.shift_code !== "XIU" && row.shift_code !== "-").map((row) => row.shift_code))];

  const { data: profiles, error: profileError } = await adminClient.from("profiles").select("id, employee_no").in("employee_no", employeeNos);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: shifts, error: shiftError } = shiftCodes.length
    ? await adminClient.from("shift_templates").select("id, code").in("code", shiftCodes)
    : { data: [], error: null };

  if (shiftError) {
    return NextResponse.json({ error: shiftError.message }, { status: 500 });
  }

  const referenceErrors: ImportValidationError[] = [];
  const schedulePayload = rows.map((row, index) => {
    const profile = profiles?.find((item) => item.employee_no === row.employee_no);
    const shift = shifts?.find((item) => item.code === row.shift_code);

    if (!profile) referenceErrors.push({ row: index + 2, column: "employee_no", message: `工号 ${row.employee_no} 不存在。` });
    if (row.shift_code !== "XIU" && row.shift_code !== "-" && !shift) {
      referenceErrors.push({ row: index + 2, column: "shift_code", message: `班次 ${row.shift_code} 尚未配置。` });
    }

    return {
      profile_id: profile?.id,
      work_date: row.work_date,
      shift_template_id: shift?.id ?? null,
      schedule_type: row.shift_code === "XIU" ? "rest" : row.shift_code === "-" ? "holiday" : "work",
      import_id: importRecord.id,
    };
  });

  if (referenceErrors.length > 0) {
    await adminClient.from("schedule_imports").update({ failed_rows: referenceErrors.length, errors: referenceErrors }).eq("id", importRecord.id);
    return NextResponse.json(
      { import_id: importRecord.id, success_rows: 0, failed_rows: referenceErrors.length, errors: referenceErrors },
      { status: 422 },
    );
  }

  const commitPayload = duplicateMode === "skip" ? await removeExistingSchedules(adminClient, schedulePayload) : schedulePayload;

  const { error: writeError } =
    duplicateMode === "overwrite"
      ? await adminClient.from("schedules").upsert(commitPayload, { onConflict: "profile_id,work_date" })
      : await adminClient.from("schedules").insert(commitPayload);

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  await adminClient
    .from("schedule_imports")
    .update({
      success_rows: commitPayload.length,
      failed_rows: 0,
      errors: [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", importRecord.id);

  return NextResponse.json({
    import_id: importRecord.id,
    success_rows: commitPayload.length,
    skipped_rows: rows.length - commitPayload.length,
    failed_rows: 0,
    errors: [],
  });
}

async function hasAnyRole(adminClient: ReturnType<typeof createSupabaseAdminClient>, profileId: string, allowedRoles: string[]) {
  const { data, error } = await adminClient.from("user_roles").select("roles!inner(code)").eq("profile_id", profileId);
  if (error) throw error;

  return (
    data?.some((row) => {
      const role = (row as { roles?: { code?: string } | Array<{ code?: string }> }).roles;
      const codes = Array.isArray(role) ? role.map((item) => item.code) : [role?.code];
      return codes.some((code) => code && allowedRoles.includes(code));
    }) ?? false
  );
}

async function removeExistingSchedules(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  rows: Array<{ profile_id: string | undefined; work_date: string; shift_template_id: string | null; schedule_type: string; import_id: string }>,
) {
  if (rows.length === 0) return rows;

  const profileIds = [...new Set(rows.map((row) => row.profile_id).filter(Boolean))];
  const workDates = [...new Set(rows.map((row) => row.work_date))];
  const { data: existing, error } = await adminClient.from("schedules").select("profile_id, work_date").in("profile_id", profileIds).in("work_date", workDates);

  if (error) throw error;

  const existingKeys = new Set(existing?.map((row) => `${row.profile_id}:${row.work_date}`) ?? []);
  return rows.filter((row) => !existingKeys.has(`${row.profile_id}:${row.work_date}`));
}
