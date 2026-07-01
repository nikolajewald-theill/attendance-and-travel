import { DayType, Stats, DateRange } from '@/types';
import { holidayMap } from '@/lib/holidays';

export const DANISH_MONTHS = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December',
];

export const DANISH_DAY_SHORT = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

/** Format a Date as YYYY-MM-DD */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as a local date (avoids UTC offset issues) */
export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Returns true if the date string is a Saturday or Sunday */
export function isWeekend(dateStr: string): boolean {
  const d = parseDate(dateStr);
  const dow = d.getDay(); // 0=Sun, 6=Sat
  return dow === 0 || dow === 6;
}

/** Returns true if the date string is a Danish public holiday */
export function isHoliday(dateStr: string): boolean {
  return holidayMap.has(dateStr);
}

/** Returns holiday name or null */
export function getHolidayName(dateStr: string): string | null {
  return holidayMap.get(dateStr) ?? null;
}

/** Returns true if this is a "working day" (weekday, non-holiday) */
export function isWorkingDay(dateStr: string): boolean {
  return !isWeekend(dateStr) && !isHoliday(dateStr);
}

/** Build an array of all dates (YYYY-MM-DD) in the year */
export function getAllDatesInYear(year: number): string[] {
  const dates: string[] = [];
  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    dates.push(toDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Build an array of day numbers for a given month (1-indexed), with leading nulls for offset */
export function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  // Convert to Mon=0 … Sun=6
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export const DEFAULT_DATE_RANGE: DateRange = {
  start: '2026-01-01',
  end: '2026-12-31',
};

/** Compute all statistics, optionally scoped to a date range */
export function computeStats(
  days: Record<string, DayType>,
  vacationAllowance: number,
  range: DateRange = DEFAULT_DATE_RANGE
): Stats {
  const allDates = getAllDatesInYear(2026).filter(
    (d) => d >= range.start && d <= range.end
  );

  let totalWeekdays = 0;
  let holidayWeekdays = 0;
  let vacationDaysUsed = 0;
  let officeDays = 0;
  let homeDays = 0;
  let sickDays = 0;

  for (const date of allDates) {
    const weekend = isWeekend(date);
    const holiday = isHoliday(date);
    const type = days[date] ?? null;

    if (!weekend) {
      totalWeekdays++;
      if (holiday) {
        holidayWeekdays++;
      } else {
        // Pure working day
        if (type === 'vacation') vacationDaysUsed++;
        if (type === 'office') officeDays++;
        if (type === 'home') homeDays++;
        if (type === 'sick') sickDays++;
      }
    }
  }

  const baseWorkingDays = totalWeekdays - holidayWeekdays;
  const netWorkingDays = Math.max(baseWorkingDays - vacationDaysUsed, 0);
  const attendancePercent = netWorkingDays > 0
    ? Math.round((officeDays / netWorkingDays) * 100 * 10) / 10
    : 0;
  const commuteTrips = officeDays;
  const remainingVacation = vacationAllowance - vacationDaysUsed;

  return {
    totalWeekdays,
    holidayWeekdays,
    baseWorkingDays,
    vacationDaysUsed,
    netWorkingDays,
    officeDays,
    homeDays,
    sickDays,
    attendancePercent,
    commuteTrips,
    vacationAllowance,
    remainingVacation,
  };
}

/** Day-type labels in Danish */
export const DAY_TYPE_LABELS: Record<string, string> = {
  office: 'Kontor',
  home: 'Hjemmearbejde',
  vacation: 'Ferie',
  sick: 'Sygdom/Andet',
};

/** Tailwind bg classes for each day type */
export const DAY_TYPE_COLORS: Record<string, string> = {
  office: 'bg-blue-500',
  home: 'bg-emerald-500',
  vacation: 'bg-amber-400',
  sick: 'bg-rose-400',
};

export const DAY_TYPE_TEXT_COLORS: Record<string, string> = {
  office: 'text-blue-700 bg-blue-100',
  home: 'text-emerald-700 bg-emerald-100',
  vacation: 'text-amber-700 bg-amber-100',
  sick: 'text-rose-700 bg-rose-100',
};
