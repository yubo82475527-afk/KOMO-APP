import { NextResponse } from "next/server";
import { actOnApprovalRequest } from "@/features/approval/approval-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    action?: "approved" | "rejected";
    comment?: string;
  };

  if (body.action !== "approved" && body.action !== "rejected") {
    return NextResponse.json({ error: "审批动作无效。" }, { status: 400 });
  }

  const result = await actOnApprovalRequest(id, body.action, String(body.comment ?? ""));

  if (result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录后再处理审批。" }, { status: 401 });
  }

  if (result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
