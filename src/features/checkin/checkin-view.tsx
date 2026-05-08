"use client";

import { Section } from "@/components/ui/section";

export function CheckinView() {
  return (
    <>
      <section className="rounded-3xl bg-[linear-gradient(135deg,#8a5a2f_0%,#b87b45_100%)] p-5 text-white shadow-sm">
        <p className="text-sm text-white/75">KOMO 打卡中心</p>
        <h2 className="mt-1 text-lg font-semibold">打卡模块正在接入正式考勤数据</h2>
        <p className="mt-2 text-sm leading-6 text-white/85">
          当前页面已经恢复为正式入口，用于承接生产环境打卡模块。现阶段保留界面与流程说明，后续会接入真实 `attendance_records`
          与考勤规则。
        </p>
      </section>

      <Section title="当前安排">
        <div className="space-y-3 text-sm text-[#607089]">
          <div className="rounded-xl bg-[#f8f3ec] p-3">上班打卡、下班打卡、定位与设备校验将接入正式考勤记录。</div>
          <div className="rounded-xl bg-[#f8f3ec] p-3">迟到、早退、缺卡和日汇总会按 KOMO 的正式考勤规则落库。</div>
          <div className="rounded-xl bg-[#f8f3ec] p-3">当前生产版先保留页面入口，避免员工看到“旧入口停用”的错误提示。</div>
        </div>
      </Section>
    </>
  );
}
