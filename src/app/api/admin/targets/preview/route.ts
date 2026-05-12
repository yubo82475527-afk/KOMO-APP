import { NextResponse } from "next/server";
import { getAdminDataContext, getAdminViewConfig, parseAdminDataCsv } from "@/features/admin-data/admin-data-service";

export async function POST(request: Request) {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return NextResponse.json({ error: context.state === "signed_out" ? "请先登录。" : context.message }, { status: context.state === "signed_out" ? 401 : 403 });
  }

  const body = (await request.json()) as { fileName?: string; csvText?: string };
  const config = await getAdminViewConfig("target", context.adminClient);
  return NextResponse.json(
    parseAdminDataCsv({
      dataset: "target",
      fileName: body.fileName ?? "targets.csv",
      csvText: body.csvText ?? "",
      config,
    }),
  );
}
