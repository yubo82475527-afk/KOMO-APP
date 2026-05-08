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
    <div className="min-h-screen bg-[#eef2f6] px-3 py-4 text-[#17202f]">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-[430px] overflow-hidden rounded-[28px] border border-[#ccd5df] bg-[#f8fafc] shadow-xl">
        <header className="sticky top-0 z-20 border-b border-[#d9dee8] bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#607089]">OA System</p>
              <h1 className="text-xl font-semibold">{titles[active]}</h1>
            </div>
            {active === "adminSchedule" || active === "adminApproval" ? (
              <Link href="/" className="rounded-full bg-[#e6eef5] px-3 py-2 text-xs font-medium text-[#184e77]">
                返回 App
              </Link>
            ) : (
              <Link href="/admin/schedule" className="rounded-full bg-[#e6eef5] px-3 py-2 text-xs font-medium text-[#184e77]">
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
    <nav className="fixed bottom-4 left-1/2 z-30 grid w-[min(430px,calc(100vw-1.5rem))] -translate-x-1/2 grid-cols-5 rounded-t-3xl border border-[#d9dee8] bg-white px-2 py-2 shadow-lg">
      {navItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cx(
            "rounded-2xl px-1 py-2 text-center text-xs font-medium",
            active === item.key ? "bg-[#184e77] text-white" : "text-[#607089]",
          )}
        >
          <span className="block text-lg leading-5">{item.label.slice(0, 1)}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
