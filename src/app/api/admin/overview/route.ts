import { NextResponse } from "next/server";
import { getOpsOverviewData } from "@/features/admin-ops/ops-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await getOpsOverviewData({
    preset: searchParams.get("preset") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    scopeDepartmentId: searchParams.get("scopeDepartmentId") || undefined,
  });

  if ("state" in result && result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }
  if ("state" in result && result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
