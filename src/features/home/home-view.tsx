import Link from "next/link";
import { Section } from "@/components/ui/section";
import type { AppViewer } from "@/features/auth/viewer";

export function HomeView({ viewer }: { viewer: Extract<AppViewer, { state: "ready" }> }) {
  const avatar = viewer.profile.fullName.slice(0, 1);
  const departmentLabel = viewer.profile.departmentName ?? "未分配部门";
  const roleLabel = viewer.roles.length > 0 ? viewer.roles.join(" / ") : "未分配角色";

  return (
    <>
      <section className="rounded-3xl bg-[#184e77] p-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-white/20 text-lg font-semibold">{avatar}</div>
          <div>
            <p className="text-sm text-white/75">欢迎回来</p>
            <h2 className="text-xl font-semibold">{viewer.profile.fullName}</h2>
            <p className="text-sm text-white/80">
              {departmentLabel} · {viewer.user.email ?? "未绑定邮箱"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {[
          ["我的排班", "/schedule", "读取当前账号在 Supabase 中的正式排班数据。"],
          ["个人资料", "/profile", "查看当前登录身份、员工编号和角色信息。"],
          ["考勤打卡", "/checkin", "试运行期间仅展示页面，不写入正式考勤。"],
          ["请假申请", "/leave/apply", "试运行期间为演示流程，暂未提交正式审批。"],
        ].map(([title, href, desc]) => (
          <Link key={title} href={href} className="rounded-2xl border border-[#d9dee8] bg-white p-4 shadow-sm">
            <p className="font-semibold">{title}</p>
            <p className="mt-2 text-xs leading-5 text-[#607089]">{desc}</p>
          </Link>
        ))}
      </section>

      <Section title="当前账号摘要">
        <div className="space-y-3">
          <div className="rounded-xl bg-[#eef7f0] p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">员工编号 {viewer.profile.employeeNo ?? "未设置"}</p>
              <span className="rounded-full bg-[#2d6a4f] px-2 py-1 text-xs text-white">{viewer.profile.status === "active" ? "已启用" : "已停用"}</span>
            </div>
            <p className="mt-1 text-sm text-[#526174]">当前首页已经切到真实 Supabase 用户，适合小范围试运行验证。</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#fff5f5] p-3">
              <p className="text-sm text-[#607089]">登录邮箱</p>
              <p className="mt-1 break-all text-base font-semibold text-[#17202f]">{viewer.user.email ?? "未设置"}</p>
            </div>
            <div className="rounded-xl bg-[#f6f8fb] p-3">
              <p className="text-sm text-[#607089]">账号角色</p>
              <p className="mt-1 text-sm font-semibold text-[#17202f]">{roleLabel}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="试运行状态">
        <div className="space-y-3">
          {[
            "首页、个人资料、我的排班已接入真实 Supabase 用户与档案。",
            "管理端排班导入已要求真实登录态与 admin/hr 权限。",
            "审批、考勤、请假暂保留演示页，避免用户误以为已经接入正式数据。",
          ].map((notice) => (
            <div key={notice} className="flex items-center justify-between rounded-xl bg-[#f6f8fb] p-3 text-left">
              <span className="font-medium">{notice}</span>
              <span className="text-[#607089]">已确认</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
