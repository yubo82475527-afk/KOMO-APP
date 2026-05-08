import { ErrorState, SignedOutState } from "@/features/auth/access-state";
import { getCheckinPageData } from "./checkin-service";
import { CheckinView } from "./checkin-view";

export async function CheckinPageView() {
  const data = await getCheckinPageData();

  if (data.state === "signed_out") {
    return <SignedOutState active="checkin" redirectTo="/checkin" title="登录后进入打卡" description="KOMO 打卡中心需要真实账号登录后使用。" />;
  }

  if (data.state === "error") {
    return <ErrorState active="checkin" title="暂时无法加载打卡页面" message={data.message} />;
  }

  return <CheckinView data={data} />;
}
