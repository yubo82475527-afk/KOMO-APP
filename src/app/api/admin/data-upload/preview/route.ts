import { NextResponse } from "next/server";
import { getAdminDataContext, getAdminViewConfig, normalizeAdminDataset, parseAdminDataCsv } from "@/features/admin-data/admin-data-service";

export async function POST(request: Request) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return NextResponse.json({ error: context.state === "signed_out" ? "请先登录。" : context.message }, { status: context.state === "signed_out" ? 401 : 403 });
  }

  const body = (await request.json()) as { dataset?: string; fileName?: string; csvText?: string };
  const dataset = normalizeAdminDataset(body.dataset);
  const config = await getAdminViewConfig(dataset, context.adminClient);
  const preview = parseAdminDataCsv({
    dataset,
    fileName: body.fileName ?? "data.csv",
    csvText: body.csvText ?? "",
    config,
  });

  return NextResponse.json(preview);
}
