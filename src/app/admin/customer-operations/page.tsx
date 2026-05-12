import { AdminShell } from "@/components/layout/admin-shell";
import { AppLink } from "@/components/ui/app-link";
import { getAdminGate } from "@/features/admin/admin-auth";
import { getAdminShellScope } from "@/features/admin/admin-shell-scope";

const customerModules = [
  {
    title: "客户看板",
    status: "规划中",
    description: "看客户总量、新客、复购、沉睡客户等关键经营信号，后续接入客户资料和销售数据。",
    focus: "今天该看什么",
  },
  {
    title: "客户档案",
    status: "后续接入",
    description: "查看客户基础资料、归属门店、标签、顾问和消费记录，作为门店跟进客户的统一入口。",
    focus: "客户是谁",
  },
  {
    title: "新客转化",
    status: "规划中",
    description: "关注首次到店、首次购买和首次体验客户，帮助门店及时完成新客跟进。",
    focus: "新客怎么留下来",
  },
  {
    title: "复购唤醒",
    status: "规划中",
    description: "识别长期未消费、疗程或套餐可能中断的客户，形成复购提醒和回访动作。",
    focus: "老客怎么回来",
  },
  {
    title: "顾问跟进",
    status: "后续接入",
    description: "按顾问和门店分配客户跟进任务，后续可联动经营待办形成闭环。",
    focus: "谁负责跟进",
  },
];

const flowSteps = ["客户资料导入", "客户分层", "门店/顾问跟进", "销售复盘"];

export default async function AdminCustomerOperationsPage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  const gate = await getAdminGate("customerOperations", "/admin/customer-operations");
  if (gate.state !== "ready") {
    return gate.element;
  }

  const params = await searchParams;
  const scope = await getAdminShellScope(params.scopeDepartmentId);
  const scopeQuery = params.scopeDepartmentId ? `?scopeDepartmentId=${encodeURIComponent(params.scopeDepartmentId)}` : "";

  return (
    <AdminShell active="customerOperations" locale={gate.viewer.locale} viewer={{ fullName: gate.viewer.profile.fullName, roles: gate.viewer.roles }} scope={scope}>
      <div className="space-y-5">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#d7dee7]/70">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607089]">Customer Operations 1.0</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#17202f]">客户经营工作台</h2>
              <p className="mt-3 text-sm leading-6 text-[#607089]">
                客户经营 1.0 先不做复杂 CRM，而是把 KOMO 门店最需要的客户动作串起来：看清客户、找到机会、分配跟进、复盘结果。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppLink
                href={`/admin/data-upload${scopeQuery}`}
                className="rounded-xl bg-[#1f5f8b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#184e77]"
                pendingClassName="opacity-70"
              >
                导入客户资料
              </AppLink>
              <AppLink
                href={`/admin/reports${scopeQuery}`}
                className="rounded-xl bg-[#eef4f8] px-4 py-2.5 text-sm font-semibold text-[#1f5f8b] transition hover:bg-[#e0edf5]"
                pendingClassName="opacity-70"
              >
                查看客户报表
              </AppLink>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#d7dee7]/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#17202f]">1.0 客户经营流程</h3>
              <p className="mt-1 text-sm text-[#607089]">第一版先建立门店可理解的经营路径，后续再逐步接真实指标和任务。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {flowSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full bg-[#f2f5f8] px-3 py-1.5 text-sm font-medium text-[#17202f]">{step}</span>
                  {index < flowSteps.length - 1 ? <span className="text-sm text-[#9aa8b6]">→</span> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {customerModules.map((module) => (
            <article key={module.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#d7dee7]/70">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#607089]">{module.focus}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#17202f]">{module.title}</h3>
                </div>
                <span className="rounded-full bg-[#f2f5f8] px-2.5 py-1 text-xs font-semibold text-[#607089]">{module.status}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#607089]">{module.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-[#f8fafc] p-5 ring-1 ring-[#d7dee7]/70">
          <h3 className="text-base font-semibold text-[#17202f]">后续接入方向</h3>
          <p className="mt-2 text-sm leading-6 text-[#607089]">
            后续优先复用现有客户资料、销售明细和报表模板能力，让客户经营从“目录”升级成“可筛选、可分配、可复盘”的门店动作闭环。
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
