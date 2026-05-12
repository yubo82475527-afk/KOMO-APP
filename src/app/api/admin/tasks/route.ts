import { NextResponse } from "next/server";
import { createOpsTask, listOpsTasks } from "@/features/admin-ops/ops-service";
import type { CreateOpsTaskInput } from "@/features/admin-ops/ops-model";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await listOpsTasks(searchParams.get("date") ?? undefined);
  if (result.state === "signed_out") return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (result.state === "error") return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateOpsTaskInput;
  const result = await createOpsTask(body);
  if (result.state === "signed_out") return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (result.state === "error") return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json(result);
}
