import { cache } from "react";
import type { Database } from "@/lib/database.types";
import { defaultLocale, isSupportedLocale, type SupportedLocale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findProfileForUser } from "./profile-resolution";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AuthenticatedAppContext =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      adminClient: AdminClient;
      user: {
        id: string;
        email: string | null;
      };
      profile: ProfileRow;
      departmentName: string | null;
      roles: string[];
      locale: SupportedLocale;
    };

export const getAuthenticatedAppContext = cache(async (): Promise<AuthenticatedAppContext> => {
  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (isMissingSessionError(userError)) {
    return { state: "signed_out" };
  }

  if (userError) {
    return { state: "error", message: userError.message };
  }

  if (!user) {
    return { state: "signed_out" };
  }

  const profileResult = await findProfileForUser(adminClient, user.id, user.email ?? null);
  if (profileResult.state === "error") {
    return profileResult;
  }

  const profile = profileResult.profile;
  const [departmentName, roles] = await Promise.all([getDepartmentName(adminClient, profile.department_id), getRoleCodes(adminClient, profile.id)]);
  const requestLocale = await getRequestLocale();
  const locale = isSupportedLocale(profile.preferred_locale) ? profile.preferred_locale : requestLocale ?? defaultLocale;

  return {
    state: "ready",
    adminClient,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile,
    departmentName,
    roles,
    locale,
  };
});

async function getDepartmentName(adminClient: AdminClient, departmentId: string | null) {
  if (!departmentId) return null;
  const { data: department } = await adminClient.from("departments").select("name").eq("id", departmentId).maybeSingle();
  return department?.name ?? null;
}

async function getRoleCodes(adminClient: AdminClient, profileId: string) {
  const { data } = await adminClient.from("user_roles").select("roles!inner(code)").eq("profile_id", profileId);
  return (
    data?.flatMap((row) => {
      const role = (row as { roles?: { code?: string } | Array<{ code?: string }> }).roles;
      return Array.isArray(role)
        ? role.map((item) => item.code).filter((code): code is string => Boolean(code))
        : role?.code
          ? [role.code]
          : [];
    }) ?? []
  );
}

function isMissingSessionError(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return (
    message.includes("Auth session missing") ||
    message.includes("Invalid Refresh Token") ||
    message.includes("Refresh Token Not Found")
  );
}
