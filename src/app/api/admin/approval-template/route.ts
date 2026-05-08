import { NextResponse } from "next/server";
import { saveApprovalTemplate } from "@/features/approval/approval-service";
import type { ApprovalTemplateForm } from "@/features/approval/approval-model";

export async function POST(request: Request) {
  const body = (await request.json()) as ApprovalTemplateForm;
  const result = await saveApprovalTemplate(body);

  if (result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录后再保存审批模板。" }, { status: 401 });
  }

  if (result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ templateId: result.templateId });
}
