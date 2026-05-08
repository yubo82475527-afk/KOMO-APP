export type DuplicateMode = "overwrite" | "skip";
export type ShiftCode = "ZC" | "ZB" | "WC" | "XIU" | "-";

export type NormalizedScheduleRow = {
  employee_no: string;
  employee_name: string;
  department: string;
  work_date: string;
  shift_code: ShiftCode;
};

export type ImportValidationError = {
  row: number;
  column?: string;
  message: string;
};

export type ImportPreview = {
  fileName: string;
  targetMonth: string | null;
  rows: NormalizedScheduleRow[];
  validRows: number;
  invalidRows: number;
  errors: ImportValidationError[];
};

const shiftCodes = new Set<ShiftCode>(["ZC", "ZB", "WC", "XIU", "-"]);
const supportedEncodings = ["utf-8", "gb18030", "gbk"] as const;

export async function parseScheduleFile(file: File): Promise<ImportPreview> {
  const buffer = await file.arrayBuffer();
  const candidates = supportedEncodings.map((encoding) => decodeCsvBuffer(buffer, encoding));

  const best = candidates
    .map((csv) => ({ csv, score: scoreCsvCandidate(csv) }))
    .sort((left, right) => right.score - left.score)[0];

  return parseScheduleCsv(file.name, best?.csv ?? "");
}

export function parseScheduleCsv(fileName: string, csv: string): ImportPreview {
  const rows = parseWideCsv(csv);
  const errors = validateRows(rows);
  return {
    fileName,
    targetMonth: inferTargetMonth(rows),
    validRows: Math.max(rows.length - errors.length, 0),
    invalidRows: errors.length,
    rows,
    errors,
  };
}

export function normalizeDuplicateMode(value: string): DuplicateMode {
  return value === "skip" || value === "跳过" ? "skip" : "overwrite";
}

export function validateRows(rows: NormalizedScheduleRow[]) {
  const errors: ImportValidationError[] = [];
  const months = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!row.employee_no) errors.push({ row: rowNumber, column: "employee_no", message: "工号不能为空" });
    if (!row.employee_name) errors.push({ row: rowNumber, column: "employee_name", message: "姓名不能为空" });
    if (!row.work_date) errors.push({ row: rowNumber, column: "work_date", message: "日期格式无效" });
    if (!shiftCodes.has(row.shift_code)) errors.push({ row: rowNumber, column: "shift_code", message: "班次必须是 ZC、ZB、WC、XIU 或 -" });
    if (row.work_date) months.add(row.work_date.slice(0, 7));
  });

  if (months.size > 1) {
    errors.push({ row: 1, column: "work_date", message: "当前导入文件包含多个自然月，请拆分后再导入。" });
  }

  return errors;
}

function parseWideCsv(csv: string): NormalizedScheduleRow[] {
  const normalizedCsv = csv.replace(/^\uFEFF/, "").trim();
  const lines = normalizedCsv.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0] ?? "").map((header) => header.trim());
  const employeeNoIndex = findHeader(headers, ["工号", "employee_no", "Employee No"]);
  const employeeNameIndex = findHeader(headers, ["姓名", "name", "employee_name"]);
  const departmentIndex = findHeader(headers, ["部门", "department"]);

  if (employeeNoIndex < 0 || employeeNameIndex < 0 || departmentIndex < 0) {
    return [];
  }

  return lines.slice(1).flatMap((line) => {
    const values = splitCsvLine(line).map((value) => value.trim());

    if (values.every((value) => value === "")) {
      return [];
    }

    return headers.flatMap((header, index) => {
      if ([employeeNoIndex, employeeNameIndex, departmentIndex].includes(index)) return [];
      const workDate = normalizeDate(header);
      if (!workDate) return [];

      return [
        {
          employee_no: values[employeeNoIndex] ?? "",
          employee_name: values[employeeNameIndex] ?? "",
          department: values[departmentIndex] ?? "",
          work_date: workDate,
          shift_code: normalizeShiftCode(values[index]),
        },
      ];
    });
  });
}

function inferTargetMonth(rows: NormalizedScheduleRow[]) {
  const first = rows.find((row) => row.work_date)?.work_date;
  return first ? `${first.slice(0, 7)}-01` : null;
}

function findHeader(headers: string[], candidates: string[]) {
  return headers.findIndex((header) => candidates.some((candidate) => header.toLowerCase() === candidate.toLowerCase()));
}

function normalizeShiftCode(value: unknown): ShiftCode {
  const text = String(value ?? "-").trim().toUpperCase();
  const alias: Record<string, ShiftCode> = {
    早班: "ZC",
    中班: "ZB",
    晚班: "WC",
    休息: "XIU",
    未排班: "-",
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
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function decodeCsvBuffer(buffer: ArrayBuffer, encoding: string) {
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    return "";
  }
}

function scoreCsvCandidate(csv: string) {
  if (!csv) return -1;

  const header = csv.split(/\r?\n/, 1)[0] ?? "";
  let score = 0;

  if (header.includes("工号")) score += 5;
  if (header.includes("姓名")) score += 5;
  if (header.includes("部门")) score += 5;
  if (/\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(header)) score += 3;

  const replacementCount = (csv.match(/\uFFFD/g) ?? []).length;
  score -= replacementCount * 2;

  return score;
}
