import { Section } from "@/components/ui/section";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { AppViewer } from "@/features/auth/viewer";

export function ProfileView({ viewer }: { viewer: Extract<AppViewer, { state: "ready" }> }) {
  const avatar = viewer.profile.fullName.slice(0, 1);

  return (
    <>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-[#184e77] text-xl font-semibold text-white">{avatar}</div>
          <div>
            <h2 className="text-lg font-semibold">
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
      <MenuSection title="试运行说明" items={["当前页面使用真实 Supabase 用户档案。", "如需修改角色，请在 user_roles 中维护。", "如需修改个人信息，请同步更新 profiles。"]} />
      <MenuSection title="后续开放" items={["请假记录", "补卡申请", "加班申请"]} />
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
