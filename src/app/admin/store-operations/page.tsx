import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";

const STORE_OPERATIONS_SAAS_URL = "https://komo-biz.mase.cloud/";

export default async function AdminStoreOperationsPage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  const gate = await getAdminGate("storeOperations", "/admin/store-operations");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const scope = await getAdminShellScope(params.scopeDepartmentId);

  return (
    <AdminShell active="storeOperations" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      <section className="rounded-2xl border border-[#d7dee7] bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607089]">External SaaS</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#17202f]">门店运营</h2>
          <p className="mt-3 text-sm leading-6 text-[#607089]">
            门店运营 1.0 暂不在 KOMO S&OP 内自建。当前阶段使用已采购的门店运营 SaaS 平台承载日常门店操作。
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-[#cfd8e3] bg-[#f8fafc] px-4 py-5 text-sm leading-6 text-[#607089]">
            可从这里快速进入外部门店运营平台，处理收银、日程、项目和套餐等一线门店工作。
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={STORE_OPERATIONS_SAAS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl bg-[#1f5f8b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#184e77]"
            >
              打开门店运营 SaaS
            </a>
            <span className="text-sm text-[#607089]">{STORE_OPERATIONS_SAAS_URL}</span>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
