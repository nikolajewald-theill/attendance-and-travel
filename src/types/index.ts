export type DayType = 'office' | 'home' | 'vacation' | 'sick' | null;

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface Stats {
  totalWeekdays: number;
  holidayWeekdays: number;
  baseWorkingDays: number;
  vacationDaysUsed: number;
  netWorkingDays: number;
  officeDays: number;
  homeDays: number;
  sickDays: number;
  attendancePercent: number;
  commuteTrips: number;
  vacationAllowance: number;
  remainingVacation: number;
}
