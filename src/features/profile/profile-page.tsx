import { MobileShell } from "@/components/layout/mobile-shell";
import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getAppViewer } from "@/features/auth/viewer";
import { ProfileView } from "./profile-view";

export async function ProfilePageView() {
  const viewer = await getAppViewer();

  if (viewer.state === "signed_out") {
    return <SignedOutState active="profile" redirectTo="/profile" title="登录后查看个人资料" description="个人页会展示真实 Supabase 用户和员工档案，并支持退出登录。" />;
  }

  if (viewer.state === "error") {
    return <ErrorState active="profile" title="暂时无法加载个人资料" message={viewer.message} />;
  }

  return (
    <MobileShell active="profile">
      <ProfileView viewer={viewer} />
    </MobileShell>
  );
}
