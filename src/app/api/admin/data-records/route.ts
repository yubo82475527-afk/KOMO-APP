import { NextResponse } from "next/server";
import { listAdminDataRecords, normalizeAdminDataset } from "@/features/admin-data/admin-data-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = {
    dataset: normalizeAdminDataset(url.searchParams.get("dataset")),
    reportId: url.searchParams.get("reportId") || undefined,
    startDate: url.searchParams.get("startDate") || undefined,
    endDate: url.searchParams.get("endDate") || undefined,
    orgUnit: url.searchParams.get("orgUnit") || undefined,
    scopeDepartmentId: url.searchParams.get("scopeDepartmentId") || undefined,
    personName: url.searchParams.get("personName") || undefined,
    category: url.searchParams.get("category") || undefined,
    keyword: url.searchParams.get("keyword") || undefined,
    page: Number(url.searchParams.get("page") ?? 1),
    pageSize: Number(url.searchParams.get("pageSize") ?? 20),
  };
  const result = await listAdminDataRecords(filters);

  if ("state" in result) {
    return NextResponse.json({ error: result.state === "signed_out" ? "请先登录。" : result.message }, { status: result.state === "signed_out" ? 401 : 400 });
  }

  return NextResponse.json(result);
}
