"use client";

import Link from "next/link";
import { cx } from "@/components/ui/class-name";
import type { MainView } from "@/features/shared/types";
import { getDictionary, type SupportedLocale } from "@/lib/i18n";

type MobileShellProps = {
  active: MainView;
  locale?: SupportedLocale;
  children: React.ReactNode;
};

export function MobileShell({ active, locale = "zh-CN", children }: MobileShellProps) {
  const dictionary = getDictionary(locale);
  const titles: Record<MainView, string> = {
    home: dictionary.nav.home,
    approval: dictionary.nav.approval,
    schedule: dictionary.nav.schedule,
    checkin: dictionary.nav.checkin,
    profile: dictionary.nav.profile,
    adminSchedule: dictionary.nav.adminSchedule,
    adminApproval: dictionary.nav.adminApproval,
  };

  const navItems: Array<{ key: MainView; label: string; href: string }> = [
    { key: "home", label: dictionary.nav.home, href: "/" },
    { key: "approval", label: dictionary.nav.approval, href: "/approval" },
    { key: "schedule", label: dictionary.nav.schedule, href: "/schedule" },
    { key: "checkin", label: dictionary.nav.checkin, href: "/checkin" },
    { key: "profile", label: dictionary.nav.profile, href: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff6ec_0,_#f5efe7_34%,_#efe7dc_100%)] px-3 py-4 text-[#17202f]">
      <div className="relative mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[430px] flex-col overflow-hidden rounded-[30px] border border-[#dccfbe] bg-[#fcfaf7] shadow-[0_18px_60px_rgba(82,58,36,0.16)]">
        <header className="sticky top-0 z-20 border-b border-[#eadfce] bg-[#fcfaf7]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b3d]">KOMO</p>
              <h1 className="text-xl font-semibold text-[#17202f]">{titles[active]}</h1>
            </div>
            {active === "adminSchedule" || active === "adminApproval" ? (
              <Link href="/" className="rounded-full bg-[#f0e5d7] px-3 py-2 text-xs font-medium text-[#8a5a2f]">
                {dictionary.common.backToWorkspace}
              </Link>
            ) : (
              <Link href="/admin/schedule" className="rounded-full bg-[#f0e5d7] px-3 py-2 text-xs font-medium text-[#8a5a2f]">
                {dictionary.common.adminPortal}
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-24 pt-4">{children}</main>
        {active !== "adminSchedule" && active !== "adminApproval" && <BottomNav active={active} navItems={navItems} />}
      </div>
    </div>
  );
}

function BottomNav({ active, navItems }: { active: MainView; navItems: Array<{ key: MainView; label: string; href: string }> }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-4">
      <nav className="pointer-events-auto grid grid-cols-5 rounded-3xl border border-[#eadfce] bg-[#fffdf9] px-2 py-2 shadow-[0_10px_32px_rgba(82,58,36,0.14)]">
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
    </div>
  );
}
