export type MainView = "home" | "approval" | "schedule" | "checkin" | "profile" | "adminSchedule" | "adminApproval";

export type ShiftCode = "ZC" | "ZB" | "WC" | "XIU" | "-";

export type ShiftViewModel = {
  code: ShiftCode;
  name: string;
  time: string;
  colorClass: string;
};

export type WeekScheduleItem = {
  day: string;
  date: string;
  shift: ShiftViewModel;
};

export type CalendarDay = {
  day: number;
  shift: ShiftViewModel;
} | null;
