"use client";

import { useState } from "react";
import { formatDate } from "@/lib/date-time";
import { getDictionary } from "@/lib/i18n";
import { cx } from "@/components/ui/class-name";
import { Section } from "@/components/ui/section";
import { TabButton } from "@/components/ui/tab-button";
import { calendarDays, shiftMap, weekSchedule } from "@/features/shared/fixtures";
import type { SchedulePageData } from "./schedule-data";

type ScheduleMode = "my" | "calendar" | "stats";

export function ScheduleView({ data }: { data?: Extract<SchedulePageData, { state: "ready" }> }) {
  const locale = data?.locale ?? "zh-CN";
  const dictionary = getDictionary(locale);
  const [mode, setMode] = useState<ScheduleMode>("my");
  const [month, setMonth] = useState(formatCurrentMonthLabel(locale));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <TabButton active={mode === "my"} onClick={() => setMode("my")}>
          {dictionary.schedule.mySchedule}
        </TabButton>
        <TabButton active={mode === "calendar"} onClick={() => setMode("calendar")}>
          {dictionary.schedule.calendar}
        </TabButton>
        <TabButton active={mode === "stats"} onClick={() => setMode("stats")}>
          {dictionary.schedule.stats}
        </TabButton>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-white p-3">
        <button type="button" onClick={() => setMonth(locale === "en" ? "Dec 2024" : "2024年12月")} className="rounded-full bg-[#eef2f6] px-3 py-2 text-sm">
          {dictionary.schedule.prevMonth}
        </button>
        <p className="font-semibold">{month}</p>
        <button type="button" onClick={() => setMonth(locale === "en" ? "Jan 2025" : "2025年1月")} className="rounded-full bg-[#eef2f6] px-3 py-2 text-sm">
          {dictionary.schedule.nextMonth}
        </button>
      </div>

      {mode === "my" && <MySchedule data={data} />}
      {mode === "calendar" && <ScheduleCalendar locale={locale} onSelectDay={setSelectedDay} />}
      {mode === "stats" && <ScheduleStats locale={locale} />}
      {selectedDay && <ScheduleDetailSheet day={selectedDay} locale={locale} onClose={() => setSelectedDay(null)} />}
    </>
  );
}

function MySchedule({ data }: { data?: Extract<SchedulePageData, { state: "ready" }> }) {
  const locale = data?.locale ?? "zh-CN";
  const dictionary = getDictionary(locale);
  const realItems = data?.items ?? [];
  const showRealItems = realItems.length > 0;

  return (
    <>
      <Section title={showRealItems ? dictionary.schedule.realSchedule : dictionary.schedule.demoSchedule}>
        {showRealItems ? (
          <div className="space-y-3">
            {realItems.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#f6f8fb] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#17202f]">{formatWorkDate(item.workDate, locale)}</p>
                    <p className="mt-1 text-sm text-[#607089]">
                      {item.startTime && item.endTime ? `${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}` : item.scheduleType === "rest" ? dictionary.schedule.restDay : dictionary.schedule.pendingConfig}
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
              {dictionary.schedule.noScheduleData}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekSchedule.map((item) => (
                <div key={item.day} className="rounded-xl bg-[#f6f8fb] p-2 text-center">
                  <p className="text-xs text-[#607089]">{dictionary.schedule.weekPreviewDays[weekSchedule.indexOf(item)]}</p>
                  <p className="text-xs text-[#8a97a8]">{item.date}</p>
                  <div className={cx("mt-2 rounded-lg px-1 py-2 text-xs font-medium", item.shift.colorClass)}>{item.shift.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title={dictionary.schedule.shiftGuide}>
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

function ScheduleCalendar({ locale, onSelectDay }: { locale: Extract<SchedulePageData, { state: "ready" }>["locale"]; onSelectDay: (day: number) => void }) {
  const dictionary = getDictionary(locale);
  return (
    <>
      <Section title={dictionary.schedule.calendarView}>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#607089]">
          {dictionary.schedule.weekPreviewDays.map((day) => (
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

      <Section title={dictionary.schedule.monthSummary}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[#f6f8fb] p-3">{dictionary.schedule.workDays}</div>
          <div className="rounded-xl bg-[#f6f8fb] p-3">{dictionary.schedule.restDays}</div>
        </div>
      </Section>
    </>
  );
}

function ScheduleStats({ locale }: { locale: Extract<SchedulePageData, { state: "ready" }>["locale"] }) {
  const dictionary = getDictionary(locale);
  return (
    <>
      <Section title={dictionary.schedule.monthlyStats}>
        <div className="grid grid-cols-2 gap-3">
          {[
            [dictionary.schedule.workedDays, "24"],
            [dictionary.schedule.scheduledDays, "22"],
            [dictionary.schedule.attendanceRate, "96%"],
            [dictionary.schedule.remainingRestDays, "5"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[#f6f8fb] p-3">
              <p className="text-sm text-[#607089]">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={dictionary.schedule.shiftDistribution}>
        <div className="flex items-center gap-5">
          <div className="size-28 rounded-full" style={{ background: "conic-gradient(#2d6a4f 0 42%, #f4a261 42% 70%, #184e77 70% 100%)" }} />
          <div className="space-y-2 text-sm">
            <p>{dictionary.schedule.earlyShiftRatio}</p>
            <p>{dictionary.schedule.middleShiftRatio}</p>
            <p>{dictionary.schedule.nightShiftRatio}</p>
          </div>
        </div>
      </Section>
    </>
  );
}

function ScheduleDetailSheet({ day, locale, onClose }: { day: number; locale: Extract<SchedulePageData, { state: "ready" }>["locale"]; onClose: () => void }) {
  const dictionary = getDictionary(locale);
  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/30 p-3" onClick={onClose}>
      <div className="w-full max-w-[430px] rounded-3xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#d9dee8]" />
        <h3 className="text-lg font-semibold">{locale === "en" ? `Jan ${day} ${dictionary.schedule.detailTitle}` : `1月${day}日${dictionary.schedule.detailTitle}`}</h3>
        <div className="mt-4 space-y-3 text-sm">
          <p>{dictionary.schedule.shiftName}：{locale === "en" ? "Early Shift" : "早班"}</p>
          <p>{dictionary.schedule.startTime}：08:00</p>
          <p>{dictionary.schedule.endTime}：17:00</p>
          <p>{dictionary.schedule.workLocation}：{locale === "en" ? "HQ Building A" : "总部 A 座"}</p>
          <p>{dictionary.schedule.note}：{locale === "en" ? "Arrive 10 minutes early." : "需提前 10 分钟到岗"}</p>
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-[#184e77] py-3 text-sm font-medium text-white">
          {dictionary.schedule.understood}
        </button>
      </div>
    </div>
  );
}

function formatCurrentMonthLabel(locale: Extract<SchedulePageData, { state: "ready" }>["locale"]) {
  const now = new Date();
  return formatDate(now.toISOString(), locale, { year: "numeric", month: "long" });
}

function formatWorkDate(value: string, locale: Extract<SchedulePageData, { state: "ready" }>["locale"]) {
  return formatDate(value, locale, {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function getShiftColorClass(code: string) {
  return shiftMap[code]?.colorClass ?? "bg-[#f8fafc] text-[#8a97a8]";
}
