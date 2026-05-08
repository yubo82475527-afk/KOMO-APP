import { MobileShell } from "@/components/layout/mobile-shell";
import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getAppViewer } from "@/features/auth/viewer";
import { AdminScheduleView } from "./admin-schedule-view";

export async function AdminSchedulePageView() {
  const viewer = await getAppViewer();

  if (viewer.state === "signed_out") {
    return (
      <SignedOutState
        active="adminSchedule"
        redirectTo="/admin/schedule"
        title="登录后进入排班管理"
        description="管理端导入排班依赖真实 Supabase 登录态和角色权限。"
      />
    );
  }

  if (viewer.state === "error") {
    return <ErrorState active="adminSchedule" title="暂时无法进入排班管理" message={viewer.message} />;
  }

  if (!viewer.roles.includes("admin") && !viewer.roles.includes("hr")) {
    return <ErrorState active="adminSchedule" title="当前账号没有导入权限" message="请在 Supabase 的 user_roles 表中为当前用户分配 admin 或 hr 角色后再试。" />;
  }

  return (
    <MobileShell active="adminSchedule">
      <AdminScheduleView />
    </MobileShell>
  );
}
