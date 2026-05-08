import type { Database } from "@/lib/database.types";
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
    };

export async function getAuthenticatedAppContext(): Promise<AuthenticatedAppContext> {
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

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, employee_no, full_name, email, department_id, manager_id, status, created_at")
    .eq("id", profileResult.profile.id)
    .single<ProfileRow>();

  if (profileError || !profile) {
    return { state: "error", message: profileError?.message ?? "当前账号没有关联员工档案。" };
  }

  const [departmentName, roles] = await Promise.all([getDepartmentName(adminClient, profile.department_id), getRoleCodes(adminClient, profile.id)]);

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
  };
}

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
  return error?.message?.includes("Auth session missing") ?? false;
}
