import { createClient } from "jsr:@supabase/supabase-js@2";

type DuplicateMode = "overwrite" | "skip";
type ShiftCode = "ZC" | "ZB" | "WC" | "XIU" | "-";

type NormalizedScheduleRow = {
  employee_no: string;
  employee_name?: string;
  department?: string;
  work_date: string;
  shift_code: ShiftCode;
};

type ImportError = {
  row: number;
  column?: string;
  message: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const shiftCodes = new Set<ShiftCode>(["ZC", "ZB", "WC", "XIU", "-"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Invalid session" }, 401);
  }

  const isAllowed = await hasAnyRole(adminClient, userData.user.id, ["admin", "hr"]);
  if (!isAllowed) {
    return json({ error: "Only admin or HR can import schedules" }, 403);
  }

  const requestPayload = await readImportRequest(req);
  if ("error" in requestPayload) {
    return json({ error: requestPayload.error }, 400);
  }

  const { fileName, targetMonth, duplicateMode, rows } = requestPayload;
  const validationErrors = validateRows(rows);

  const { data: importRecord, error: importError } = await adminClient
    .from("schedule_imports")
    .insert({
      uploaded_by: userData.user.id,
      file_name: fileName,
      target_month: targetMonth,
      duplicate_mode: duplicateMode,
      total_rows: rows.length,
      failed_rows: validationErrors.length,
      errors: validationErrors,
    })
    .select("id")
    .single();

  if (importError) return json({ error: importError.message }, 500);
  if (validationErrors.length > 0) {
    return json({ import_id: importRecord.id, success_rows: 0, failed_rows: validationErrors.length, errors: validationErrors }, 422);
  }

  const employeeNos = [...new Set(rows.map((row) => row.employee_no))];
  const workShiftCodes = [...new Set(rows.filter((row) => row.shift_code !== "XIU" && row.shift_code !== "-").map((row) => row.shift_code))];

  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select("id, employee_no")
    .in("employee_no", employeeNos);

  if (profileError) return json({ error: profileError.message }, 500);

  const { data: shifts, error: shiftError } = workShiftCodes.length
    ? await adminClient.from("shift_templates").select("id, code").in("code", workShiftCodes)
    : { data: [], error: null };

  if (shiftError) return json({ error: shiftError.message }, 500);

  const referenceErrors: ImportError[] = [];
  const schedulePayload = rows.map((row, index) => {
    const profile = profiles?.find((item) => item.employee_no === row.employee_no);
    const shift = shifts?.find((item) => item.code === row.shift_code);

    if (!profile) referenceErrors.push({ row: index + 2, message: "employee_no not found" });
    if (row.shift_code !== "XIU" && row.shift_code !== "-" && !shift) {
      referenceErrors.push({ row: index + 2, message: "shift code not found" });
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
    return json({ import_id: importRecord.id, success_rows: 0, failed_rows: referenceErrors.length, errors: referenceErrors }, 422);
  }

  const commitPayload = duplicateMode === "skip"
    ? await removeExistingSchedules(adminClient, schedulePayload)
    : schedulePayload;

  const { error: writeError } = duplicateMode === "overwrite"
    ? await adminClient.from("schedules").upsert(commitPayload, { onConflict: "profile_id,work_date" })
    : await adminClient.from("schedules").insert(commitPayload);

  if (writeError) return json({ error: writeError.message }, 500);

  await adminClient
    .from("schedule_imports")
    .update({ success_rows: commitPayload.length, failed_rows: 0, errors: [] })
    .eq("id", importRecord.id);

  return json({ import_id: importRecord.id, success_rows: commitPayload.length, skipped_rows: rows.length - commitPayload.length, failed_rows: 0, errors: [] });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function hasAnyRole(adminClient: ReturnType<typeof createClient>, userId: string, allowedRoles: string[]) {
  const { data, error } = await adminClient
    .from("user_roles")
    .select("roles!inner(code)")
    .eq("profile_id", userId);

  if (error) throw error;

  return data?.some((row) => {
    const role = (row as { roles?: { code?: string } | Array<{ code?: string }> }).roles;
    const codes = Array.isArray(role) ? role.map((item) => item.code) : [role?.code];
    return codes.some((code) => code && allowedRoles.includes(code));
  }) ?? false;
}

async function readImportRequest(req: Request): Promise<
  | { fileName: string; targetMonth: string | null; duplicateMode: DuplicateMode; rows: NormalizedScheduleRow[] }
  | { error: string }
> {
  const contentType = req.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    return {
      fileName: String(body.fileName ?? "schedule-import.json"),
      targetMonth: normalizeMonth(body.targetMonth),
      duplicateMode: normalizeDuplicateMode(body.duplicateMode),
      rows: Array.isArray(body.rows) ? body.rows.map(normalizeRow) : [],
    };
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Missing schedule file" };
  }

  const csv = await file.text();
  return {
    fileName: file.name,
    targetMonth: normalizeMonth(String(formData.get("target_month") ?? "")),
    duplicateMode: normalizeDuplicateMode(String(formData.get("duplicate_mode") ?? "")),
    rows: parseWideCsv(csv),
  };
}

function normalizeDuplicateMode(value: unknown): DuplicateMode {
  return value === "skip" || value === "跳过" ? "skip" : "overwrite";
}

function normalizeMonth(value: unknown) {
  if (!value) return null;
  const text = String(value).replace("/", "-");
  if (/^\d{4}-\d{1,2}$/.test(text)) {
    const [year, month] = text.split("-");
    return `${year}-${month.padStart(2, "0")}-01`;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) return normalizeDate(text);
  return null;
}

function normalizeRow(row: Record<string, unknown>): NormalizedScheduleRow {
  return {
    employee_no: String(row.employee_no ?? row["工号"] ?? "").trim(),
    employee_name: String(row.employee_name ?? row["姓名"] ?? "").trim(),
    department: String(row.department ?? row["部门"] ?? "").trim(),
    work_date: normalizeDate(String(row.work_date ?? row["日期"] ?? "")),
    shift_code: normalizeShiftCode(row.shift_code ?? row["班次"]),
  };
}

function validateRows(rows: NormalizedScheduleRow[]) {
  const errors: ImportError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!row.employee_no) errors.push({ row: rowNumber, message: "employee_no is required" });
    if (!row.work_date) errors.push({ row: rowNumber, message: "work_date is invalid" });
    if (!shiftCodes.has(row.shift_code)) errors.push({ row: rowNumber, message: "shift_code must be ZC, ZB, WC, XIU, or -" });
  });

  return errors;
}

function parseWideCsv(csv: string): NormalizedScheduleRow[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0] ?? "").map((header) => header.trim());
  const employeeNoIndex = findHeader(headers, ["工号", "employee_no", "Employee No"]);
  const employeeNameIndex = findHeader(headers, ["姓名", "name", "employee_name"]);
  const departmentIndex = findHeader(headers, ["部门", "department"]);

  return lines.slice(1).flatMap((line) => {
    const values = splitCsvLine(line).map((value) => value.trim());
    return headers.flatMap((header, index) => {
      if ([employeeNoIndex, employeeNameIndex, departmentIndex].includes(index)) return [];
      const shiftCode = normalizeShiftCode(values[index]);
      if (shiftCode === "-") return [];

      return [{
        employee_no: values[employeeNoIndex] ?? "",
        employee_name: values[employeeNameIndex] ?? "",
        department: values[departmentIndex] ?? "",
        work_date: normalizeDate(header),
        shift_code: shiftCode,
      }];
    });
  });
}

function findHeader(headers: string[], candidates: string[]) {
  const index = headers.findIndex((header) => candidates.some((candidate) => header.toLowerCase() === candidate.toLowerCase()));
  return index >= 0 ? index : -1;
}

function normalizeShiftCode(value: unknown): ShiftCode {
  const text = String(value ?? "-").trim().toUpperCase();
  const alias: Record<string, ShiftCode> = {
    "早班": "ZC",
    "中班": "ZB",
    "晚班": "WC",
    "休息": "XIU",
    "未排班": "-",
    "": "-",
  };
  return alias[text] ?? (shiftCodes.has(text as ShiftCode) ? (text as ShiftCode) : "-");
}

function normalizeDate(value: string) {
  const match = value.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else current += char;
  }

  values.push(current);
  return values;
}

async function removeExistingSchedules(adminClient: ReturnType<typeof createClient>, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return rows;

  const profileIds = [...new Set(rows.map((row) => String(row.profile_id)))];
  const workDates = [...new Set(rows.map((row) => String(row.work_date)))];
  const { data: existing, error } = await adminClient
    .from("schedules")
    .select("profile_id, work_date")
    .in("profile_id", profileIds)
    .in("work_date", workDates);

  if (error) throw error;

  const existingKeys = new Set(existing?.map((row) => `${row.profile_id}:${row.work_date}`) ?? []);
  return rows.filter((row) => !existingKeys.has(`${row.profile_id}:${row.work_date}`));
}
