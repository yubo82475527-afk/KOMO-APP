"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import { TabButton } from "@/components/ui/tab-button";
import { adminScheduleRows } from "@/features/shared/fixtures";
import { parseScheduleFile, type ImportPreview, type ImportValidationError } from "./import-parser";

type AdminScheduleMode = "list" | "import";
type ImportStatus = "idle" | "previewed" | "submitting" | "success" | "error";

export function AdminScheduleView() {
  const [mode, setMode] = useState<AdminScheduleMode>("list");
  const [duplicateMode, setDuplicateMode] = useState<"覆盖" | "跳过">("覆盖");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [serverErrors, setServerErrors] = useState<ImportValidationError[]>([]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/admin/schedule" className="rounded-xl bg-[#184e77] px-3 py-3 text-center text-sm font-medium text-white">
          排班管理
        </Link>
        <Link href="/admin/approval" className="rounded-xl bg-white px-3 py-3 text-center text-sm font-medium text-[#184e77]">
          审批配置
        </Link>
      </div>

      <div className="flex gap-2">
        <TabButton active={mode === "list"} onClick={() => setMode("list")}>
          排班列表
        </TabButton>
        <TabButton active={mode === "import"} onClick={() => setMode("import")}>
          导入排班
        </TabButton>
      </div>

      {mode === "list" ? (
        <ScheduleList />
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
        />
      )}
    </>
  );
}

function ScheduleList() {
  return (
    <>
      <Section title="筛选器">
        <div className="grid grid-cols-3 gap-2">
          {["客服部", "本周", "全部班次"].map((item) => (
            <button key={item} type="button" className="rounded-xl bg-[#eef2f6] px-2 py-3 text-sm">
              {item}
            </button>
          ))}
        </div>
      </Section>

      <Section title="排班列表示意" right={<button type="button" className="text-sm text-[#184e77]">新建</button>}>
        <div className="space-y-3">
          {adminScheduleRows.map((row) => (
            <div key={row.employeeNo} className="rounded-xl bg-[#f6f8fb] p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {row.employee} {row.employeeNo}
                </p>
                <div className="flex gap-2 text-sm text-[#184e77]">
                  <button type="button">编辑</button>
                  <button type="button">删除</button>
                </div>
              </div>
              <p className="mt-1 text-sm text-[#607089]">{row.department}</p>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {row.week.map((item) => (
                  <span key={item.day} className={cx("rounded px-1 py-1 text-center text-[10px]", item.shift.colorClass)}>
                    {item.shift.name.slice(0, 1)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
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
}: {
  preview: ImportPreview | null;
  setPreview: (value: ImportPreview | null) => void;
  duplicateMode: "覆盖" | "跳过";
  onDuplicateModeChange: (value: "覆盖" | "跳过") => void;
  status: ImportStatus;
  setStatus: (value: ImportStatus) => void;
  serverMessage: string;
  setServerMessage: (value: string) => void;
  serverErrors: ImportValidationError[];
  setServerErrors: (value: ImportValidationError[]) => void;
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
      setServerMessage("当前试运行版本先支持标准 CSV 文件导入，原生 .xlsx 会在下一阶段补上。");
      return;
    }

    const nextPreview = await parseScheduleFile(file);
    setPreview(nextPreview);

    if (nextPreview.rows.length === 0) {
      setStatus("error");
      setServerMessage("没有识别到有效排班数据。请确认表头包含“工号、姓名、部门”和日期列，并尽量使用系统下载的模板。");
      return;
    }

    setStatus("previewed");
  }

  async function handleCommit() {
    if (!preview) return;

    setStatus("submitting");
    setServerMessage("");
    setServerErrors([]);

    const response = await fetch("/api/admin/schedule-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: preview.fileName,
        targetMonth: preview.targetMonth,
        duplicateMode: duplicateMode === "跳过" ? "skip" : "overwrite",
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
      setServerMessage(payload.error ?? "导入失败，请稍后重试。");
      setServerErrors(payload.errors ?? []);
      return;
    }

    setStatus("success");
    setServerMessage(`导入完成：成功 ${payload.success_rows ?? 0} 行，跳过 ${payload.skipped_rows ?? 0} 行。`);
    setServerErrors([]);
  }

  return (
    <>
      <Section title="导入说明">
        <p className="text-sm leading-6 text-[#607089]">
          当前试运行链路支持按标准排班模板导入。模板必须是宽表格式：工号、姓名、部门，然后每个日期一列，单元格填写 `ZC`、`ZB`、`WC`、`XIU` 或 `-`。
        </p>
        <p className="mt-2 text-sm leading-6 text-[#607089]">
          已兼容 Excel 常见中文 CSV 编码；如果仍识别不到，请优先使用下方模板重新下载后填写。
        </p>
        <a
          href="/templates/schedule-import-template.csv"
          download
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#e6eef5] py-3 text-sm font-medium text-[#184e77]"
        >
          下载标准模板
        </a>
      </Section>

      <Section title="导入方式">
        <label className="block rounded-2xl border border-dashed border-[#9aa8b8] bg-[#f6f8fb] p-5 text-center text-sm font-medium text-[#17202f]">
          选择标准模板 CSV 文件
          <input type="file" accept=".csv" className="hidden" onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)} />
        </label>
      </Section>

      <Section title="文件预览">
        <p className="text-sm text-[#607089]">文件名：{preview?.fileName ?? "尚未选择文件"}</p>
        <p className="mt-1 text-sm text-[#607089]">目标月份：{preview?.targetMonth ? preview.targetMonth.slice(0, 7) : "未识别"}</p>

        {previewRows.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-[#d9dee8] text-xs">
            <div className="grid grid-cols-5 bg-[#eef2f6] p-2 font-medium">
              <span>工号</span>
              <span>姓名</span>
              <span>部门</span>
              <span>日期</span>
              <span>班次</span>
            </div>
            {previewRows.map((row) => (
              <div key={`${row.employee_no}-${row.work_date}`} className="grid grid-cols-5 border-t border-[#e6eaf0] p-2">
                <span>{row.employee_no}</span>
                <span>{row.employee_name}</span>
                <span>{row.department}</span>
                <span>{row.work_date}</span>
                <span>{row.shift_code}</span>
              </div>
            ))}
          </div>
        )}

        {preview && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#eef7f0] p-3 text-sm text-[#2d6a4f]">可导入 {preview.validRows} 行</div>
            <div className="rounded-xl bg-[#fff5f5] p-3 text-sm text-[#c1121f]">校验错误 {preview.invalidRows} 行</div>
          </div>
        )}
      </Section>

      <Section title="导入配置">
        <div className="grid grid-cols-2 gap-2">
          {["覆盖", "跳过"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onDuplicateModeChange(item as "覆盖" | "跳过")}
              className={cx("rounded-xl py-3 text-sm font-medium", duplicateMode === item ? "bg-[#184e77] text-white" : "bg-[#eef2f6] text-[#526174]")}
            >
              {item}重复数据
            </button>
          ))}
        </div>
      </Section>

      {preview?.errors.length ? (
        <Section title="预览错误">
          <div className="space-y-2 text-sm text-[#c1121f]">
            {preview.errors.slice(0, 8).map((error, index) => (
              <p key={`${error.row}-${index}`}>第 {error.row} 行：{error.message}</p>
            ))}
          </div>
        </Section>
      ) : null}

      {serverMessage ? (
        <div className={cx("rounded-2xl p-4 text-sm", status === "success" ? "bg-[#eef7f0] text-[#2d6a4f]" : "bg-[#fff5f5] text-[#c1121f]")}>
          {serverMessage}
        </div>
      ) : null}

      {serverErrors.length ? (
        <Section title="提交错误">
          <div className="space-y-2 text-sm text-[#c1121f]">
            {serverErrors.slice(0, 8).map((error, index) => (
              <p key={`${error.row}-${index}`}>第 {error.row} 行：{error.message}</p>
            ))}
          </div>
        </Section>
      ) : null}

      <button
        type="button"
        disabled={!preview || preview.invalidRows > 0 || preview.rows.length === 0 || status === "submitting"}
        onClick={() => void handleCommit()}
        className="w-full rounded-2xl bg-[#2d6a4f] py-4 font-semibold text-white shadow-sm disabled:bg-[#8a97a8]"
      >
        {status === "submitting" ? "导入中..." : "确认导入"}
      </button>
    </>
  );
}
