import type { CalendarDay, ShiftViewModel, WeekScheduleItem } from "./types";

export const shiftMap: Record<string, ShiftViewModel> = {
  ZC: { code: "ZC", name: "早班", time: "08:00-17:00", colorClass: "bg-[#d8f3dc] text-[#1b4332]" },
  ZB: { code: "ZB", name: "中班", time: "12:00-21:00", colorClass: "bg-[#ffe8cc] text-[#7f4f24]" },
  WC: { code: "WC", name: "晚班", time: "21:00-06:00", colorClass: "bg-[#dbeafe] text-[#1e3a8a]" },
  XIU: { code: "XIU", name: "休息", time: "-", colorClass: "bg-[#edf2f7] text-[#4a5568]" },
  "-": { code: "-", name: "未排班", time: "-", colorClass: "bg-[#f8fafc] text-[#8a97a8]" },
};

export const weekSchedule: WeekScheduleItem[] = [
  { day: "周一", date: "1/1", shift: shiftMap.ZC },
  { day: "周二", date: "1/2", shift: shiftMap.ZB },
  { day: "周三", date: "1/3", shift: shiftMap.XIU },
  { day: "周四", date: "1/4", shift: shiftMap.ZC },
  { day: "周五", date: "1/5", shift: shiftMap.WC },
  { day: "周六", date: "1/6", shift: shiftMap.XIU },
  { day: "周日", date: "1/7", shift: shiftMap.ZC },
];

export const calendarDays: CalendarDay[] = Array.from({ length: 35 }, (_, index) => {
  const day = index - 1;
  const pool = [shiftMap.ZC, shiftMap.ZB, shiftMap.XIU, shiftMap.WC];
  return day > 0 && day <= 31 ? { day, shift: pool[day % pool.length] } : null;
});

export const adminScheduleRows = [
  { employee: "张三", employeeNo: "E001", department: "客服部", week: weekSchedule },
  { employee: "李四", employeeNo: "E002", department: "客服部", week: weekSchedule },
  { employee: "王五", employeeNo: "E003", department: "运营部", week: weekSchedule },
];
