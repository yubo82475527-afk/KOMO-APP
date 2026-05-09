"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/date-time";
import { formatMessage, getDictionary } from "@/lib/i18n";
import { AppLink } from "@/components/ui/app-link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import { TabButton } from "@/components/ui/tab-button";
import type { ApprovalPageReadyData, ApprovalRequestStatus } from "./approval-model";

type ApprovalTab = "mine" | "pending";

export function ApprovalView({ data }: { data: ApprovalPageReadyData }) {
  const dictionary = getDictionary(data.locale);
  const [tab, setTab] = useState<ApprovalTab>("mine");
  const currentItems = tab === "mine" ? data.myRequests : data.pendingApprovals;

  return (
    <MobileShell active="approval" locale={data.locale}>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm text-[#607089]">{dictionary.approval.moduleTag}</p>
        <h2 className="mt-1 text-xl font-semibold text-[#17202f]">{dictionary.approval.moduleTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">
          {formatMessage(dictionary.approval.moduleDescription, { template: data.activeTemplateName ?? dictionary.approval.noTemplate })}
        </p>
        <AppLink
          href="/leave/apply"
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#184e77] py-3 text-sm font-medium text-white transition"
          pendingClassName="bg-[#326993]"
        >
          {dictionary.approval.createLeaveRequest}
        </AppLink>
      </section>

      <Section title={dictionary.approval.myApproval}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[#eef7f0] p-3">
            <p className="text-[#607089]">{dictionary.approval.myRequests}</p>
            <p className="mt-1 text-2xl font-semibold text-[#17202f]">{data.myRequests.length}</p>
          </div>
          <div className="rounded-xl bg-[#fff5f5] p-3">
            <p className="text-[#607089]">{dictionary.approval.pendingMine}</p>
            <p className="mt-1 text-2xl font-semibold text-[#17202f]">{data.pendingApprovals.length}</p>
          </div>
        </div>
      </Section>

      <div className="flex gap-2">
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
          {dictionary.approval.mineTab}
        </TabButton>
        <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
          {dictionary.approval.pendingTab}
        </TabButton>
      </div>

      <Section
        title={tab === "mine" ? dictionary.approval.requestRecords : dictionary.approval.pendingRecords}
        right={
          data.viewer.roles.includes("admin") || data.viewer.roles.includes("hr") ? (
            <AppLink href="/admin/approval" className="text-sm text-[#184e77]" pendingClassName="opacity-70">
              {dictionary.approval.templateManage}
            </AppLink>
          ) : null
        }
      >
        <div className="space-y-3">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <AppLink
                key={item.id}
                href={`/approval/${item.id}`}
                className="block rounded-2xl bg-[#f6f8fb] p-4 transition"
                pendingClassName="scale-[0.99] bg-[#eef2f6]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#17202f]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#607089]">
                      {item.requesterName}
                      {item.requesterDepartment ? ` 路 ${item.requesterDepartment}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={item.status} locale={data.locale} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[#526174]">
                  <p>
                    {dictionary.approval.leaveType}: {item.payload.leaveType}
                  </p>
                  <p>
                    {dictionary.approval.days}: {item.payload.days}
                  </p>
                  <p>
                    {dictionary.approval.startDate}: {item.payload.startDate}
                  </p>
                  <p>
                    {dictionary.approval.endDate}: {item.payload.endDate}
                  </p>
                </div>
                <p className="mt-3 text-sm text-[#607089]">
                  {dictionary.approval.currentStep}: {item.currentStepName ?? dictionary.common.notSet}
                </p>
                {item.currentApproverName ? (
                  <p className="mt-1 text-sm text-[#607089]">
                    {dictionary.approval.currentApprover}: {item.currentApproverName}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-[#8a97a8]">
                  {dictionary.approval.submittedAt}:{" "}
                  {item.submittedAt
                    ? formatDateTime(item.submittedAt, data.locale, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
                    : dictionary.common.notSet}
                </p>
              </AppLink>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d9dee8] bg-[#fbfcfd] p-4 text-sm leading-6 text-[#607089]">
              {tab === "mine" ? dictionary.approval.noMine : dictionary.approval.noPending}
            </div>
          )}
        </div>
      </Section>
    </MobileShell>
  );
}

function StatusBadge({ status, locale }: { status: ApprovalRequestStatus; locale: ApprovalPageReadyData["locale"] }) {
  const dictionary = getDictionary(locale);
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
      {dictionary.approval.statuses[status]}
    </span>
  );
}
