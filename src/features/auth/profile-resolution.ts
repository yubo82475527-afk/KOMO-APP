import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ResolvedProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const profileColumns = "id, employee_no, full_name, email, department_id, manager_id, preferred_locale, status, created_at";
const fallbackProfileColumns = "id, employee_no, full_name, email, department_id, manager_id, status, created_at";

type ProfileLookupResult = {
  data: ResolvedProfileRow | null;
  error: { message?: string } | null;
};

export async function findProfileForUser(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  email: string | null,
): Promise<{ state: "ready"; profile: ResolvedProfileRow } | { state: "error"; message: string }> {
  const { data: profileById, error: profileByIdError } = await selectProfile(adminClient, "id", userId);

  if (profileByIdError) {
    return { state: "error", message: profileByIdError.message ?? "Failed to load employee profile." };
  }

  if (profileById) {
    return { state: "ready", profile: profileById };
  }

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: profileByEmail, error: profileByEmailError } = await selectProfile(adminClient, "email", normalizedEmail);

    if (profileByEmailError) {
      return { state: "error", message: profileByEmailError.message ?? "Failed to load employee profile." };
    }

    if (profileByEmail) {
      return {
        state: "error",
        message: `当前账号已登录成功，但 profiles.id 与 Auth 用户 id 不一致。请将 profiles.id 改成当前 Auth 用户 id：${userId}。当前 profiles.id 是：${profileByEmail.id}。`,
      };
    }
  }

  return {
    state: "error",
    message: `当前登录账号还没有关联员工档案。请在 profiles 表中插入 id = ${userId} 的记录${email ? `，邮箱建议填写 ${email}` : ""}。`,
  };
}

async function selectProfile(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  field: "id" | "email",
  value: string,
): Promise<ProfileLookupResult> {
  const query = adminClient.from("profiles").select(profileColumns);
  const result =
    field === "id"
      ? await query.eq("id", value).maybeSingle<ResolvedProfileRow>()
      : await query.ilike("email", value).maybeSingle<ResolvedProfileRow>();

  if (!isMissingPreferredLocaleColumn(result.error)) {
    return result;
  }

  const fallbackQuery = adminClient.from("profiles").select(fallbackProfileColumns);
  const fallbackResult =
    field === "id"
      ? await fallbackQuery.eq("id", value).maybeSingle<Omit<ResolvedProfileRow, "preferred_locale">>()
      : await fallbackQuery.ilike("email", value).maybeSingle<Omit<ResolvedProfileRow, "preferred_locale">>();

  return {
    data: fallbackResult.data ? { ...fallbackResult.data, preferred_locale: null } : null,
    error: fallbackResult.error,
  };
}

function isMissingPreferredLocaleColumn(error: { message?: string } | null) {
  return error?.message?.includes("preferred_locale") ?? false;
}
