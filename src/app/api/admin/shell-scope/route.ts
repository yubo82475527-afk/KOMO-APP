import { NextResponse } from "next/server";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await getAdminShellScope(searchParams.get("scopeDepartmentId"));

  return NextResponse.json({ scope });
}
