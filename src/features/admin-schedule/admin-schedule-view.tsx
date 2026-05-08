"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMessage, getDictionary, type SupportedLocale } from "@/lib/i18n";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import { TabButton } from "@/components/ui/tab-button";
import { adminScheduleRows } from "@/features/shared/fixtures";
import { parseScheduleFile, type ImportPreview, type ImportValidationError } from "./import-parser";

type AdminScheduleMode = "list" | "import";
type ImportStatus = "idle" | "previewed" | "submitting" | "success" | "error";

export function AdminScheduleView({ locale }: { locale: SupportedLocale }) {
  const dictionary = getDictionary(locale);
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
          {dictionary.adminSchedule.pageTitle}
        </Link>
        <Link href="/admin/approval" className="rounded-xl bg-white px-3 py-3 text-center text-sm font-medium text-[#184e77]">
          {dictionary.adminSchedule.approvalConfig}
        </Link>
      </div>

      <div className="flex gap-2">
        <TabButton active={mode === "list"} onClick={() => setMode("list")}>
          {dictionary.adminSchedule.scheduleList}
        </TabButton>
        <TabButton active={mode === "import"} onClick={() => setMode("import")}>
          {dictionary.adminSchedule.importSchedule}
        </TabButton>
      </div>

      {mode === "list" ? (
        <ScheduleList locale={locale} />
      ) : (
        <ScheduleImport
          locale={locale}
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

function ScheduleList({ locale }: { locale: SupportedLocale }) {
  const dictionary = getDictionary(locale);

  return (
    <>
      <Section title={dictionary.adminSchedule.filters}>
        <div className="grid grid-cols-3 gap-2">
          {["客服部", "本周", "全部班次"].map((item) => (
            <button key={item} type="button" className="rounded-xl bg-[#eef2f6] px-2 py-3 text-sm">
              {item}
            </button>
          ))}
        </div>
      </Section>

      <Section title={dictionary.adminSchedule.listDemo} right={<button type="button" className="text-sm text-[#184e77]">{dictionary.adminSchedule.create}</button>}>
        <div className="space-y-3">
          {adminScheduleRows.map((row) => (
            <div key={row.employeeNo} className="rounded-xl bg-[#f6f8fb] p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {row.employee} {row.employeeNo}
                </p>
                <div className="flex gap-2 text-sm text-[#184e77]">
                  <button type="button">{dictionary.adminSchedule.edit}</button>
                  <button type="button">{dictionary.adminSchedule.delete}</button>
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
  locale,
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
  locale: SupportedLocale;
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
  const dictionary = getDictionary(locale);
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
      setServerMessage(dictionary.adminSchedule.csvOnly);
      return;
    }

    const nextPreview = await parseScheduleFile(file);
    setPreview(nextPreview);

    if (nextPreview.rows.length === 0) {
      setStatus("error");
      setServerMessage(dictionary.adminSchedule.previewEmpty);
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
      setServerMessage(payload.error ?? dictionary.common.retryLater);
      setServerErrors(payload.errors ?? []);
      return;
    }

    setStatus("success");
    setServerMessage(
      formatMessage(dictionary.adminSchedule.importCompleted, {
        success: String(payload.success_rows ?? 0),
        skipped: String(payload.skipped_rows ?? 0),
      }),
    );
    setServerErrors([]);
  }

  return (
    <>
      <Section title={dictionary.adminSchedule.importGuide}>
        <p className="text-sm leading-6 text-[#607089]">{dictionary.adminSchedule.importGuideBody}</p>
        <p className="mt-2 text-sm leading-6 text-[#607089]">{dictionary.adminSchedule.importGuideEncoding}</p>
        <a
          href="/templates/schedule-import-template.csv"
          download
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#e6eef5] py-3 text-sm font-medium text-[#184e77]"
        >
          {dictionary.adminSchedule.downloadTemplate}
        </a>
      </Section>

      <Section title={dictionary.adminSchedule.importMethod}>
        <label className="block rounded-2xl border border-dashed border-[#9aa8b8] bg-[#f6f8fb] p-5 text-center text-sm font-medium text-[#17202f]">
          {dictionary.adminSchedule.chooseCsv}
          <input type="file" accept=".csv" className="hidden" onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)} />
        </label>
      </Section>

      <Section title={dictionary.adminSchedule.filePreview}>
        <p className="text-sm text-[#607089]">{dictionary.adminSchedule.fileName}：{preview?.fileName ?? dictionary.adminSchedule.noFileSelected}</p>
        <p className="mt-1 text-sm text-[#607089]">{dictionary.adminSchedule.targetMonth}：{preview?.targetMonth ? preview.targetMonth.slice(0, 7) : dictionary.adminSchedule.monthUnknown}</p>

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
            <div className="rounded-xl bg-[#eef7f0] p-3 text-sm text-[#2d6a4f]">{dictionary.adminSchedule.importableRows} {preview.validRows}</div>
            <div className="rounded-xl bg-[#fff5f5] p-3 text-sm text-[#c1121f]">{dictionary.adminSchedule.invalidRows} {preview.invalidRows}</div>
          </div>
        )}
      </Section>

      <Section title={dictionary.adminSchedule.importSettings}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "覆盖" as const, label: dictionary.adminSchedule.overwrite },
            { key: "跳过" as const, label: dictionary.adminSchedule.skip },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onDuplicateModeChange(item.key)}
              className={cx("rounded-xl py-3 text-sm font-medium", duplicateMode === item.key ? "bg-[#184e77] text-white" : "bg-[#eef2f6] text-[#526174]")}
            >
              {item.label} {dictionary.adminSchedule.overwriteDuplicates}
            </button>
          ))}
        </div>
      </Section>

      {preview?.errors.length ? (
        <Section title={dictionary.adminSchedule.previewErrors}>
          <div className="space-y-2 text-sm text-[#c1121f]">
            {preview.errors.slice(0, 8).map((error, index) => (
              <p key={`${error.row}-${index}`}>{dictionary.adminSchedule.rowPrefix} {error.row}：{error.message}</p>
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
        <Section title={dictionary.adminSchedule.submitErrors}>
          <div className="space-y-2 text-sm text-[#c1121f]">
            {serverErrors.slice(0, 8).map((error, index) => (
              <p key={`${error.row}-${index}`}>{dictionary.adminSchedule.rowPrefix} {error.row}：{error.message}</p>
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
        {status === "submitting" ? dictionary.adminSchedule.importing : dictionary.adminSchedule.commitImport}
      </button>
    </>
  );
}
