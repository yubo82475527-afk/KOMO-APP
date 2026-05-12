import { AdminShell, type AdminNavKey } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";

type AdminPlaceholderPageProps = {
  active: AdminNavKey;
  redirectTo: string;
  title: string;
  description: string;
  searchParams: Promise<{ scopeDepartmentId?: string }>;
};

export async function AdminPlaceholderPage({ active, redirectTo, title, description, searchParams }: AdminPlaceholderPageProps) {
  const gate = await getAdminGate(active, redirectTo);
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const scope = await getAdminShellScope(params.scopeDepartmentId);

  return (
    <AdminShell active={active} locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      <section className="rounded-2xl border border-[#d7dee7] bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607089]">Coming soon</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#17202f]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#607089]">{description}</p>
          <div className="mt-6 rounded-xl border border-dashed border-[#cfd8e3] bg-[#f8fafc] px-4 py-5 text-sm text-[#607089]">
            当前模块先保留入口和页面结构，后续补充具体功能后可直接在这里承载。
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
