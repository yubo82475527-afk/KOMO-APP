import JSZip from "jszip/dist/jszip.min.js";

export type XlsxCellValue = string | number | null;

const relationshipNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export async function readFirstWorksheetRows(file: File): Promise<XlsxCellValue[][]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const sheetPath = await resolveFirstSheetPath(zip);
  const sheetXml = await readZipText(zip, sheetPath);
  const sharedStrings = await readSharedStrings(zip);
  return parseSheetRows(sheetXml, sharedStrings);
}

async function resolveFirstSheetPath(zip: JSZip) {
  const workbookXml = await readZipText(zip, "xl/workbook.xml");
  const workbook = parseXml(workbookXml);
  const firstSheet = findElements(workbook, "sheet")[0];
  const relationshipId = firstSheet?.getAttributeNS(relationshipNamespace, "id") ?? firstSheet?.getAttribute("r:id");

  if (relationshipId) {
    const relationshipsXml = await readZipText(zip, "xl/_rels/workbook.xml.rels");
    const relationships = parseXml(relationshipsXml);
    const relationship = findElements(relationships, "Relationship").find((item) => item.getAttribute("Id") === relationshipId);
    const target = relationship?.getAttribute("Target");
    if (target) {
      return normalizeWorkbookTarget(target);
    }
  }

  if (zip.file("xl/worksheets/sheet1.xml")) {
    return "xl/worksheets/sheet1.xml";
  }

  throw new Error("未找到 Excel 工作表。");
}

async function readSharedStrings(zip: JSZip) {
  const entry = zip.file("xl/sharedStrings.xml");
  if (!entry) return [];

  const xml = await entry.async("text");
  const document = parseXml(xml);
  return findElements(document, "si").map((item) => readTextNodes(item));
}

function parseSheetRows(sheetXml: string, sharedStrings: string[]) {
  const document = parseXml(sheetXml);
  return findElements(document, "row").map((row) => {
    const values: XlsxCellValue[] = [];
    findElements(row, "c").forEach((cell) => {
      const columnIndex = columnReferenceToIndex(cell.getAttribute("r") ?? "");
      if (columnIndex < 0) return;
      values[columnIndex] = readCellValue(cell, sharedStrings);
    });
    return values;
  });
}

function readCellValue(cell: Element, sharedStrings: string[]): XlsxCellValue {
  const type = cell.getAttribute("t");

  if (type === "inlineStr") {
    const inlineString = findElements(cell, "is")[0];
    return inlineString ? readTextNodes(inlineString) : "";
  }

  const rawValue = findElements(cell, "v")[0]?.textContent?.trim() ?? "";
  if (type === "s") {
    return sharedStrings[Number(rawValue)] ?? "";
  }
  if (type === "str") {
    return rawValue;
  }
  if (!rawValue) {
    return "";
  }

  const number = Number(rawValue);
  return Number.isFinite(number) ? number : rawValue;
}

function normalizeWorkbookTarget(target: string) {
  const normalized = target.replaceAll("\\", "/").replace(/^\/+/, "");
  return normalized.startsWith("xl/") ? normalized : `xl/${normalized}`;
}

function columnReferenceToIndex(cellReference: string) {
  const letters = cellReference.match(/^[A-Z]+/i)?.[0].toUpperCase();
  if (!letters) return -1;

  let value = 0;
  for (const letter of letters) {
    value = value * 26 + letter.charCodeAt(0) - 64;
  }
  return value - 1;
}

function readTextNodes(element: Element) {
  return findElements(element, "t")
    .map((item) => item.textContent ?? "")
    .join("");
}

function findElements(root: ParentNode, localName: string) {
  return Array.from(root.querySelectorAll("*")).filter((element) => element.localName === localName);
}

function parseXml(xml: string) {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = document.querySelector("parsererror");
  if (parserError) {
    throw new Error(parserError.textContent ?? "Excel XML 解析失败。");
  }
  return document;
}

async function readZipText(zip: JSZip, path: string) {
  const entry = zip.file(path);
  if (!entry) {
    throw new Error(`Excel 文件缺少 ${path}。`);
  }
  return entry.async("text");
}
