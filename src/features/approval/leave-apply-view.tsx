"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Section } from "@/components/ui/section";
import type { LeaveApplyPageData } from "./approval-model";

const leaveTypeLabels = {
  "zh-CN": ["年假", "事假", "病假", "调休", "其他"],
  en: ["Annual Leave", "Personal Leave", "Sick Leave", "Time Off", "Other"],
} as const;

export function LeaveApplyView({ data }: { data: Extract<LeaveApplyPageData, { state: "ready" }> }) {
  const router = useRouter();
  const labels = useMemo(() => leaveTypeLabels[data.locale], [data.locale]);
  const [leaveType, setLeaveType] = useState<string>(labels[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState(
    data.locale === "en"
      ? `Active template: ${data.activeTemplateName ?? "Not configured"}`
      : `当前生效模板：${data.activeTemplateName ?? "暂未配置"}`,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage(data.locale === "en" ? "Submitting leave request..." : "正在提交请假申请...");

    const response = await fetch("/api/approval/leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leaveType,
        startDate,
        endDate,
        days: Number(days),
        reason,
      }),
    });

    const payload = (await response.json()) as { error?: string; requestId?: string };
    if (!response.ok || !payload.requestId) {
      setStatus("error");
      setMessage(payload.error ?? (data.locale === "en" ? "Leave request failed. Please try again later." : "请假申请提交失败，请稍后重试。"));
      return;
    }

    setStatus("success");
    setMessage(data.locale === "en" ? "Leave request submitted. Opening details..." : "请假申请已提交，正在跳转到审批详情...");
    router.push(`/approval/${payload.requestId}`);
    router.refresh();
  }

  return (
    <MobileShell active="approval" locale={data.locale}>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm text-[#607089]">{data.locale === "en" ? "Create Leave Request" : "发起请假申请"}</p>
        <h2 className="mt-1 text-xl font-semibold text-[#17202f]">{data.viewer.fullName}</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">
          {data.viewer.departmentName ?? (data.locale === "en" ? "No department assigned" : "未分配部门")} 路{" "}
          {data.locale === "en" ? "The request will follow the active approval template automatically." : "申请会按当前审批模板自动流转给对应审批人。"}
        </p>
      </section>

      <Section title={data.locale === "en" ? "Request Details" : "填写申请"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-[#607089]">{data.locale === "en" ? "Leave Type" : "请假类型"}</span>
            <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d9dee8] bg-white px-3 py-3 text-sm">
              {labels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-[#607089]">{data.locale === "en" ? "Start Date" : "开始日期"}</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d9dee8] px-3 py-3 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm text-[#607089]">{data.locale === "en" ? "End Date" : "结束日期"}</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d9dee8] px-3 py-3 text-sm" required />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-[#607089]">{data.locale === "en" ? "Days" : "请假天数"}</span>
            <input type="number" min="0.5" step="0.5" value={days} onChange={(event) => setDays(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d9dee8] px-3 py-3 text-sm" required />
          </label>

          <label className="block">
            <span className="text-sm text-[#607089]">{data.locale === "en" ? "Reason" : "请假原因"}</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-[#d9dee8] px-3 py-3 text-sm"
              placeholder={data.locale === "en" ? "Please enter the leave reason" : "请填写请假原因"}
              required
            />
          </label>

          <div className={`rounded-2xl p-4 text-sm ${status === "error" ? "bg-[#fff5f5] text-[#c1121f]" : status === "success" ? "bg-[#eef7f0] text-[#2d6a4f]" : "bg-[#f6f8fb] text-[#607089]"}`}>
            {message}
          </div>

          <AsyncActionButton
            type="submit"
            idleLabel={data.locale === "en" ? "Submit Leave Request" : "提交请假申请"}
            pendingLabel={data.locale === "en" ? "Submitting..." : "提交中..."}
            isPending={status === "submitting"}
            className="w-full rounded-2xl bg-[#184e77] py-4 font-semibold text-white shadow-sm disabled:bg-[#8a97a8]"
          />
        </form>
      </Section>
    </MobileShell>
  );
}
