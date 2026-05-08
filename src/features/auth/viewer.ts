import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findProfileForUser } from "./profile-resolution";

export type AppViewer =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      user: {
        id: string;
        email: string | null;
      };
      profile: {
        id: string;
        employeeNo: string | null;
        fullName: string;
        departmentName: string | null;
        status: "active" | "disabled";
      };
      roles: string[];
    };

export async function getAppViewer(): Promise<AppViewer> {
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

  let departmentName: string | null = null;
  if (profile.department_id) {
    const { data: department } = await adminClient.from("departments").select("name").eq("id", profile.department_id).maybeSingle();
    departmentName = department?.name ?? null;
  }

  const { data: roleRows, error: roleError } = await adminClient.from("user_roles").select("roles!inner(code)").eq("profile_id", profile.id);
  if (roleError) {
    return { state: "error", message: roleError.message };
  }

  const roles =
    roleRows?.flatMap((row) => {
      const value = (row as { roles?: { code?: string } | Array<{ code?: string }> }).roles;
      return Array.isArray(value)
        ? value.map((item) => item.code).filter((code): code is string => Boolean(code))
        : value?.code
          ? [value.code]
          : [];
    }) ?? [];

  return {
    state: "ready",
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile: {
      id: profile.id,
      employeeNo: profile.employee_no,
      fullName: profile.full_name,
      departmentName,
      status: profile.status,
    },
    roles,
  };
}

function isMissingSessionError(error: { message?: string } | null) {
  return error?.message?.includes("Auth session missing") ?? false;
}
