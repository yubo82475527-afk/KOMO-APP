import Link from "next/link";
import { Section } from "@/components/ui/section";
import type { AppViewer } from "@/features/auth/viewer";

export function HomeView({ viewer }: { viewer: Extract<AppViewer, { state: "ready" }> }) {
  const avatar = viewer.profile.fullName.slice(0, 1);
  const departmentLabel = viewer.profile.departmentName ?? "未分配部门";
  const roleLabel = viewer.roles.length > 0 ? viewer.roles.join(" / ") : "未分配角色";

  return (
    <>
      <section className="rounded-3xl bg-[linear-gradient(135deg,#8a5a2f_0%,#c2874d_55%,#e8c08e_100%)] p-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-white/20 text-lg font-semibold">{avatar}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">KOMO Workspace</p>
            <h2 className="mt-1 text-xl font-semibold">{viewer.profile.fullName}</h2>
            <p className="text-sm text-white/85">
              {departmentLabel} · {viewer.user.email ?? "未绑定邮箱"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {[
          ["我的排班", "/schedule", "查看本月排班和班次安排。"],
          ["个人资料", "/profile", "查看当前账号、工号和角色信息。"],
          ["考勤打卡", "/checkin", "进入 KOMO 打卡模块入口。"],
          ["请假申请", "/leave/apply", "提交请假并进入真实审批流。"],
        ].map(([title, href, desc]) => (
          <Link key={title} href={href} className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
            <p className="font-semibold">{title}</p>
            <p className="mt-2 text-xs leading-5 text-[#607089]">{desc}</p>
          </Link>
        ))}
      </section>

      <Section title="账号信息">
        <div className="space-y-3">
          <div className="rounded-xl bg-[#f8f3ec] p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">员工编号 {viewer.profile.employeeNo ?? "未设置"}</p>
              <span className="rounded-full bg-[#8a5a2f] px-2 py-1 text-xs text-white">{viewer.profile.status === "active" ? "已启用" : "已停用"}</span>
            </div>
            <p className="mt-1 text-sm text-[#6b5845]">欢迎进入 KOMO 员工工作台。</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#fff8f1] p-3">
              <p className="text-sm text-[#607089]">登录邮箱</p>
              <p className="mt-1 break-all text-base font-semibold text-[#17202f]">{viewer.user.email ?? "未设置"}</p>
            </div>
            <div className="rounded-xl bg-[#f6f1ea] p-3">
              <p className="text-sm text-[#607089]">账号角色</p>
              <p className="mt-1 text-sm font-semibold text-[#17202f]">{roleLabel}</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
