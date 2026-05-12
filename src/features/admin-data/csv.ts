export function parseCsv(csv: string) {
  const normalized = csv.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    return { headers: [] as string[], rows: [] as string[][] };
  }

  const [headerRow, ...dataRows] = splitCsvRows(normalized);
  const headers = (headerRow ?? []).map((header) => header.trim());
  const rows = dataRows
    .filter((row) => row.some((value) => value.trim()))
    .map((row) => row.map((value) => value.trim()));
  return { headers, rows };
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [headers, ...rows].map((row) => row.map(formatCsvCell).join(",")).join("\r\n");
}

function splitCsvRows(text: string) {
  const rows: string[][] = [];
  let values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      values.push(current);
      rows.push(values);
      values = [];
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  rows.push(values);
  return rows;
}

function formatCsvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
