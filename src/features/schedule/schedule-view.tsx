"use client";

import { useState } from "react";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import { TabButton } from "@/components/ui/tab-button";
import { calendarDays, shiftMap, weekSchedule } from "@/features/shared/fixtures";
import type { SchedulePageData } from "./schedule-data";

type ScheduleMode = "my" | "calendar" | "stats";

export function ScheduleView({ data }: { data?: Extract<SchedulePageData, { state: "ready" }> }) {
  const [mode, setMode] = useState<ScheduleMode>("my");
  const [month, setMonth] = useState(formatCurrentMonthLabel());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <TabButton active={mode === "my"} onClick={() => setMode("my")}>
          我的排班
        </TabButton>
        <TabButton active={mode === "calendar"} onClick={() => setMode("calendar")}>
          排班日历
        </TabButton>
        <TabButton active={mode === "stats"} onClick={() => setMode("stats")}>
          排班统计
        </TabButton>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-white p-3">
        <button type="button" onClick={() => setMonth("2024年12月")} className="rounded-full bg-[#eef2f6] px-3 py-2 text-sm">
          上月
        </button>
        <p className="font-semibold">{month}</p>
        <button type="button" onClick={() => setMonth("2025年1月")} className="rounded-full bg-[#eef2f6] px-3 py-2 text-sm">
          下月
        </button>
      </div>

      {mode === "my" && <MySchedule data={data} />}
      {mode === "calendar" && <ScheduleCalendar onSelectDay={setSelectedDay} />}
      {mode === "stats" && <ScheduleStats />}
      {selectedDay && <ScheduleDetailSheet day={selectedDay} onClose={() => setSelectedDay(null)} />}
    </>
  );
}

function MySchedule({ data }: { data?: Extract<SchedulePageData, { state: "ready" }> }) {
  const realItems = data?.items ?? [];
  const showRealItems = realItems.length > 0;

  return (
    <>
      <Section title={showRealItems ? "本月真实排班" : "本周示意排班"}>
        {showRealItems ? (
          <div className="space-y-3">
            {realItems.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#f6f8fb] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#17202f]">{formatWorkDate(item.workDate)}</p>
                    <p className="mt-1 text-sm text-[#607089]">
                      {item.startTime && item.endTime ? `${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}` : item.scheduleType === "rest" ? "休息日" : "待配置"}
                    </p>
                  </div>
                  <span className={cx("rounded-full px-3 py-1 text-xs font-medium", getShiftColorClass(item.shiftCode))}>{item.shiftName}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-dashed border-[#d9dee8] bg-[#fbfcfd] p-4 text-sm leading-6 text-[#607089]">
              当前账号还没有查到本月正式排班数据。你可以通过管理端导入排班，或在 Supabase 中先补齐当前员工的 `schedules` 记录。
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekSchedule.map((item) => (
                <div key={item.day} className="rounded-xl bg-[#f6f8fb] p-2 text-center">
                  <p className="text-xs text-[#607089]">{item.day}</p>
                  <p className="text-xs text-[#8a97a8]">{item.date}</p>
                  <div className={cx("mt-2 rounded-lg px-1 py-2 text-xs font-medium", item.shift.colorClass)}>{item.shift.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="班次说明">
        <div className="space-y-2">
          {Object.values(shiftMap).map((shift) => (
            <div key={shift.code} className="flex items-center justify-between rounded-xl bg-[#f6f8fb] p-3">
              <span className={cx("rounded-full px-2 py-1 text-xs", shift.colorClass)}>{shift.name}</span>
              <span className="text-sm text-[#607089]">{shift.time}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function ScheduleCalendar({ onSelectDay }: { onSelectDay: (day: number) => void }) {
  return (
    <>
      <Section title="日历视图">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#607089]">
          {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {calendarDays.map((item, index) => (
            <button
              key={index}
              type="button"
              disabled={!item}
              onClick={() => item && onSelectDay(item.day)}
              className="min-h-16 rounded-xl bg-[#f6f8fb] p-1 text-left disabled:bg-transparent"
            >
              {item && (
                <>
                  <span className="text-xs font-semibold">{item.day}</span>
                  <span className={cx("mt-1 block rounded px-1 py-1 text-center text-[11px]", item.shift.colorClass)}>{item.shift.name}</span>
                  <span className="mt-1 block truncate text-[10px] text-[#8a97a8]">{item.shift.time}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section title="本月概况">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[#f6f8fb] p-3">上班 22 天</div>
          <div className="rounded-xl bg-[#f6f8fb] p-3">休息 9 天</div>
        </div>
      </Section>
    </>
  );
}

function ScheduleStats() {
  return (
    <>
      <Section title="本月统计">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["已排班天数", "24"],
            ["应上班天数", "22"],
            ["出勤率", "96%"],
            ["剩余休息日", "5"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[#f6f8fb] p-3">
              <p className="text-sm text-[#607089]">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="班次分布">
        <div className="flex items-center gap-5">
          <div className="size-28 rounded-full" style={{ background: "conic-gradient(#2d6a4f 0 42%, #f4a261 42% 70%, #184e77 70% 100%)" }} />
          <div className="space-y-2 text-sm">
            <p>早班 42%</p>
            <p>中班 28%</p>
            <p>晚班 30%</p>
          </div>
        </div>
      </Section>
    </>
  );
}

function ScheduleDetailSheet({ day, onClose }: { day: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/30 p-3" onClick={onClose}>
      <div className="w-full max-w-[430px] rounded-3xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#d9dee8]" />
        <h3 className="text-lg font-semibold">1月{day}日班次详情</h3>
        <div className="mt-4 space-y-3 text-sm">
          <p>班次名称：早班</p>
          <p>上班时间：08:00</p>
          <p>下班时间：17:00</p>
          <p>工作地点：总部 A 座</p>
          <p>备注：需提前 10 分钟到岗</p>
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-[#184e77] py-3 text-sm font-medium text-white">
          知道了
        </button>
      </div>
    </div>
  );
}

function formatCurrentMonthLabel() {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月`;
}

function formatWorkDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getShiftColorClass(code: string) {
  return shiftMap[code]?.colorClass ?? "bg-[#f8fafc] text-[#8a97a8]";
}
