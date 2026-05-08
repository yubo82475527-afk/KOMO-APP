import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ResolvedProfileRow = {
  id: string;
  employee_no: string | null;
  full_name: string;
  email: string | null;
  department_id: string | null;
  status: "active" | "disabled";
  created_at?: string;
};

export async function findProfileForUser(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  email: string | null,
): Promise<{ state: "ready"; profile: ResolvedProfileRow } | { state: "error"; message: string }> {
  const { data: profileById, error: profileByIdError } = await adminClient
    .from("profiles")
    .select("id, employee_no, full_name, email, department_id, status, created_at")
    .eq("id", userId)
    .maybeSingle<ResolvedProfileRow>();

  if (profileByIdError) {
    return { state: "error", message: profileByIdError.message };
  }

  if (profileById) {
    return { state: "ready", profile: profileById };
  }

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: profileByEmail, error: profileByEmailError } = await adminClient
      .from("profiles")
      .select("id, employee_no, full_name, email, department_id, status, created_at")
      .ilike("email", normalizedEmail)
      .maybeSingle<ResolvedProfileRow>();

    if (profileByEmailError) {
      return { state: "error", message: profileByEmailError.message };
    }

    if (profileByEmail) {
      return {
        state: "error",
        message: `当前账号已经登录成功，但 profiles.id 与 Auth 用户 id 不一致。请把 profiles.id 改成当前 Auth 用户 id：${userId}。当前 profiles.id 是：${profileByEmail.id}。`,
      };
    }
  }

  return {
    state: "error",
    message: `当前登录账号还没有关联员工档案。请在 profiles 表中插入 id = ${userId} 的记录${email ? `，邮箱建议填写 ${email}` : ""}。`,
  };
}
