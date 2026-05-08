import type { NextRequest } from "next/server";
import { completeSupabaseAuthRedirect } from "@/lib/supabase/auth-redirect";

export async function GET(request: NextRequest) {
  return completeSupabaseAuthRedirect(request);
}
