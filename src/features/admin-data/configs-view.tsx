"use client";

import { useMemo, useState } from "react";
import { adminDatasets } from "./admin-data-config";
import type { AdminDataset, AdminViewConfig } from "./admin-data-model";

export function AdminConfigsView({ configs, canEdit }: { configs: Record<AdminDataset, AdminViewConfig>; canEdit: boolean }) {
  const [savedConfigs, setSavedConfigs] = useState(configs);
  const [dataset, setDataset] = useState<AdminDataset>("sales");
  const [text, setText] = useState(() => JSON.stringify(configs.sales, null, 2));
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const reportTemplates = useMemo(() => savedConfigs[dataset].reports ?? [], [dataset, savedConfigs]);

  function changeDataset(nextDataset: AdminDataset) {
    setDataset(nextDataset);
    setText(JSON.stringify(savedConfigs[nextDataset], null, 2));
    setMessage("");
    setStatus("idle");
  }

  async function save() {
    setMessage("");
    setStatus("saving");
    let config: AdminViewConfig;
    try {
      config = JSON.parse(text) as AdminViewConfig;
    } catch {
      setStatus("error");
      setMessage("JSON 格式无效，请修正后再保存。");
      return;
    }

    const response = await fetch("/api/admin/view-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset, config }),
    });
    const payload = (await response.json()) as { error?: string; config?: AdminViewConfig };

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "保存失败，请稍后再试。");
      return;
    }

    setStatus("success");
    setMessage("配置已保存。");
    if (payload.config) {
      setText(JSON.stringify(payload.config, null, 2));
      setSavedConfigs((current) => ({ ...current, [dataset]: payload.config ?? current[dataset] }));
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[240px_1fr] sm:items-end">
          <label className="block">
            <span className="text-sm font-medium text-[#607089]">数据类型</span>
            <select value={dataset} onChange={(event) => changeDataset(event.target.value as AdminDataset)} className="mt-2 w-full rounded-lg border border-[#cfd8e3] bg-white px-3 py-2.5 text-sm">
              {adminDatasets.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg bg-[#f8fafc] px-3 py-2 text-sm text-[#607089]">
            JSON 配置会影响上传映射、列表列、筛选项、导出字段和报表模板。保存权限：admin / hr。
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[#2f3a4a]">报表模板</h3>
            <p className="mt-1 text-sm text-[#607089]">`reports` 数组就在这份 JSON 里，下面展示的是当前数据集已经配置好的模板。</p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reportTemplates.length ? (
            reportTemplates.map((report) => (
              <div key={report.id} className="rounded-lg border border-[#e5eaf0] bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-[#2f3a4a]">{report.title}</div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#607089]">{report.kind === "aggregate" ? "汇总" : "明细"}</span>
                </div>
                <div className="mt-2 text-sm text-[#607089]">{report.description ?? "无描述"}</div>
                <div className="mt-2 text-xs text-[#8b97a8]">ID: {report.id}</div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[#d7dee7] bg-[#fafbfd] p-4 text-sm text-[#607089]">当前数据类型还没有配置报表模板。</div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
        <textarea value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} className="min-h-[560px] w-full resize-y rounded-lg border border-[#cfd8e3] bg-[#0f172a] p-4 font-mono text-sm leading-6 text-[#dbeafe]" />
        {message ? <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${status === "success" ? "bg-[#eef7f0] text-[#2d6a4f]" : "bg-[#fff5f5] text-[#c1121f]"}`}>{message}</div> : null}
        <button type="button" disabled={!canEdit || status === "saving"} onClick={() => void save()} className="mt-4 w-full rounded-lg bg-[#1f5f8b] py-3 font-semibold text-white disabled:bg-[#8a97a8]">
          {status === "saving" ? "保存中..." : canEdit ? "保存配置" : "当前角色只能查看配置"}
        </button>
      </section>
    </div>
  );
}
