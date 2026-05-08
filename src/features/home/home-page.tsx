import { MobileShell } from "@/components/layout/mobile-shell";
import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getAppViewer } from "@/features/auth/viewer";
import { HomeView } from "./home-view";

export async function HomePageView() {
  const viewer = await getAppViewer();

  if (viewer.state === "signed_out") {
    return <SignedOutState active="home" redirectTo="/" title="登录后进入 OA 首页" description="当前首页已经切换到真实 Supabase 用户，不再展示虚拟账号。" />;
  }

  if (viewer.state === "error") {
    return <ErrorState active="home" title="暂时无法加载首页" message={viewer.message} />;
  }

  return (
    <MobileShell active="home">
      <HomeView viewer={viewer} />
    </MobileShell>
  );
}
