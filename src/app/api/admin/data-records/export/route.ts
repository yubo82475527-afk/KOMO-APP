import { NextResponse } from "next/server";
import { exportAdminDataCsv, normalizeAdminDataset } from "@/features/admin-data/admin-data-service";

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
  };
  const result = await exportAdminDataCsv(filters);

  if (result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  if (result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return new Response(`\uFEFF${result.csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
    },
  });
}
