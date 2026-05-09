"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime } from "@/lib/date-time";
import { getDictionary } from "@/lib/i18n";
import { AppLink } from "@/components/ui/app-link";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { MobileShell } from "@/components/layout/mobile-shell";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import type { ApprovalDetailPageData, ApprovalRequestStatus } from "./approval-model";

export function ApprovalDetailView({ data }: { data: Extract<ApprovalDetailPageData, { state: "ready" }> }) {
  const dictionary = getDictionary(data.locale);
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
  const [message, setMessage] = useState("");
  const detail = data.detail;
  const statusText: Record<ApprovalRequestStatus, string> = dictionary.approval.statuses;

  async function act(action: "approved" | "rejected") {
    setStatus("submitting");
    setPendingAction(action);
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
      setPendingAction(null);
      setMessage(payload.error ?? dictionary.common.retryLater);
      return;
    }

    setPendingAction(null);
    router.refresh();
  }

  return (
    <MobileShell active="approval" locale={data.locale}>
      <Section
        title={dictionary.approval.detailTitle}
        right={<span className={cx("text-sm font-medium", detail.status === "rejected" ? "text-[#c1121f]" : detail.status === "approved" ? "text-[#2d6a4f]" : "text-[#184e77]")}>{statusText[detail.status]}</span>}
      >
        <div className="space-y-3 text-sm">
          <p className="text-base font-semibold">{detail.title}</p>
          <p>
            {dictionary.approval.applicant}: {detail.requesterName}
            {detail.requesterDepartment ? ` 路 ${detail.requesterDepartment}` : ""}
          </p>
          <p>
            {dictionary.approval.leaveType}: {detail.payload.leaveType}
          </p>
          <p>
            {dictionary.approval.dateRange}: {detail.payload.startDate} - {detail.payload.endDate}
          </p>
          <p>
            {dictionary.approval.days}: {detail.payload.days}
          </p>
          <p className="leading-6">
            {dictionary.approval.reason}: {detail.payload.reason}
          </p>
          <p className="text-[#8a97a8]">
            {dictionary.approval.submittedAt}:{" "}
            {formatDateTime(detail.submittedAt ?? detail.createdAt, data.locale, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        </div>
      </Section>

      <Section title={dictionary.approval.progress}>
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
                <StepBadge status={step.status} locale={data.locale} />
              </div>
              {step.comment ? (
                <p className="mt-2 text-sm text-[#526174]">
                  {dictionary.approval.comment}: {step.comment}
                </p>
              ) : null}
              {step.actedAt ? (
                <p className="mt-1 text-xs text-[#8a97a8]">
                  {formatDateTime(step.actedAt, data.locale, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      {data.canAct ? (
        <Section title={dictionary.approval.action}>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder={dictionary.approval.actionPlaceholder}
            className="w-full resize-none rounded-xl border border-[#d9dee8] px-3 py-3 text-sm"
          />
          {message ? <p className="mt-3 text-sm text-[#c1121f]">{message}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <AsyncActionButton
              idleLabel={dictionary.approval.reject}
              pendingLabel={dictionary.common.loading}
              isPending={pendingAction === "rejected"}
              disabled={status === "submitting"}
              onClick={() => void act("rejected")}
              className="rounded-xl border border-[#c1121f] py-3 text-sm font-medium text-[#c1121f] disabled:opacity-60"
            />
            <AsyncActionButton
              idleLabel={dictionary.approval.approve}
              pendingLabel={dictionary.common.loading}
              isPending={pendingAction === "approved"}
              disabled={status === "submitting"}
              onClick={() => void act("approved")}
              className="rounded-xl bg-[#2d6a4f] py-3 text-sm font-medium text-white disabled:bg-[#8a97a8]"
            />
          </div>
        </Section>
      ) : null}

      <AppLink href="/approval" className="block rounded-2xl bg-white py-3 text-center text-sm font-medium text-[#184e77] shadow-sm transition" pendingClassName="bg-[#f6f8fb]">
        {dictionary.approval.backToList}
      </AppLink>
    </MobileShell>
  );
}

function StepBadge({ status, locale }: { status: string; locale: Extract<ApprovalDetailPageData, { state: "ready" }>["locale"] }) {
  const dictionary = getDictionary(locale);
  const label =
    status === "pending"
      ? dictionary.approval.stepPending
      : status === "approved"
        ? dictionary.approval.stepApproved
        : status === "rejected"
          ? dictionary.approval.stepRejected
          : dictionary.approval.stepWaiting;

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
