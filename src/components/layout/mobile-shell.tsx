"use client";

import { AppLink } from "@/components/ui/app-link";
import { cx } from "@/components/ui/class-name";
import { clearPendingNavigation, getPendingNavigationServerSnapshot, getPendingNavigationSnapshot, subscribePendingNavigation } from "@/components/ui/navigation-pending";
import { PageShellSkeletonContent } from "@/components/ui/page-shell-skeleton-content";
import type { MainView } from "@/features/shared/types";
import { getDictionary, type SupportedLocale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

type MobileShellProps = {
  active: MainView;
  locale?: SupportedLocale;
  children: React.ReactNode;
};

type NavItem = {
  key: MainView;
  label: string;
  href: string;
};

const shellPrefetchedRoutes = new Set<string>();
const shellPrefetchRoutes = ["/", "/approval", "/schedule", "/checkin", "/profile", "/admin/schedule"];

export function MobileShell({ active, locale = "zh-CN", children }: MobileShellProps) {
  const router = useRouter();
  const pendingNavigation = useSyncExternalStore(subscribePendingNavigation, getPendingNavigationSnapshot, getPendingNavigationServerSnapshot);
  const optimisticActive = pendingNavigation && pendingNavigation.view !== active ? pendingNavigation.view : active;
  const isOptimisticLoading = optimisticActive !== active;
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

  const navItems: NavItem[] = [
    { key: "home", label: dictionary.nav.home, href: "/" },
    { key: "approval", label: dictionary.nav.approval, href: "/approval" },
    { key: "schedule", label: dictionary.nav.schedule, href: "/schedule" },
    { key: "checkin", label: dictionary.nav.checkin, href: "/checkin" },
    { key: "profile", label: dictionary.nav.profile, href: "/profile" },
  ];

  useEffect(() => {
    if (pendingNavigation?.view === active) {
      clearPendingNavigation();
    }
  }, [active, pendingNavigation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      shellPrefetchRoutes.forEach((href) => {
        if (shellPrefetchedRoutes.has(href)) return;
        shellPrefetchedRoutes.add(href);
        router.prefetch(href);
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_#fff8ef_0,_#f6efe6_38%,_#ebe2d6_100%)] px-3 py-3 text-[#17202f]">
      <div className="relative mx-auto flex h-[calc(100dvh-1.5rem)] max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-white/65 bg-[#fcfaf7] shadow-[0_20px_70px_rgba(82,58,36,0.18)] ring-1 ring-[#d8cab7]/70">
        <header className="sticky top-0 z-20 border-b border-[#ecdfcf] bg-[linear-gradient(180deg,rgba(255,253,249,0.98)_0%,rgba(252,250,247,0.92)_100%)] px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-center">
            <span className="h-1.5 w-14 rounded-full bg-[#d8c8b4]" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a87847]">KOMO WORKSPACE</p>
              <h1 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] text-[#17202f]">{titles[optimisticActive]}</h1>
            </div>
            {active === "adminSchedule" || active === "adminApproval" ? (
              <AppLink
                href="/"
                className="inline-flex min-h-11 items-center rounded-full border border-[#e5d7c4] bg-white/85 px-3.5 py-2 text-xs font-medium text-[#8a5a2f] shadow-[0_6px_18px_rgba(82,58,36,0.08)] transition"
                pendingClassName="scale-[0.98] opacity-70"
              >
                {dictionary.common.backToWorkspace}
              </AppLink>
            ) : (
              <AppLink
                href="/admin/schedule"
                className="inline-flex min-h-11 items-center rounded-full border border-[#e5d7c4] bg-white/85 px-3.5 py-2 text-xs font-medium text-[#8a5a2f] shadow-[0_6px_18px_rgba(82,58,36,0.08)] transition"
                pendingClassName="scale-[0.98] opacity-70"
              >
                {dictionary.common.adminPortal}
              </AppLink>
            )}
          </div>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-32 pt-4 [scrollbar-gutter:stable]">{isOptimisticLoading ? <PageShellSkeletonContent /> : children}</main>
        {active !== "adminSchedule" && active !== "adminApproval" && <BottomNav active={optimisticActive} navItems={navItems} />}
      </div>
    </div>
  );
}

function BottomNav({ active, navItems }: { active: MainView; navItems: NavItem[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#fcfaf7] via-[#fcfaf7]/97 to-transparent px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
      <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(248,243,236,0.96)_100%)] p-2 shadow-[0_18px_42px_rgba(82,58,36,0.16)] backdrop-blur-2xl">
        <nav className="pointer-events-auto grid grid-cols-5 gap-1">
        {navItems.map((item) => (
          <AppLink
            key={item.key}
            href={item.href}
            className={cx(
              "group rounded-[22px] px-1 py-3 text-center transition duration-200",
              active === item.key ? "bg-[#f7ecdf] text-[#8a5a2f]" : "text-[#7b6c5c]",
            )}
            activeClassName="bg-[#f7ecdf] text-[#8a5a2f]"
            pendingClassName="scale-[0.98] bg-[#f3e6d7] text-[#8a5a2f]"
            exact={item.href === "/"}
          >
            <span className={cx("block text-[12px] font-medium leading-5", active === item.key ? "text-[#8a5a2f]" : "text-[#7b6c5c]")}>{item.label}</span>
          </AppLink>
        ))}
        </nav>
        <div className="pointer-events-none mt-2 flex justify-center">
          <span className="h-1.5 w-28 rounded-full bg-[#1b2430]/14" />
        </div>
      </div>
    </div>
  );
}
