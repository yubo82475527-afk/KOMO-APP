"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppLink } from "@/components/ui/app-link";
import { cx } from "@/components/ui/class-name";
import { clearPendingNavigation, getPendingNavigationServerSnapshot, getPendingNavigationSnapshot, subscribePendingNavigation } from "@/components/ui/navigation-pending";
import type { AdminShellScope } from "@/features/admin/admin-shell-scope";
import type { SupportedLocale } from "@/lib/i18n";

export type AdminNavKey =
  | "overview"
  | "storeOperations"
  | "customerOperations"
  | "schedule"
  | "productsInventory"
  | "upload"
  | "reports"
  | "configs"
  | "organization"
  | "approval";

type AdminShellProps = {
  active?: AdminNavKey;
  locale?: SupportedLocale;
  viewer: {
    fullName: string;
    roles: string[];
  };
  scope?: AdminShellScope | null;
  children: React.ReactNode;
};

type AdminNavLink = {
  key: AdminNavKey;
  label: string;
  href: string;
};

type AdminNavDomain = {
  key: string;
  label: string;
  href: string;
  activeKeys: AdminNavKey[];
  children?: AdminNavLink[];
};

const navDomains: AdminNavDomain[] = [
  { key: "dashboard", label: "经营驾驶舱", href: "/admin/overview", activeKeys: ["overview"] },
  { key: "store", label: "门店运营", href: "/admin/store-operations", activeKeys: ["storeOperations"] },
  { key: "customer", label: "客户经营", href: "/admin/customer-operations", activeKeys: ["customerOperations"] },
  {
    key: "service",
    label: "服务与排班",
    href: "/admin/schedule",
    activeKeys: ["schedule"],
    children: [{ key: "schedule", label: "排班管理", href: "/admin/schedule" }],
  },
  { key: "product", label: "商品与库存", href: "/admin/products-inventory", activeKeys: ["productsInventory"] },
  {
    key: "data",
    label: "数据报表",
    href: "/admin/reports",
    activeKeys: ["upload", "configs", "reports"],
    children: [
      { key: "upload", label: "数据上传", href: "/admin/data-upload" },
      { key: "configs", label: "报表设置", href: "/admin/configs" },
      { key: "reports", label: "数据报表", href: "/admin/reports" },
    ],
  },
  {
    key: "organization",
    label: "组织与权限",
    href: "/admin/organization",
    activeKeys: ["organization", "approval"],
    children: [
      { key: "organization", label: "组织架构", href: "/admin/organization" },
      { key: "approval", label: "审批配置", href: "/admin/approval" },
    ],
  },
];

const titles: Record<AdminNavKey, { title: string; description: string }> = {
  overview: { title: "经营驾驶舱", description: "面向老板和运营负责人的日运营节奏指挥台。" },
  storeOperations: { title: "门店运营", description: "门店运营 1.0 使用外部 SaaS 承载日常门店操作。" },
  customerOperations: { title: "客户经营", description: "围绕新客、复购、沉睡和顾问跟进的客户经营工作台。" },
  schedule: { title: "排班管理", description: "维护排班导入、校验和排班数据查看。" },
  productsInventory: { title: "商品与库存", description: "商品与库存模块建设中，后续补充商品、库存和调拨流程。" },
  upload: { title: "数据上传", description: "上传销售、客户和目标数据，先预览校验再提交。" },
  reports: { title: "数据报表", description: "基于报表模板查询、筛选和下载经营数据。" },
  configs: { title: "报表设置", description: "维护报表模板和 JSON 配置。" },
  organization: { title: "组织与权限", description: "组织、角色和权限模块建设中，审批配置已归入本模块。" },
  approval: { title: "审批配置", description: "配置审批模板和审批流转规则。" },
};

const shellPrefetchedRoutes = new Set<string>();
const shellPrefetchRoutes = [
  "/admin/overview",
  "/admin/store-operations",
  "/admin/customer-operations",
  "/admin/schedule",
  "/admin/data-upload",
  "/admin/reports",
  "/admin/configs",
  "/admin/organization",
  "/admin/approval",
];

export function AdminShell({ active, viewer, scope, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingNavigation = useSyncExternalStore(subscribePendingNavigation, getPendingNavigationSnapshot, getPendingNavigationServerSnapshot);
  const routeActive = active ?? resolveAdminNavKey(pathname);
  const optimisticActive = pendingNavigation?.type === "admin" && pendingNavigation.view !== routeActive ? pendingNavigation.view : routeActive;
  const isOptimisticLoading = optimisticActive !== routeActive;
  const title = titles[optimisticActive];
  const currentScopeDepartmentId = searchParams.get("scopeDepartmentId") ?? "";
  const activeDomainKey = useMemo(() => navDomains.find((domain) => domain.activeKeys.includes(optimisticActive))?.key ?? navDomains[0]?.key, [optimisticActive]);
  const [manualExpandedDomain, setManualExpandedDomain] = useState<{ routeKey: string | undefined; key: string | null }>({ routeKey: undefined, key: null });
  const expandedDomainKey = manualExpandedDomain.routeKey === activeDomainKey ? manualExpandedDomain.key : activeDomainKey;
  const [clientScope, setClientScope] = useState(scope ?? null);
  const activeScope = scope ?? clientScope;

  useEffect(() => {
    if (pendingNavigation?.type === "admin" && pendingNavigation.view === routeActive) {
      clearPendingNavigation();
    }
  }, [routeActive, pendingNavigation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      shellPrefetchRoutes.forEach((href) => {
        if (shellPrefetchedRoutes.has(href)) return;
        shellPrefetchedRoutes.add(href);
        router.prefetch(href);
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const query = currentScopeDepartmentId ? `?scopeDepartmentId=${encodeURIComponent(currentScopeDepartmentId)}` : "";

    fetch(`/api/admin/shell-scope${query}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { scope?: AdminShellScope | null } | null) => {
        if (isMounted && payload?.scope) setClientScope(payload.scope);
      })
      .catch(() => {
        // Keep the previous scope visible if the background refresh fails.
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentScopeDepartmentId]);

  function hrefWithScope(href: string) {
    if (!currentScopeDepartmentId) return href;
    const params = new URLSearchParams();
    params.set("scopeDepartmentId", currentScopeDepartmentId);
    return `${href}?${params.toString()}`;
  }

  function handleScopeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("scopeDepartmentId", value);
    } else {
      params.delete("scopeDepartmentId");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#eef2f5] text-[#17202f]">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-[#d7dee7] bg-[#16202d] text-white lg:h-full lg:w-[19rem] lg:border-b-0 lg:border-r lg:border-[#263446]">
          <div className="px-5 py-6">
            <AppLink href="/" className="block text-base font-semibold uppercase tracking-[0.18em] text-[#d8e2ef]" pendingClassName="opacity-70">
              KOMO S&OP
            </AppLink>
            <p className="mt-2 text-sm text-[#9fb0c2]">门店运营指挥台</p>

            <label className="mt-6 block">
              <span className="text-sm font-medium text-[#9fb0c2]">当前范围</span>
              {activeScope ? (
                <select
                  value={activeScope.currentDepartmentId ?? ""}
                  onChange={(event) => handleScopeChange(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#344357] bg-[#0f1722] px-4 py-3 text-base font-semibold text-white outline-none focus:border-[#8ecae6]"
                >
                  {activeScope.isHeadquarters ? <option value="">全公司</option> : null}
                  {activeScope.switcherOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {"—".repeat(option.depth)} {option.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-2 h-[50px] rounded-xl border border-[#344357] bg-[#0f1722] px-4 py-3 text-base font-semibold text-[#9fb0c2]">加载范围中</div>
              )}
            </label>
          </div>

          <nav className="flex gap-3 overflow-x-auto px-3 pb-5 lg:block lg:space-y-2 lg:overflow-visible lg:px-4">
            {navDomains.map((domain) => {
              const isDomainActive = domain.activeKeys.includes(optimisticActive);
              const hasChildren = Boolean(domain.children?.length);
              const isExpanded = expandedDomainKey === domain.key;
              const domainClassName = cx(
                "flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-base font-medium transition lg:w-full",
                isDomainActive ? "bg-white text-[#17202f]" : "text-[#c8d4e2] hover:bg-white/10 hover:text-white",
              );

              return (
                <div key={domain.key} className="min-w-[168px] lg:min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setManualExpandedDomain({ routeKey: activeDomainKey, key: isExpanded ? null : domain.key })}
                      className={domainClassName}
                      aria-expanded={isExpanded}
                    >
                      <span>{domain.label}</span>
                      <span className={cx("text-xs", isDomainActive ? "text-[#607089]" : "text-[#8fa0b4]")}>{isExpanded ? "−" : "+"}</span>
                    </button>
                  ) : (
                    <AppLink href={hrefWithScope(domain.href)} className={domainClassName} activeClassName="bg-white text-[#17202f]" pendingClassName="opacity-70">
                      <span>{domain.label}</span>
                    </AppLink>
                  )}

                  {hasChildren && isExpanded ? (
                    <div className="mt-2 space-y-1.5 pl-4">
                      {domain.children?.map((item) => (
                        <AppLink
                          key={item.key}
                          href={hrefWithScope(item.href)}
                          className={cx(
                            "block whitespace-nowrap rounded-xl px-4 py-2.5 text-[15px] font-medium transition",
                            optimisticActive === item.key ? "bg-white/15 text-white" : "text-[#9fb0c2] hover:bg-white/10 hover:text-white",
                          )}
                          activeClassName="bg-white/15 text-white"
                          pendingClassName="opacity-70"
                        >
                          {item.label}
                        </AppLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-[#d7dee7] bg-white px-4 py-4 shadow-sm sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-[#17202f]">{title.title}</h1>
                <p className="mt-1 text-sm text-[#607089]">{title.description}</p>
              </div>
              <div className="rounded-lg border border-[#d7dee7] bg-[#f8fafc] px-3 py-2 text-sm text-[#526174]">
                <span className="font-medium text-[#17202f]">{viewer.fullName}</span>
                <span className="ml-2">{viewer.roles.join(" / ")}</span>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">{isOptimisticLoading ? <AdminContentSkeleton /> : children}</main>
        </div>
      </div>
    </div>
  );
}

export function AdminContentSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#d7dee7]/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-[#e0e7ef]" />
            <div className="h-7 w-56 rounded bg-[#d7e0ea]" />
            <div className="h-4 w-80 max-w-full rounded bg-[#e8eef4]" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-[#e8eef4]" />
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-[#d7dee7]/70" />
        <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-[#d7dee7]/70" />
        <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-[#d7dee7]/70" />
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#d7dee7]/70">
        <div className="h-5 w-32 rounded bg-[#d7e0ea]" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-10 rounded-xl bg-[#f0f4f8]" />
          ))}
        </div>
      </section>
    </div>
  );
}

function resolveAdminNavKey(pathname: string): AdminNavKey {
  const path = pathname.replace(/\/$/, "") || "/admin/overview";
  if (path === "/admin" || path === "/admin/overview") return "overview";
  if (path === "/admin/store-operations") return "storeOperations";
  if (path === "/admin/customer-operations") return "customerOperations";
  if (path === "/admin/schedule") return "schedule";
  if (path === "/admin/products-inventory") return "productsInventory";
  if (path === "/admin/data-upload") return "upload";
  if (path === "/admin/reports") return "reports";
  if (path === "/admin/configs") return "configs";
  if (path === "/admin/organization") return "organization";
  if (path === "/admin/approval") return "approval";
  return "overview";
}
