"use client";

import { useMemo, useState } from "react";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import { TabButton } from "@/components/ui/tab-button";
import type { SupportedLocale } from "@/lib/i18n";
import type { AdminScheduleListRow } from "./admin-schedule-data";
import { parseScheduleFile, type ImportPreview, type ImportValidationError } from "./import-parser";

type AdminScheduleMode = "list" | "import";
type ImportStatus = "idle" | "previewed" | "submitting" | "success" | "error";

export function AdminScheduleView({ rows, scopeDepartmentId }: { locale: SupportedLocale; rows: AdminScheduleListRow[]; scopeDepartmentId: string }) {
  const [mode, setMode] = useState<AdminScheduleMode>("list");
  const [duplicateMode, setDuplicateMode] = useState<"overwrite" | "skip">("overwrite");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [serverErrors, setServerErrors] = useState<ImportValidationError[]>([]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#17202f]">排班管理</h2>
            <p className="mt-1 text-sm text-[#607089]">当前列表和导入校验会跟随左侧经营范围。</p>
          </div>
          <div className="flex rounded-lg bg-[#eef2f6] p-1">
            <TabButton active={mode === "list"} onClick={() => setMode("list")}>
              排班列表
            </TabButton>
            <TabButton active={mode === "import"} onClick={() => setMode("import")}>
              导入排班
            </TabButton>
          </div>
        </div>
      </div>

      {mode === "list" ? (
        <ScheduleList rows={rows} />
      ) : (
        <ScheduleImport
          preview={preview}
          setPreview={setPreview}
          duplicateMode={duplicateMode}
          onDuplicateModeChange={setDuplicateMode}
          status={status}
          setStatus={setStatus}
          serverMessage={serverMessage}
          setServerMessage={setServerMessage}
          serverErrors={serverErrors}
          setServerErrors={setServerErrors}
          scopeDepartmentId={scopeDepartmentId}
        />
      )}
    </div>
  );
}

function ScheduleList({ rows }: { rows: AdminScheduleListRow[] }) {
  return (
    <div className="space-y-5">
      <Section title="排班列表">
        <div className="space-y-3">
          {rows.length > 0 ? (
            rows.map((row) => (
              <div key={row.profileId} className="rounded-xl bg-[#f6f8fb] p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {row.employeeName} {row.employeeNo ?? ""}
                  </p>
                </div>
                <p className="mt-1 text-sm text-[#607089]">{row.departmentName}</p>
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {row.week.map((item) => (
                    <span key={item.date} className="rounded bg-white px-1 py-1 text-center text-[10px] text-[#526174]">
                      <span className="block text-[#8a97a8]">{item.label}</span>
                      <span className="font-semibold text-[#17202f]">{formatShiftLabel(item.shift)}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-[#f6f8fb] p-6 text-center text-sm text-[#607089]">当前范围暂无员工排班数据。</div>
          )}
        </div>
      </Section>
    </div>
  );
}

function ScheduleImport({
  preview,
  setPreview,
  duplicateMode,
  onDuplicateModeChange,
  status,
  setStatus,
  serverMessage,
  setServerMessage,
  serverErrors,
  setServerErrors,
  scopeDepartmentId,
}: {
  preview: ImportPreview | null;
  setPreview: (value: ImportPreview | null) => void;
  duplicateMode: "overwrite" | "skip";
  onDuplicateModeChange: (value: "overwrite" | "skip") => void;
  status: ImportStatus;
  setStatus: (value: ImportStatus) => void;
  serverMessage: string;
  setServerMessage: (value: string) => void;
  serverErrors: ImportValidationError[];
  setServerErrors: (value: ImportValidationError[]) => void;
  scopeDepartmentId: string;
}) {
  const previewRows = useMemo(() => preview?.rows.slice(0, 8) ?? [], [preview]);

  async function handleFileChange(file: File | null) {
    setServerMessage("");
    setServerErrors([]);
    setStatus("idle");

    if (!file) {
      setPreview(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setPreview(null);
      setStatus("error");
      setServerMessage("当前仅支持 CSV 文件。");
      return;
    }

    const nextPreview = await parseScheduleFile(file);
    setPreview(nextPreview);
    setStatus(nextPreview.rows.length === 0 || nextPreview.invalidRows > 0 ? "error" : "previewed");
    if (nextPreview.rows.length === 0) setServerMessage("没有可导入的排班数据。");
  }

  async function handleCommit() {
    if (!preview) return;

    setStatus("submitting");
    setServerMessage("");
    setServerErrors([]);

    const response = await fetch("/api/admin/schedule-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: preview.fileName,
        targetMonth: preview.targetMonth,
        duplicateMode,
        scopeDepartmentId,
        rows: preview.rows,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      success_rows?: number;
      skipped_rows?: number;
      failed_rows?: number;
      errors?: ImportValidationError[];
    };

    if (!response.ok) {
      setStatus("error");
      setServerMessage(payload.error ?? "导入失败，请稍后再试。");
      setServerErrors(payload.errors ?? []);
      return;
    }

    setStatus("success");
    setServerMessage(`导入完成：成功 ${payload.success_rows ?? 0} 行，跳过 ${payload.skipped_rows ?? 0} 行。`);
  }

  return (
    <div className="space-y-5">
      <Section title="导入说明">
        <p className="text-sm leading-6 text-[#607089]">请使用标准排班模板导入。提交时会校验员工是否属于左侧当前范围，超出范围的员工不会写入。</p>
        <a href="/templates/schedule-import-template.csv" download className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#e6eef5] py-3 text-sm font-medium text-[#184e77]">
          下载模板
        </a>
      </Section>

      <Section title="选择文件">
        <label className="block rounded-2xl border border-dashed border-[#9aa8b8] bg-[#f6f8fb] p-5 text-center text-sm font-medium text-[#17202f]">
          选择 CSV 文件
          <input type="file" accept=".csv" className="hidden" onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)} />
        </label>
      </Section>

      <Section title="文件预览">
        <p className="text-sm text-[#607089]">文件名：{preview?.fileName ?? "未选择文件"}</p>
        <p className="mt-1 text-sm text-[#607089]">目标月份：{preview?.targetMonth ? preview.targetMonth.slice(0, 7) : "未知"}</p>

        {previewRows.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-[#d9dee8] text-xs">
            <div className="grid grid-cols-5 bg-[#eef2f6] p-2 font-medium">
              {["工号", "姓名", "部门", "日期", "班次"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            {previewRows.map((row) => (
              <div key={`${row.employee_no}-${row.work_date}`} className="grid grid-cols-5 border-t border-[#e6eaf0] p-2">
                <span>{row.employee_no}</span>
                <span>{row.employee_name}</span>
                <span>{row.department}</span>
                <span>{row.work_date}</span>
                <span>{formatShiftLabel(row.shift_code)}</span>
              </div>
            ))}
          </div>
        ) : null}

        {preview ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#eef7f0] p-3 text-sm text-[#2d6a4f]">可导入 {preview.validRows}</div>
            <div className="rounded-xl bg-[#fff5f5] p-3 text-sm text-[#c1121f]">异常 {preview.invalidRows}</div>
          </div>
        ) : null}
      </Section>

      <Section title="导入设置">
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "overwrite" as const, label: "覆盖重复排班" },
            { key: "skip" as const, label: "跳过重复排班" },
          ].map((item) => (
            <button key={item.key} type="button" onClick={() => onDuplicateModeChange(item.key)} className={cx("rounded-xl py-3 text-sm font-medium", duplicateMode === item.key ? "bg-[#184e77] text-white" : "bg-[#eef2f6] text-[#526174]")}>
              {item.label}
            </button>
          ))}
        </div>
      </Section>

      {preview?.errors.length ? <ErrorList title="预览错误" errors={preview.errors} /> : null}

      {serverMessage ? <div className={cx("rounded-2xl p-4 text-sm", status === "success" ? "bg-[#eef7f0] text-[#2d6a4f]" : "bg-[#fff5f5] text-[#c1121f]")}>{serverMessage}</div> : null}

      {serverErrors.length ? <ErrorList title="提交错误" errors={serverErrors} /> : null}

      <AsyncActionButton
        idleLabel="确认导入"
        pendingLabel="导入中"
        isPending={status === "submitting"}
        disabled={!preview || preview.invalidRows > 0 || preview.rows.length === 0}
        onClick={() => void handleCommit()}
        className="w-full rounded-2xl bg-[#2d6a4f] py-4 font-semibold text-white shadow-sm disabled:bg-[#8a97a8]"
      />
    </div>
  );
}

function ErrorList({ title, errors }: { title: string; errors: ImportValidationError[] }) {
  return (
    <Section title={title}>
      <div className="space-y-2 text-sm text-[#c1121f]">
        {errors.slice(0, 8).map((error, index) => (
          <p key={`${error.row}-${index}`}>
            第 {error.row} 行：{error.message}
          </p>
        ))}
      </div>
    </Section>
  );
}

function formatShiftLabel(value: string) {
  const labels: Record<string, string> = {
    ZC: "早班",
    ZB: "中班",
    WC: "晚班",
    XIU: "休息",
    "-": "未排班",
  };
  return labels[value] ?? value;
}
