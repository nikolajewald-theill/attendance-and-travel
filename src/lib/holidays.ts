import { Holiday } from '@/types';

/** Danish public holidays, computed per year (movable holidays are Easter-based). */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function addDays(year: number, month: number, day: number, offset: number): string {
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Easter Sunday for a given year, via the Anonymous Gregorian (Meeus/Jones/Butcher) algorithm. */
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month: month - 1, day }; // 0-indexed month for Date()
}

function computeHolidaysForYear(year: number): Holiday[] {
  const easter = easterSunday(year);

  return [
    { date: `${year}-01-01`, name: 'Nytårsdag' },
    { date: addDays(year, easter.month, easter.day, -3), name: 'Skærtorsdag' },
    { date: addDays(year, easter.month, easter.day, -2), name: 'Langfredag' },
    { date: addDays(year, easter.month, easter.day, 0), name: 'Påskedag' },
    { date: addDays(year, easter.month, easter.day, 1), name: '2. Påskedag' },
    { date: addDays(year, easter.month, easter.day, 39), name: 'Kristi Himmelfartsdag' },
    { date: addDays(year, easter.month, easter.day, 49), name: 'Pinsedag' },
    { date: addDays(year, easter.month, easter.day, 50), name: '2. Pinsedag' },
    { date: `${year}-06-05`, name: 'Grundlovsdag' },
    { date: `${year}-12-24`, name: 'Juleaften' },
    { date: `${year}-12-25`, name: '1. Juledag' },
    { date: `${year}-12-26`, name: '2. Juledag' },
  ];
}

const holidaysCache = new Map<number, Holiday[]>();
const holidayMapCache = new Map<number, Map<string, string>>();

export function getHolidaysForYear(year: number): Holiday[] {
  let holidays = holidaysCache.get(year);
  if (!holidays) {
    holidays = computeHolidaysForYear(year);
    holidaysCache.set(year, holidays);
  }
  return holidays;
}

export function getHolidayMapForYear(year: number): Map<string, string> {
  let map = holidayMapCache.get(year);
  if (!map) {
    map = new Map(getHolidaysForYear(year).map((h) => [h.date, h.name]));
    holidayMapCache.set(year, map);
  }
  return map;
}
