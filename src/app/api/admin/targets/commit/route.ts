import { NextResponse } from "next/server";
import { commitAdminDataImport } from "@/features/admin-data/admin-data-service";
import type { AdminDataRecord } from "@/features/admin-data/admin-data-model";

export async function POST(request: Request) {
  const body = (await request.json()) as { fileName?: string; rows?: AdminDataRecord[] };
  const result = await commitAdminDataImport({
    dataset: "target",
    fileName: body.fileName ?? "targets.csv",
    rows: Array.isArray(body.rows) ? body.rows : [],
  });

  if (result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }
  if (result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
