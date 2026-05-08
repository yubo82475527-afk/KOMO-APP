"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import type { ApprovalDetailPageData, ApprovalRequestStatus } from "./approval-model";

const statusText: Record<ApprovalRequestStatus, string> = {
  draft: "草稿",
  submitted: "审批中",
  waiting: "等待中",
  pending: "审批中",
  approved: "已通过",
  rejected: "已拒绝",
  cancelled: "已撤回",
};

export function ApprovalDetailView({ data }: { data: Extract<ApprovalDetailPageData, { state: "ready" }> }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const detail = data.detail;

  async function act(action: "approved" | "rejected") {
    setStatus("submitting");
    setMessage("");

    const response = await fetch(`/api/approval/${detail.id}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        comment,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "审批处理失败，请稍后重试。");
      return;
    }

    router.refresh();
  }

  return (
    <MobileShell active="approval">
      <Section
        title="申请信息"
        right={<span className={cx("text-sm font-medium", detail.status === "rejected" ? "text-[#c1121f]" : detail.status === "approved" ? "text-[#2d6a4f]" : "text-[#184e77]")}>{statusText[detail.status]}</span>}
      >
        <div className="space-y-3 text-sm">
          <p className="text-base font-semibold">{detail.title}</p>
          <p>
            申请人：{detail.requesterName}
            {detail.requesterDepartment ? ` · ${detail.requesterDepartment}` : ""}
          </p>
          <p>请假类型：{detail.payload.leaveType}</p>
          <p>
            日期范围：{detail.payload.startDate} 至 {detail.payload.endDate}
          </p>
          <p>请假天数：{detail.payload.days} 天</p>
          <p className="leading-6">原因：{detail.payload.reason}</p>
          <p className="text-[#8a97a8]">提交时间：{formatDateTime(detail.submittedAt ?? detail.createdAt)}</p>
        </div>
      </Section>

      <Section title="审批进度">
        <div className="space-y-3">
          {detail.steps.map((step) => (
            <div key={step.id} className="rounded-xl bg-[#f6f8fb] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {step.stepOrder}. {step.name}
                  </p>
                  <p className="mt-1 text-sm text-[#607089]">{step.approverName}</p>
                </div>
                <StepBadge status={step.status} />
              </div>
              {step.comment ? <p className="mt-2 text-sm text-[#526174]">意见：{step.comment}</p> : null}
              {step.actedAt ? <p className="mt-1 text-xs text-[#8a97a8]">{formatDateTime(step.actedAt)}</p> : null}
            </div>
          ))}
        </div>
      </Section>

      {data.canAct ? (
        <Section title="审批操作">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="填写审批意见（可选）"
            className="w-full resize-none rounded-xl border border-[#d9dee8] px-3 py-3 text-sm"
          />
          {message ? <p className="mt-3 text-sm text-[#c1121f]">{message}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" disabled={status === "submitting"} onClick={() => void act("rejected")} className="rounded-xl border border-[#c1121f] py-3 text-sm font-medium text-[#c1121f] disabled:opacity-60">
              拒绝
            </button>
            <button type="button" disabled={status === "submitting"} onClick={() => void act("approved")} className="rounded-xl bg-[#2d6a4f] py-3 text-sm font-medium text-white disabled:bg-[#8a97a8]">
              通过
            </button>
          </div>
        </Section>
      ) : null}

      <Link href="/approval" className="block rounded-2xl bg-white py-3 text-center text-sm font-medium text-[#184e77] shadow-sm">
        返回审批列表
      </Link>
    </MobileShell>
  );
}

function StepBadge({ status }: { status: string }) {
  const label = status === "pending" ? "待审批" : status === "approved" ? "已通过" : status === "rejected" ? "已拒绝" : "等待中";
  return (
    <span
      className={cx(
        "rounded-full px-2 py-1 text-xs",
        status === "pending"
          ? "bg-[#184e77] text-white"
          : status === "approved"
            ? "bg-[#eef7f0] text-[#2d6a4f]"
            : status === "rejected"
              ? "bg-[#fff5f5] text-[#c1121f]"
              : "bg-[#e6eaf0] text-[#607089]",
      )}
    >
      {label}
    </span>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
