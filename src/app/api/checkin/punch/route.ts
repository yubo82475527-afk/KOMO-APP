import { NextResponse } from "next/server";
import { punchAttendance } from "@/features/checkin/checkin-service";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    punchType?: "in" | "out";
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    address?: string | null;
    deviceInfo?: Record<string, unknown>;
  };

  if (body.punchType !== "in" && body.punchType !== "out") {
    return NextResponse.json({ error: "打卡类型无效。" }, { status: 400 });
  }

  const result = await punchAttendance({
    punchType: body.punchType,
    latitude: typeof body.latitude === "number" ? body.latitude : null,
    longitude: typeof body.longitude === "number" ? body.longitude : null,
    accuracy: typeof body.accuracy === "number" ? body.accuracy : null,
    address: typeof body.address === "string" ? body.address : null,
    deviceInfo: body.deviceInfo ?? {},
  });

  if (result.state === "signed_out") {
    return NextResponse.json({ error: "请先登录后再打卡。" }, { status: 401 });
  }

  if (result.state === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ today: result.today });
}
