"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import { TabButton } from "@/components/ui/tab-button";
import type { ApprovalPageReadyData, ApprovalRequestStatus } from "./approval-model";

type ApprovalTab = "mine" | "pending";

const statusLabel: Record<ApprovalRequestStatus, string> = {
  draft: "草稿",
  submitted: "审批中",
  waiting: "等待中",
  pending: "审批中",
  approved: "已通过",
  rejected: "已拒绝",
  cancelled: "已撤回",
};

export function ApprovalView({ data }: { data: ApprovalPageReadyData }) {
  const [tab, setTab] = useState<ApprovalTab>("mine");

  return (
    <MobileShell active="approval">
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm text-[#607089]">请假审批 1.0</p>
        <h2 className="mt-1 text-xl font-semibold text-[#17202f]">真实审批链路已启用</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">
          当前版本已支持真实请假申请、审批待办与结果回显。当前生效模板：{data.activeTemplateName ?? "暂未配置"}。
        </p>
        <Link href="/leave/apply" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#184e77] py-3 text-sm font-medium text-white">
          发起请假申请
        </Link>
      </section>

      <Section title="我的审批">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[#eef7f0] p-3">
            <p className="text-[#607089]">我的申请</p>
            <p className="mt-1 text-2xl font-semibold text-[#17202f]">{data.myRequests.length}</p>
          </div>
          <div className="rounded-xl bg-[#fff5f5] p-3">
            <p className="text-[#607089]">待我处理</p>
            <p className="mt-1 text-2xl font-semibold text-[#17202f]">{data.pendingApprovals.length}</p>
          </div>
        </div>
      </Section>

      <div className="flex gap-2">
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
          我的申请
        </TabButton>
        <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
          待我审批
        </TabButton>
      </div>

      <Section
        title={tab === "mine" ? "请假申请记录" : "审批待办"}
        right={
          data.viewer.roles.includes("admin") || data.viewer.roles.includes("hr") ? (
            <Link href="/admin/approval" className="text-sm text-[#184e77]">
              模板管理
            </Link>
          ) : null
        }
      >
        <div className="space-y-3">
          {(tab === "mine" ? data.myRequests : data.pendingApprovals).length > 0 ? (
            (tab === "mine" ? data.myRequests : data.pendingApprovals).map((item) => (
              <Link key={item.id} href={`/approval/${item.id}`} className="block rounded-2xl bg-[#f6f8fb] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#17202f]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#607089]">
                      {item.requesterName}
                      {item.requesterDepartment ? ` · ${item.requesterDepartment}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[#526174]">
                  <p>请假类型：{item.payload.leaveType}</p>
                  <p>天数：{item.payload.days}</p>
                  <p>开始：{item.payload.startDate}</p>
                  <p>结束：{item.payload.endDate}</p>
                </div>
                <p className="mt-3 text-sm text-[#607089]">当前节点：{item.currentStepName ?? "已完成"}</p>
                {item.currentApproverName ? <p className="mt-1 text-sm text-[#607089]">处理人：{item.currentApproverName}</p> : null}
                <p className="mt-2 text-xs text-[#8a97a8]">提交时间：{formatDateTime(item.submittedAt)}</p>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d9dee8] bg-[#fbfcfd] p-4 text-sm leading-6 text-[#607089]">
              {tab === "mine" ? "当前还没有请假申请记录，可以先发起一条请假申请。" : "当前没有需要你处理的审批待办。"}
            </div>
          )}
        </div>
      </Section>
    </MobileShell>
  );
}

function StatusBadge({ status }: { status: ApprovalRequestStatus }) {
  return (
    <span
      className={cx(
        "rounded-full px-2 py-1 text-xs font-medium",
        status === "approved"
          ? "bg-[#eef7f0] text-[#2d6a4f]"
          : status === "rejected"
            ? "bg-[#fff5f5] text-[#c1121f]"
            : "bg-[#e6eef5] text-[#184e77]",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "未提交";
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
