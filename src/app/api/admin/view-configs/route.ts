import { NextResponse } from "next/server";
import { getAdminDataContext, getAdminViewConfigs, normalizeAdminDataset, saveAdminViewConfig } from "@/features/admin-data/admin-data-service";
import type { AdminViewConfig } from "@/features/admin-data/admin-data-model";

export async function GET() {
  const context = await getAdminDataContext();
  if (context.state !== "ready") {
    return NextResponse.json({ error: context.state === "signed_out" ? "请先登录。" : context.message }, { status: context.state === "signed_out" ? 401 : 403 });
  }

  return NextResponse.json(await getAdminViewConfigs(context.adminClient));
}

export async function POST(request: Request) {
  const body = (await request.json()) as { dataset?: string; config?: AdminViewConfig };
  const dataset = normalizeAdminDataset(body.dataset);
  const result = await saveAdminViewConfig({
    dataset,
    config: body.config ?? ({ dataset } as AdminViewConfig),
  });

  if (result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  if (result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
