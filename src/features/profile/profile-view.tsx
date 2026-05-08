import { Section } from "@/components/ui/section";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { AppViewer } from "@/features/auth/viewer";

export function ProfileView({ viewer }: { viewer: Extract<AppViewer, { state: "ready" }> }) {
  const avatar = viewer.profile.fullName.slice(0, 1);

  return (
    <>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-[#8a5a2f] text-xl font-semibold text-white">{avatar}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a6b3d]">KOMO Member</p>
            <h2 className="mt-1 text-lg font-semibold">
              {viewer.profile.fullName} · {viewer.profile.employeeNo ?? "未设置工号"}
            </h2>
            <p className="text-sm text-[#607089]">{viewer.profile.departmentName ?? "未分配部门"}</p>
            <p className="text-sm text-[#607089]">{viewer.user.email ?? "未绑定邮箱"}</p>
          </div>
        </div>
      </section>

      <MenuSection
        title="我的账号"
        items={[
          `员工状态：${viewer.profile.status === "active" ? "正常" : "停用"}`,
          `角色：${viewer.roles.join(" / ") || "未分配"}`,
          `用户 ID：${viewer.user.id.slice(0, 8)}...`,
        ]}
      />
      <MenuSection title="常用记录" items={["请假记录", "打卡记录", "排班历史"]} />
      <SignOutButton redirectTo="/profile" />
    </>
  );
}

function MenuSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Section title={title}>
      <div className="divide-y divide-[#e6eaf0]">
        {items.map((item) => (
          <div key={item} className="flex w-full items-center justify-between py-3 text-left">
            <span>{item}</span>
            <span className="text-[#8a97a8]">查看</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
