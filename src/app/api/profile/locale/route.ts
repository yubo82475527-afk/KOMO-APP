import { NextResponse } from "next/server";
import { isSupportedLocale } from "@/lib/i18n";
import { LOCALE_COOKIE_NAME } from "@/lib/locale-cookie";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedAppContext } from "@/features/auth/app-context";

export async function POST(request: Request) {
  const context = await getAuthenticatedAppContext();
  if (context.state === "signed_out") {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  if (context.state === "error") {
    return NextResponse.json({ error: context.message }, { status: 400 });
  }

  const payload = (await request.json()) as { preferredLocale?: string | null };
  const preferredLocale = payload.preferredLocale ?? null;

  if (preferredLocale !== null && !isSupportedLocale(preferredLocale)) {
    return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("profiles").update({ preferred_locale: preferredLocale }).eq("id", context.profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ preferredLocale });
  if (preferredLocale) {
    response.cookies.set(LOCALE_COOKIE_NAME, preferredLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    response.cookies.delete(LOCALE_COOKIE_NAME);
  }

  return response;
}
