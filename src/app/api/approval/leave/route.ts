import { NextResponse } from "next/server";
import { submitLeaveApproval } from "@/features/approval/approval-service";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    days?: number;
    reason?: string;
  };

  const result = await submitLeaveApproval({
    leaveType: String(body.leaveType ?? ""),
    startDate: String(body.startDate ?? ""),
    endDate: String(body.endDate ?? ""),
    days: Number(body.days ?? 0),
    reason: String(body.reason ?? ""),
  });

  if (result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录后再提交请假申请。" }, { status: 401 });
  }

  if (result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ requestId: result.requestId });
}
