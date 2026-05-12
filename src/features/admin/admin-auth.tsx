import { AdminShell, type AdminNavKey } from "@/components/layout/admin-shell";
import { AuthCard } from "@/features/auth/auth-card";
import { getAppViewer } from "@/features/auth/viewer";

export type AdminViewer = Extract<Awaited<ReturnType<typeof getAppViewer>>, { state: "ready" }>;

type AdminGateResult =
  | { state: "ready"; viewer: AdminViewer }
  | { state: "blocked"; element: React.ReactNode };

const allowedAdminRoles = ["admin", "hr", "manager"];

export async function getAdminGate(active: AdminNavKey, redirectTo: string): Promise<AdminGateResult> {
  const viewer = await getAppViewer();

  if (viewer.state === "signed_out") {
    return {
      state: "blocked",
      element: (
        <AdminShell active={active} viewer={{ fullName: "未登录", roles: [] }}>
          <div className="mx-auto max-w-md rounded-lg border border-[#d7dee7] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">登录后进入管理端</h2>
            <p className="mt-2 text-sm leading-6 text-[#607089]">管理端需要真实账号登录，并具备 admin、hr 或 manager 角色。</p>
            <div className="mt-4">
              <AuthCard redirectTo={redirectTo} />
            </div>
          </div>
        </AdminShell>
      ),
    };
  }

  if (viewer.state === "error") {
    return {
      state: "blocked",
      element: (
        <AdminShell active={active} viewer={{ fullName: "加载失败", roles: [] }}>
          <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">暂时无法进入管理端</h2>
            <p className="mt-2 text-sm leading-6 text-[#607089]">{viewer.message}</p>
          </div>
        </AdminShell>
      ),
    };
  }

  const canUseAdmin = viewer.roles.some((role) => allowedAdminRoles.includes(role));
  if (!canUseAdmin) {
    return {
      state: "blocked",
      element: (
        <AdminShell active={active} viewer={{ fullName: viewer.profile.fullName, roles: viewer.roles }}>
          <div className="rounded-lg border border-[#ffd6d6] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">当前账号没有管理端权限</h2>
            <p className="mt-2 text-sm leading-6 text-[#607089]">请联系管理员为当前账号分配 admin、hr 或 manager 角色。</p>
          </div>
        </AdminShell>
      ),
    };
  }

  return { state: "ready", viewer };
}
