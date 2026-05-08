"use client";

import Link from "next/link";
import { cx } from "@/components/ui/class-name";
import type { MainView } from "@/features/shared/types";

const titles: Record<MainView, string> = {
  home: "首页",
  approval: "审批",
  schedule: "排班",
  checkin: "打卡",
  profile: "我的",
  adminSchedule: "排班管理",
  adminApproval: "审批配置",
};

const navItems: Array<{ key: MainView; label: string; href: string }> = [
  { key: "home", label: "首页", href: "/" },
  { key: "approval", label: "审批", href: "/approval" },
  { key: "schedule", label: "排班", href: "/schedule" },
  { key: "checkin", label: "打卡", href: "/checkin" },
  { key: "profile", label: "我的", href: "/profile" },
];

type MobileShellProps = {
  active: MainView;
  children: React.ReactNode;
};

export function MobileShell({ active, children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff6ec_0,_#f5efe7_34%,_#efe7dc_100%)] px-3 py-4 text-[#17202f]">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-[430px] overflow-hidden rounded-[30px] border border-[#dccfbe] bg-[#fcfaf7] shadow-[0_18px_60px_rgba(82,58,36,0.16)]">
        <header className="sticky top-0 z-20 border-b border-[#eadfce] bg-[#fcfaf7]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b3d]">KOMO</p>
              <h1 className="text-xl font-semibold text-[#17202f]">{titles[active]}</h1>
            </div>
            {active === "adminSchedule" || active === "adminApproval" ? (
              <Link href="/" className="rounded-full bg-[#f0e5d7] px-3 py-2 text-xs font-medium text-[#8a5a2f]">
                返回工作台
              </Link>
            ) : (
              <Link href="/admin/schedule" className="rounded-full bg-[#f0e5d7] px-3 py-2 text-xs font-medium text-[#8a5a2f]">
                管理端
              </Link>
            )}
          </div>
        </header>

        <main className="min-h-[760px] space-y-4 px-4 pb-24 pt-4">{children}</main>
        {active !== "adminSchedule" && active !== "adminApproval" && <BottomNav active={active} />}
      </div>
    </div>
  );
}

function BottomNav({ active }: { active: MainView }) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-30 grid w-[min(430px,calc(100vw-1.5rem))] -translate-x-1/2 grid-cols-5 rounded-t-3xl border border-[#eadfce] bg-[#fffdf9] px-2 py-2 shadow-[0_10px_32px_rgba(82,58,36,0.14)]">
      {navItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cx(
            "rounded-2xl px-1 py-2 text-center text-xs font-medium transition",
            active === item.key ? "bg-[#8a5a2f] text-white" : "text-[#7b6c5c]",
          )}
        >
          <span className="block text-lg leading-5">{item.label.slice(0, 1)}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
