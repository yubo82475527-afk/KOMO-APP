"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppLink } from "@/components/ui/app-link";
import { cx } from "@/components/ui/class-name";
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
  active: AdminNavKey;
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
  {
    key: "dashboard",
    label: "经营驾驶舱",
    href: "/admin/overview",
    activeKeys: ["overview"],
  },
  {
    key: "store",
    label: "门店运营",
    href: "/admin/store-operations",
    activeKeys: ["storeOperations"],
  },
  {
    key: "customer",
    label: "客户经营",
    href: "/admin/customer-operations",
    activeKeys: ["customerOperations"],
  },
  {
    key: "service",
    label: "服务与排班",
    href: "/admin/schedule",
    activeKeys: ["schedule"],
    children: [{ key: "schedule", label: "排班管理", href: "/admin/schedule" }],
  },
  {
    key: "product",
    label: "商品与库存",
    href: "/admin/products-inventory",
    activeKeys: ["productsInventory"],
  },
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
  storeOperations: { title: "门店运营", description: "门店运营模块建设中，后续补充具体流程。" },
  customerOperations: { title: "客户经营", description: "客户经营模块建设中，后续补充会员、触达和复购流程。" },
  schedule: { title: "排班管理", description: "维护排班导入、校验和排班数据查看。" },
  productsInventory: { title: "商品与库存", description: "商品与库存模块建设中，后续补充商品、库存和调拨流程。" },
  upload: { title: "数据上传", description: "上传销售、客户和目标数据，先预览校验再提交。" },
  reports: { title: "数据报表", description: "基于报表模板查询、筛选和下载经营数据。" },
  configs: { title: "报表设置", description: "维护报表模板和 JSON 配置。" },
  organization: { title: "组织与权限", description: "组织、角色和权限模块建设中，审批配置已归入本模块。" },
  approval: { title: "审批配置", description: "配置审批模板和审批流转规则。" },
};

export function AdminShell({ active, viewer, scope, children }: AdminShellProps) {
  const title = titles[active];
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentScopeDepartmentId = searchParams.get("scopeDepartmentId") ?? "";
  const activeDomainKey = useMemo(() => navDomains.find((domain) => domain.activeKeys.includes(active))?.key ?? navDomains[0]?.key, [active]);
  const [manualExpandedDomain, setManualExpandedDomain] = useState<{ routeKey: string | undefined; key: string | null }>({ routeKey: undefined, key: null });
  const expandedDomainKey = manualExpandedDomain.routeKey === activeDomainKey ? manualExpandedDomain.key : activeDomainKey;

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
        <aside className="shrink-0 border-b border-[#d7dee7] bg-[#16202d] text-white lg:h-full lg:w-72 lg:border-b-0 lg:border-r lg:border-[#263446]">
          <div className="px-5 py-5">
            <AppLink href="/" className="block text-sm font-semibold uppercase tracking-[0.16em] text-[#d8e2ef]" pendingClassName="opacity-70">
              KOMO S&OP
            </AppLink>
            <p className="mt-2 text-xs text-[#9fb0c2]">门店运营指挥台</p>

            {scope ? (
              <label className="mt-4 block">
                <span className="text-xs font-medium text-[#9fb0c2]">当前范围</span>
                <select
                  value={scope.currentDepartmentId ?? ""}
                  onChange={(event) => handleScopeChange(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#344357] bg-[#0f1722] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#8ecae6]"
                >
                  {scope.isHeadquarters ? <option value="">全公司</option> : null}
                  {scope.switcherOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {"—".repeat(option.depth)} {option.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <nav className="flex gap-3 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:overflow-visible lg:px-4">
            {navDomains.map((domain) => {
              const isDomainActive = domain.activeKeys.includes(active);
              const hasChildren = Boolean(domain.children?.length);
              const isExpanded = expandedDomainKey === domain.key;
              const domainClassName = cx(
                "flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition lg:w-full",
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
                    <div className="mt-1 space-y-1 pl-3">
                      {domain.children?.map((item) => (
                        <AppLink
                          key={item.key}
                          href={hrefWithScope(item.href)}
                          className={cx(
                            "block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                            active === item.key ? "bg-white/15 text-white" : "text-[#9fb0c2] hover:bg-white/10 hover:text-white",
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

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
