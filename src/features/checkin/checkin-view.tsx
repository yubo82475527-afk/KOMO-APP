"use client";

import { Section } from "@/components/ui/section";

export function CheckinView() {
  return (
    <>
      <section className="rounded-3xl bg-[#184e77] p-5 text-white">
        <p className="text-sm text-white/75">试运行说明</p>
        <h2 className="mt-1 text-lg font-semibold">考勤打卡暂未接入正式数据</h2>
        <p className="mt-2 text-sm leading-6 text-white/80">
          当前页面只保留移动端布局演示，不会写入 `attendance_records`，也不会产生正式考勤结果，避免试运行期间误记考勤。
        </p>
      </section>

      <Section title="当前状态">
        <div className="space-y-3 text-sm text-[#607089]">
          <div className="rounded-xl bg-[#f6f8fb] p-3">定位、拍照、上下班打卡按钮暂不落正式库。</div>
          <div className="rounded-xl bg-[#f6f8fb] p-3">正式启用前需要接入真实班次、打卡策略、迟到早退规则与日汇总。</div>
        </div>
      </Section>
    </>
  );
}
