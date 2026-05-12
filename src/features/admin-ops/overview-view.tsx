"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppLink } from "@/components/ui/app-link";
import { cx } from "@/components/ui/class-name";
import type { OpsAlert, OpsDatePreset, OpsOverviewData, OpsTask, OpsTaskStatus } from "./ops-model";

const presetOptions: Array<{ key: Exclude<OpsDatePreset, "custom">; label: string }> = [
  { key: "today", label: "今天" },
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
  { key: "year", label: "本年" },
];

export function AdminOpsOverviewView({ initialData }: { initialData: OpsOverviewData }) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [customStartDate, setCustomStartDate] = useState(initialData.startDate);
  const [customEndDate, setCustomEndDate] = useState(initialData.endDate);

  const periodLabel = useMemo(() => {
    return data.startDate === data.endDate ? data.startDate : `${data.startDate} 至 ${data.endDate}`;
  }, [data.endDate, data.startDate]);

  function navigateDate(input: { preset: OpsDatePreset; startDate?: string; endDate?: string }) {
    startTransition(() => {
      router.push(
        buildOverviewHref({
          scopeDepartmentId: data.scope.currentDepartmentId,
          preset: input.preset,
          startDate: input.startDate,
          endDate: input.endDate,
        }),
      );
    });
  }

  async function createTask(alert: OpsAlert) {
    setPendingId(alert.id);
    setMessage("");
    const response = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskDate: data.endDate,
        orgUnit: alert.orgUnit,
        taskType: alert.taskType,
        title: alert.title,
        summary: alert.summary,
        reasonSnapshot: alert.reasonSnapshot,
      }),
    });
    const payload = (await response.json()) as { task?: OpsTask; error?: string };
    setPendingId("");

    if (!response.ok || !payload.task) {
      setMessage(payload.error ?? "创建待办失败。");
      return;
    }

    setData((current) => ({ ...current, tasks: [payload.task!, ...current.tasks] }));
    setMessage(`待办已生成，统计周期 ${periodLabel}。`);
  }

  async function updateTask(task: OpsTask, status: OpsTaskStatus) {
    setPendingId(task.id);
    setMessage("");
    const response = await fetch(`/api/admin/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { task?: OpsTask; error?: string };
    setPendingId("");

    if (!response.ok || !payload.task) {
      setMessage(payload.error ?? "更新待办失败。");
      return;
    }

    setData((current) => ({ ...current, tasks: current.tasks.map((item) => (item.id === task.id ? payload.task! : item)) }));
  }

  const tableTitle = data.scope.scopeType === "store" ? "本店周期表现" : data.scope.scopeType === "company" ? "总部门店表现" : "下级门店表现";

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#d7dee7] bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(360px,1fr)_minmax(420px,1.25fr)] xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607089]">统计周期</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {presetOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={isNavigating}
                  onClick={() => navigateDate({ preset: option.key })}
                  className={cx(
                    "rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
                    data.preset === option.key ? "border-[#1f5f8b] bg-[#1f5f8b] text-white" : "border-[#cfd8e3] bg-white text-[#1f5f8b] hover:bg-[#f1f7fb]",
                  )}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                disabled={isNavigating}
                onClick={() => navigateDate({ preset: "custom", startDate: customStartDate, endDate: customEndDate })}
                className={cx(
                  "rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
                  data.preset === "custom" ? "border-[#1f5f8b] bg-[#1f5f8b] text-white" : "border-[#cfd8e3] bg-white text-[#1f5f8b] hover:bg-[#f1f7fb]",
                )}
              >
                自定义
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto] sm:items-end">
            <label className="text-sm text-[#526174]">
              开始日期
              <input
                type="date"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#cfd8e3] px-3 py-2 text-sm text-[#17202f] outline-none focus:border-[#1f5f8b]"
              />
            </label>
            <label className="text-sm text-[#526174]">
              结束日期
              <input
                type="date"
                value={customEndDate}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#cfd8e3] px-3 py-2 text-sm text-[#17202f] outline-none focus:border-[#1f5f8b]"
              />
            </label>
            <button
              type="button"
              disabled={isNavigating}
              onClick={() => navigateDate({ preset: "custom", startDate: customStartDate, endDate: customEndDate })}
              className="h-10 rounded-lg bg-[#1f5f8b] px-5 text-sm font-semibold text-white disabled:bg-[#8a97a8]"
            >
              应用日期
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#607089]">当前统计周期：{periodLabel}</p>
      </section>

      {message ? <div className="rounded-lg border border-[#cfe7d6] bg-white px-4 py-3 text-sm text-[#2d6a4f] shadow-sm">{message}</div> : null}

      {data.unboundOrgUnits.length > 0 ? (
        <section className="rounded-lg border border-[#ffe1aa] bg-[#fffaf0] px-4 py-3 text-sm text-[#8a5a00]">
          未绑定门店：{data.unboundOrgUnits.slice(0, 8).join("、")}
          {data.unboundOrgUnits.length > 8 ? ` 等 ${data.unboundOrgUnits.length} 个。` : "。"}
          这些门店名称尚未匹配到 departments.name，暂不纳入当前统计。
        </section>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.key} label={metric.label} actual={metric.actual} target={metric.target} rate={metric.achievementRate} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-[#d7dee7] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e5eaf0] px-4 py-3">
            <h2 className="font-semibold">异常门店与分析卡片</h2>
            <span className="text-sm text-[#607089]">{data.alerts.length} 条</span>
          </div>
          <div className="divide-y divide-[#eef2f6]">
            {data.alerts.length > 0 ? (
              data.alerts.slice(0, 12).map((alert) => (
                <div key={alert.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cx("rounded-md px-2 py-1 text-xs font-semibold", alert.severity === "danger" ? "bg-[#fff1f1] text-[#c1121f]" : "bg-[#fff8e6] text-[#9a6700]")}>{alert.severity === "danger" ? "严重" : "预警"}</span>
                      <h3 className="font-semibold text-[#17202f]">{alert.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#607089]">{alert.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <AppLink href={alert.reportHref} className="rounded-lg border border-[#cfd8e3] px-3 py-2 text-sm font-semibold text-[#1f5f8b]" pendingClassName="opacity-70">
                      查看明细
                    </AppLink>
                    <button type="button" disabled={pendingId === alert.id} onClick={() => void createTask(alert)} className="rounded-lg bg-[#1f5f8b] px-3 py-2 text-sm font-semibold text-white disabled:bg-[#8a97a8]">
                      {pendingId === alert.id ? "生成中..." : "生成待办"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-[#607089]">当前统计周期暂无异常。若还未上传目标数据，请先在数据上传中导入目标数据。</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#d7dee7] bg-white shadow-sm">
          <div className="border-b border-[#e5eaf0] px-4 py-3">
            <h2 className="font-semibold">经营待办</h2>
          </div>
          <div className="divide-y divide-[#eef2f6]">
            {data.tasks.length > 0 ? (
              data.tasks.slice(0, 10).map((task) => (
                <div key={task.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#607089]">{task.summary}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={pendingId === task.id || task.status === "in_progress"} onClick={() => void updateTask(task, "in_progress")} className="rounded-lg border border-[#cfd8e3] px-3 py-1.5 text-sm disabled:opacity-50">
                      处理中
                    </button>
                    <button type="button" disabled={pendingId === task.id || task.status === "resolved"} onClick={() => void updateTask(task, "resolved")} className="rounded-lg bg-[#2d6a4f] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                      已解决
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-[#607089]">当前统计周期暂无待办，可以从异常卡片生成跟进任务。</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#d7dee7] bg-white shadow-sm">
        <div className="border-b border-[#e5eaf0] px-4 py-3">
          <h2 className="font-semibold">{tableTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f5f7fa] text-[#526174]">
              <tr>
                {["门店", "销售", "新客", "权益销售", "项目销售", "目标状态"].map((label) => (
                  <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.stores.length > 0 ? (
                data.stores.map((store) => (
                  <tr key={store.orgUnit} className="border-t border-[#eef2f6]">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{store.orgUnit}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(store.sales)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(store.newCustomers)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(store.equitySales)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(store.serviceSales)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{store.hasTarget ? "已配置" : "缺少目标"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[#607089]" colSpan={6}>
                    当前统计周期暂无门店数据。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function buildOverviewHref(input: {
  scopeDepartmentId?: string | null;
  preset: OpsDatePreset;
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (input.scopeDepartmentId) params.set("scopeDepartmentId", input.scopeDepartmentId);
  params.set("preset", input.preset);
  if (input.preset === "custom") {
    if (input.startDate) params.set("startDate", input.startDate);
    if (input.endDate) params.set("endDate", input.endDate);
  }
  const query = params.toString();
  return query ? `/admin/overview?${query}` : "/admin/overview";
}

function MetricCard({ label, actual, target, rate }: { label: string; actual: number; target: number; rate: number | null }) {
  return (
    <div className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#607089]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{formatNumber(actual)}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-[#607089]">
        <span>目标 {formatNumber(target)}</span>
        <span>{rate === null ? "未配置目标" : `${Math.round(rate * 100)}%`}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#edf2f7]">
        <div className="h-2 rounded-full bg-[#1f5f8b]" style={{ width: `${Math.min((rate ?? 0) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OpsTaskStatus }) {
  const labels: Record<OpsTaskStatus, string> = {
    open: "待处理",
    in_progress: "处理中",
    resolved: "已解决",
    closed: "已关闭",
  };
  return <span className="shrink-0 rounded-md bg-[#f1f5f9] px-2 py-1 text-xs font-semibold text-[#526174]">{labels[status]}</span>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value);
}
