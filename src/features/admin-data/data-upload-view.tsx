"use client";

import { useEffect, useMemo, useState } from "react";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { cx } from "@/components/ui/class-name";
import { adminDatasets } from "./admin-data-config";
import { toCsv } from "./csv";
import { readFirstWorksheetRows, type XlsxCellValue } from "./xlsx-parser";
import type { AdminDataset, AdminImportError, AdminImportPreview, AdminViewConfig } from "./admin-data-model";

type UploadStatus = "idle" | "previewing" | "previewed" | "submitting" | "success" | "error";

export function AdminDataUploadView({ configs }: { configs: Record<AdminDataset, AdminViewConfig> }) {
  const [dataset, setDataset] = useState<AdminDataset>("sales");
  const [preview, setPreview] = useState<AdminImportPreview | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [errors, setErrors] = useState<AdminImportError[]>([]);
  const previewRows = useMemo(() => preview?.rows.slice(0, 20) ?? [], [preview]);
  const visibleColumns = configs[dataset].columns.filter((column) => column.visible !== false);
  const selectedDatasetLabel = adminDatasets.find((item) => item.key === dataset)?.label ?? "数据";

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  async function handleFile(file: File | null) {
    setPreview(null);
    setMessage("");
    setToastMessage("");
    setErrors([]);
    setStatus("idle");
    if (!file) return;

    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setStatus("error");
      setMessage("请上传 CSV 或 Excel 文件。");
      return;
    }

    setStatus("previewing");
    const uploadDataset = inferDatasetFromFileName(file.name, dataset);
    setDataset(uploadDataset);
    let csvText = "";
    try {
      csvText = await readUploadFileAsCsv(file, configs[uploadDataset]);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "文件解析失败，请检查文件格式。");
      return;
    }

    const response = await fetch("/api/admin/data-upload/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset: uploadDataset, fileName: file.name, csvText }),
    });
    const payload = (await response.json()) as AdminImportPreview & { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "解析失败，请稍后再试。");
      return;
    }

    setPreview(payload);
    setErrors(payload.errors);
    setStatus(payload.errors.length > 0 ? "error" : "previewed");
    setMessage(payload.errors.length > 0 ? "预览发现错误，请修正 CSV 后重新上传。" : "预览通过，可以确认提交。");
  }

  async function commit() {
    if (!preview) return;
    setStatus("submitting");
    setMessage("");

    const response = await fetch("/api/admin/data-upload/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset: preview.dataset, fileName: preview.fileName, rows: preview.rows }),
    });
    const payload = (await response.json()) as { error?: string; successRows?: number };

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "提交失败，请稍后再试。");
      return;
    }

    setStatus("success");
    const successRows = payload.successRows ?? preview.rows.length;
    const successMessage = `导入完成：成功 ${successRows} 行。`;
    setMessage(successMessage);
    setToastMessage(`导入成功，导入数量 ${successRows}`);
  }

  return (
    <div className="space-y-5">
      {toastMessage ? (
        <div className="fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-40px))] rounded-xl border border-[#b9e4c9] bg-white px-4 py-3 text-sm text-[#22543d] shadow-[0_18px_50px_rgba(23,32,47,0.18)]">
          <p className="font-semibold">导入成功</p>
          <p className="mt-1 text-[#2d6a4f]">{toastMessage}</p>
        </div>
      ) : null}

      <section className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-medium text-[#526174]">数据类型</span>
            <select value={dataset} onChange={(event) => setDataset(event.target.value as AdminDataset)} className="mt-2 w-full rounded-lg border border-[#cfd8e3] bg-white px-3 py-2.5 text-sm">
              {adminDatasets.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block rounded-lg border border-dashed border-[#9aa8b8] bg-[#f8fafc] p-4 text-center text-sm font-medium text-[#17202f]">
            选择 CSV / XLSX 文件并预览
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
          </label>
          <button
            type="button"
            onClick={() => downloadTemplate(dataset, configs[dataset], selectedDatasetLabel)}
            className="rounded-lg border border-[#1f5f8b] bg-white px-4 py-3 text-sm font-semibold text-[#1f5f8b] transition hover:bg-[#f1f7fb]"
          >
            下载模板
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="文件" value={preview?.fileName ?? "未选择"} />
          <Stat label="有效行" value={String(preview?.validRows ?? 0)} />
          <Stat label="错误" value={String(preview?.errors.length ?? 0)} tone={preview?.errors.length ? "danger" : "normal"} />
        </div>
        {message ? (
          <div className={cx("mt-4 rounded-lg px-3 py-2 text-sm", status === "success" || status === "previewed" ? "bg-[#eef7f0] text-[#2d6a4f]" : "bg-[#fff5f5] text-[#c1121f]")}>
            {message}
          </div>
        ) : null}
      </section>

      {errors.length > 0 ? (
        <section className="rounded-lg border border-[#ffd6d6] bg-white p-4 shadow-sm">
          <h2 className="font-semibold">行级错误</h2>
          <div className="mt-3 space-y-2 text-sm text-[#c1121f]">
            {errors.slice(0, 20).map((error, index) => (
              <p key={`${error.row}-${error.column ?? "row"}-${index}`}>
                第 {error.row} 行{error.column ? ` / ${error.column}` : ""}：{error.message}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-[#d7dee7] bg-white shadow-sm">
        <div className="border-b border-[#e5eaf0] px-4 py-3">
          <h2 className="font-semibold">预览数据</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f5f7fa] text-[#526174]">
              <tr>
                {visibleColumns.map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.length > 0 ? (
                previewRows.map((row, index) => (
                  <tr key={`${row.record_date}-${index}`} className="border-t border-[#eef2f6]">
                    {visibleColumns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-4 py-3">
                        {String(row[column.key as keyof typeof row] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[#607089]" colSpan={visibleColumns.length}>
                    上传 CSV / XLSX 后会在这里显示前 20 行预览。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AsyncActionButton
        idleLabel="确认提交"
        pendingLabel="提交中..."
        isPending={status === "submitting"}
        disabled={!preview || errors.length > 0 || preview.rows.length === 0 || status === "success"}
        onClick={() => void commit()}
        className="w-full rounded-lg bg-[#1f5f8b] py-3 font-semibold text-white disabled:bg-[#8a97a8]"
      />
    </div>
  );
}

async function readUploadFileAsCsv(file: File, config: AdminViewConfig) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return file.text();
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("当前仅支持 CSV 和 XLSX 文件，请将旧版 XLS 另存为 XLSX 后上传。");
  }

  const rows = await readFirstWorksheetRows(file);

  const headerIndex = findHeaderRowIndex(rows, config);
  const normalizedRows = rows.slice(headerIndex).filter((row) => row.some((cell) => String(cell ?? "").trim()));
  if (normalizedRows.length === 0) {
    throw new Error("未在 Excel 中找到可导入的数据。");
  }

  return toCsv(
    normalizedRows[0].map((cell) => String(cell ?? "").trim()),
    normalizedRows.slice(1).map((row) => row.map((cell) => (cell === null ? "" : String(cell ?? "").trim()))),
  );
}

function findHeaderRowIndex(rows: XlsxCellValue[][], config: AdminViewConfig) {
  const aliases = new Set([...Object.keys(config.import.aliases), ...config.import.requiredColumns]);
  const index = rows.findIndex((row) => row.filter((cell) => aliases.has(String(cell ?? "").trim())).length >= 2);
  return index >= 0 ? index : 0;
}

function inferDatasetFromFileName(fileName: string, currentDataset: AdminDataset): AdminDataset {
  if (/汇率|exchange|rate/i.test(fileName)) return "exchange";
  if (fileName.includes("目标")) return "target";
  return fileName.includes("客户") ? "customer" : currentDataset;
}

function downloadTemplate(dataset: AdminDataset, config: AdminViewConfig, datasetLabel: string) {
  const labelMap = new Map(config.columns.map((column) => [column.key, column.label]));
  const templateColumns = getTemplateColumns(dataset, config);
  const headers = templateColumns.map((key) => labelMap.get(key) ?? key);
  const csv = `\uFEFF${toCsv(headers, [])}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${datasetLabel}上传模板.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getTemplateColumns(dataset: AdminDataset, config: AdminViewConfig) {
  if (dataset === "sales") {
    return config.exportColumns;
  }
  if (dataset === "exchange") {
    return ["period_month", "from_currency", "to_currency", "rate"];
  }
  return config.columns.map((column) => column.key);
}

function Stat({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "danger" }) {
  return (
    <div className="rounded-lg border border-[#e5eaf0] bg-[#f8fafc] p-3">
      <p className="text-xs text-[#607089]">{label}</p>
      <p className={cx("mt-1 truncate text-lg font-semibold", tone === "danger" ? "text-[#c1121f]" : "text-[#17202f]")}>{value}</p>
    </div>
  );
}
