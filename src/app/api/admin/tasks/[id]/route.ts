import { NextResponse } from "next/server";
import { updateOpsTask } from "@/features/admin-ops/ops-service";
import type { UpdateOpsTaskInput } from "@/features/admin-ops/ops-model";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as UpdateOpsTaskInput;
  const result = await updateOpsTask(id, body);

  if (result.state === "signed_out") return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  if (result.state === "error") return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json(result);
}
