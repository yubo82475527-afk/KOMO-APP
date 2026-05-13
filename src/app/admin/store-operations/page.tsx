import { getAdminGate } from "@/features/admin/admin-auth";

const STORE_OPERATIONS_SAAS_URL = "https://komo-biz.mase.cloud/";
const LEARNING_CENTER_URL = "https://komo.sandstalk.com/#/home";

export default async function AdminStoreOperationsPage() {
  const gate = await getAdminGate("storeOperations", "/admin/store-operations");
  if (gate.state !== "ready") {
    return gate.element;
  }

  return (
    <section className="rounded-2xl border border-[#d7dee7] bg-white p-8 shadow-sm">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607089]">External SaaS</p>
        <h2 className="mt-3 text-2xl font-semibold text-[#17202f]">门店运营</h2>
        <p className="mt-3 text-sm leading-6 text-[#607089]">
          门店运营 1.0 暂不在 KOMO S&OP 内自建。当前阶段使用已采购的门店运营 SaaS 平台承载日常门店操作。
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ExternalEntryCard
            title="门店运营 SaaS"
            description="进入外部门店运营平台，处理收银、日程、项目和套餐等一线门店工作。"
            href={STORE_OPERATIONS_SAAS_URL}
            actionLabel="打开门店运营 SaaS"
          />
          <ExternalEntryCard
            title="学习中心"
            description="进入 KOMO 学习中心，查看门店培训、标准流程和学习资料。"
            href={LEARNING_CENTER_URL}
            actionLabel="打开学习中心"
          />
        </div>
      </div>
    </section>
  );
}

function ExternalEntryCard({ title, description, href, actionLabel }: { title: string; description: string; href: string; actionLabel: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cfd8e3] bg-[#f8fafc] px-4 py-5">
      <h3 className="text-base font-semibold text-[#17202f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#607089]">{description}</p>
      <div className="mt-4 flex flex-col gap-2">
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex w-fit rounded-xl bg-[#1f5f8b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#184e77]">
          {actionLabel}
        </a>
        <span className="break-all text-xs text-[#607089]">{href}</span>
      </div>
    </div>
  );
}
