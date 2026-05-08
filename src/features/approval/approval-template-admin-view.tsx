"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import type { ApprovalTemplateAdminData, ApprovalTemplateForm, ApproverType } from "./approval-model";

const approverTypeOptions: Array<{ value: ApproverType; label: string }> = [
  { value: "direct_manager", label: "直属主管" },
  { value: "department_head", label: "部门负责人" },
  { value: "role", label: "指定角色" },
  { value: "user", label: "指定人员" },
];

export function ApprovalTemplateAdminView({
  data,
}: {
  data: Extract<ApprovalTemplateAdminData, { state: "ready" }>;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState<ApprovalTemplateForm>(data.template);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function updateStep(index: number, patch: Partial<ApprovalTemplateForm["steps"][number]>) {
    setTemplate((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)),
    }));
  }

  function removeStep(index: number) {
    setTemplate((current) => ({
      ...current,
      steps: current.steps.filter((_, stepIndex) => stepIndex !== index).map((step, stepIndex) => ({ ...step, stepOrder: stepIndex + 1 })),
    }));
  }

  function addStep() {
    setTemplate((current) => ({
      ...current,
      steps: [
        ...current.steps,
        {
          id: `temp-${Date.now()}`,
          stepOrder: current.steps.length + 1,
          name: `第 ${current.steps.length + 1} 级审批`,
          approverType: "direct_manager",
          roleCode: null,
          approverId: null,
        },
      ],
    }));
  }

  async function save() {
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/admin/approval-template", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "审批模板保存失败。");
      return;
    }

    setStatus("success");
    setMessage("审批模板已保存，新提交的请假申请会按此流程流转。");
    router.refresh();
  }

  return (
    <MobileShell active="adminApproval">
      <Section title="审批模板">
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-[#607089]">模板名称</span>
            <input value={template.name} onChange={(event) => setTemplate({ ...template, name: event.target.value })} className="mt-2 w-full rounded-xl border border-[#d9dee8] px-3 py-3 text-sm" />
          </label>
          <div className="rounded-xl bg-[#eef7f0] p-3 text-sm text-[#2d6a4f]">当前模板只影响新提交的请假申请，已在流转中的审批不会被回写。</div>
        </div>
      </Section>

      <Section title="审批节点">
        <div className="space-y-3">
          {template.steps.map((step, index) => (
            <div key={step.id} className="rounded-2xl bg-[#f6f8fb] p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">第 {index + 1} 级</p>
                <button type="button" onClick={() => removeStep(index)} className="text-sm text-[#c1121f]">
                  删除
                </button>
              </div>
              <input value={step.name} onChange={(event) => updateStep(index, { name: event.target.value })} className="w-full rounded-xl border border-[#d9dee8] px-3 py-2 text-sm" />
              <select value={step.approverType} onChange={(event) => updateStep(index, { approverType: event.target.value as ApproverType, roleCode: null, approverId: null })} className="mt-2 w-full rounded-xl border border-[#d9dee8] bg-white px-3 py-2 text-sm">
                {approverTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {step.approverType === "role" ? (
                <select value={step.roleCode ?? "hr"} onChange={(event) => updateStep(index, { roleCode: event.target.value })} className="mt-2 w-full rounded-xl border border-[#d9dee8] bg-white px-3 py-2 text-sm">
                  <option value="hr">HR</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              ) : null}
              {step.approverType === "user" ? (
                <select value={step.approverId ?? ""} onChange={(event) => updateStep(index, { approverId: event.target.value || null })} className="mt-2 w-full rounded-xl border border-[#d9dee8] bg-white px-3 py-2 text-sm">
                  <option value="">请选择审批人</option>
                  {data.userOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                      {user.departmentName ? ` · ${user.departmentName}` : ""}
                      {user.employeeNo ? ` · ${user.employeeNo}` : ""}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-3 w-full rounded-xl bg-[#e6eef5] py-3 text-sm font-medium text-[#184e77]">
          新增节点
        </button>
      </Section>

      {message ? <div className={cx("rounded-2xl p-4 text-center text-sm", status === "success" ? "bg-[#eef7f0] text-[#2d6a4f]" : "bg-[#fff5f5] text-[#c1121f]")}>{message}</div> : null}

      <button type="button" disabled={status === "saving"} onClick={() => void save()} className="w-full rounded-2xl bg-[#184e77] py-4 font-semibold text-white shadow-sm disabled:bg-[#8a97a8]">
        {status === "saving" ? "保存中..." : "保存模板"}
      </button>
    </MobileShell>
  );
}
