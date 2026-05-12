"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminDatasets } from "./admin-data-config";
import type { AdminAggregatedReportResult, AdminDataRecord, AdminDataset, AdminReportConfig, AdminReportResult, AdminViewConfig } from "./admin-data-model";

type ResultState = AdminReportResult | AdminAggregatedReportResult | null;
type LoadState = "idle" | "loading" | "ready" | "error";

export function AdminReportsView({
  configs,
  initialReportId,
  initialResult,
}: {
  configs: Record<AdminDataset, AdminViewConfig>;
  initialReportId?: string | null;
  initialResult?: ResultState;
}) {
  const searchParams = useSearchParams();
  const [dataset, setDataset] = useState<AdminDataset>(normalizeDataset(searchParams.get("dataset")));
  const [reportId, setReportId] = useState(() => initialReportId ?? initialResult?.report?.id ?? configs[normalizeDataset(searchParams.get("dataset"))].reports?.[0]?.id ?? "");
  const [filters, setFilters] = useState({
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
    orgUnit: searchParams.get("orgUnit") ?? "",
    scopeDepartmentId: searchParams.get("scopeDepartmentId") ?? "",
    personName: searchParams.get("personName") ?? "",
    category: searchParams.get("category") ?? "",
    keyword: searchParams.get("keyword") ?? "",
  });
  const [result, setResult] = useState<ResultState>(initialResult ?? null);
  const [state, setState] = useState<LoadState>(initialResult ? "ready" : "idle");
  const [message, setMessage] = useState("");

  const config = result?.config ?? configs[dataset];
  const reports = useMemo(() => config.reports ?? [], [config]);
  const selectedReport = useMemo<AdminReportConfig | null>(() => reports.find((item) => item.id === reportId) ?? reports[0] ?? null, [reportId, reports]);
  const columns = result?.columns ?? selectedReport?.columns ?? config.columns;
  const summaryCards =
    isAggregatedResult(result)
      ? result.summary.map((item) => ({ label: item.label, value: formatNumber(item.value) }))
      : [
          { label: "记录数", value: String(result?.total ?? 0) },
          { label: dataset === "customer" ? "客户数" : dataset === "target" ? "目标金额" : "金额合计", value: dataset === "customer" ? String(result?.total ?? 0) : formatNumber(result?.summary.amount ?? 0) },
          { label: dataset === "customer" ? "总消费次数" : dataset === "target" ? "目标新客合计" : "数量合计", value: formatNumber(result?.summary.quantity ?? 0) },
        ];

  async function load(next?: Partial<{ dataset: AdminDataset; reportId: string; filters: typeof filters; page: number }>) {
    const nextDataset = next?.dataset ?? dataset;
    const nextReportId = next?.reportId ?? reportId;
    const nextFilters = next?.filters ?? filters;

    setState("loading");
    setMessage("");

    const params = new URLSearchParams({
      dataset: nextDataset,
      page: String(next?.page ?? 1),
      pageSize: "20",
    });
    if (nextReportId) params.set("reportId", nextReportId);
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const response = await fetch(`/api/admin/data-records?${params.toString()}`);
    const payload = (await response.json()) as ResultState & { error?: string };
    if (!response.ok) {
      setState("error");
      setMessage(payload.error ?? "查询失败，请稍后再试。");
      return;
    }

    setResult(payload);
    setState("ready");
  }

  function exportUrl() {
    const params = new URLSearchParams({ dataset });
    if (reportId) params.set("reportId", reportId);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return `/api/admin/data-records/export?${params.toString()}`;
  }

  function setDatasetAndReload(nextDataset: AdminDataset) {
    const nextReportId = configs[nextDataset].reports?.[0]?.id ?? "";
    setDataset(nextDataset);
    setReportId(nextReportId);
    void load({ dataset: nextDataset, reportId: nextReportId, page: 1 });
  }

  function setReportAndReload(nextReportId: string) {
    setReportId(nextReportId);
    void load({ reportId: nextReportId, page: 1 });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[200px_220px_1fr]">
          <label className="block">
            <span className="text-xs font-medium text-[#607089]">数据类型</span>
            <select
              value={dataset}
              onChange={(event) => setDatasetAndReload(event.target.value as AdminDataset)}
              className="mt-1 w-full rounded-lg border border-[#cfd8e3] bg-white px-3 py-2 text-sm"
            >
              {adminDatasets.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#607089]">报表模板</span>
            <select
              value={reportId}
              onChange={(event) => setReportAndReload(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#cfd8e3] bg-white px-3 py-2 text-sm"
            >
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.title}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg bg-[#f8fafc] px-3 py-2 text-sm text-[#607089]">
            {selectedReport ? (
              <>
                <span className="font-medium text-[#2f3a4a]">{selectedReport.kind === "aggregate" ? "汇总模板" : "明细模板"}</span>
                <span className="mx-2">·</span>
                <span>{selectedReport.description ?? "当前模板由 JSON 配置驱动。"}</span>
              </>
            ) : (
              "当前数据类型还没有配置报表模板。"
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <FilterInput label={dataset === "customer" ? "创建开始" : dataset === "target" ? "目标开始" : "开始日期"} type="date" value={filters.startDate} onChange={(value) => setFilters((current) => ({ ...current, startDate: value }))} />
          <FilterInput label={dataset === "customer" ? "创建结束" : dataset === "target" ? "目标结束" : "结束日期"} type="date" value={filters.endDate} onChange={(value) => setFilters((current) => ({ ...current, endDate: value }))} />
          <FilterInput label={dataset === "customer" ? "归属门店" : "门店/部门"} value={filters.orgUnit} onChange={(value) => setFilters((current) => ({ ...current, orgUnit: value }))} />
          {dataset !== "target" ? <FilterInput label={dataset === "customer" ? "客户名称" : "人员"} value={filters.personName} onChange={(value) => setFilters((current) => ({ ...current, personName: value }))} /> : null}
          {dataset !== "target" ? <FilterInput label={dataset === "customer" ? "客户标签" : "分类"} value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} /> : null}
          <FilterInput label="关键词" value={filters.keyword} onChange={(value) => setFilters((current) => ({ ...current, keyword: value }))} />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => void load()} className="rounded-lg bg-[#1f5f8b] px-5 py-2.5 text-sm font-semibold text-white">
            查询
          </button>
          <a href={exportUrl()} className="rounded-lg border border-[#cfd8e3] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#1f5f8b]">
            下载 CSV
          </a>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      {message ? <div className="rounded-lg border border-[#ffd6d6] bg-white p-4 text-sm text-[#c1121f]">{message}</div> : null}

      <section className="rounded-lg border border-[#d7dee7] bg-white shadow-sm">
        <div className="border-b border-[#e5eaf0] px-4 py-3">
          <h2 className="font-semibold">{selectedReport?.title ?? config.title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f5f7fa] text-[#526174]">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result?.rows.length ? (
                result.rows.map((row, index) => (
                  <tr key={`${row.id ?? index}`} className="border-t border-[#eef2f6]">
                    {columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-4 py-3">
                        {formatCell(row, column.key)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[#607089]" colSpan={columns.length}>
                    {state === "loading" ? "查询中..." : "暂无数据"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#e5eaf0] px-4 py-3 text-sm text-[#607089]">
          <span>
            第 {result?.page ?? 1} 页 / 每页 {result?.pageSize ?? 20} 条
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!result || result.page <= 1} onClick={() => void load({ page: (result?.page ?? 1) - 1 })} className="rounded-lg border border-[#cfd8e3] px-3 py-1.5 disabled:opacity-50">
              上一页
            </button>
            <button type="button" disabled={!result || result.page * result.pageSize >= result.total} onClick={() => void load({ page: (result?.page ?? 1) + 1 })} className="rounded-lg border border-[#cfd8e3] px-3 py-1.5 disabled:opacity-50">
              下一页
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function normalizeDataset(value: string | null): AdminDataset {
  return value === "customer" || value === "target" ? value : "sales";
}

function isAggregatedResult(result: ResultState): result is AdminAggregatedReportResult {
  return result?.mode === "report";
}

function FilterInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#607089]">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cfd8e3] px-3 py-2 text-sm" />
    </label>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#607089]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function formatCell(row: AdminDataRecord | Record<string, string | number | null>, key: string) {
  const value = key in row ? row[key as keyof typeof row] : null;
  if (value === null || value === undefined) return "";
  return typeof value === "number" ? formatNumber(value) : String(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value);
}
