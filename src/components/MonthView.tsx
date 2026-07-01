'use client';

import { DayType } from '@/types';
import {
  DANISH_MONTHS,
  DANISH_DAY_SHORT,
  buildMonthGrid,
  isWeekend,
  isHoliday,
  getHolidayName,
  DAY_TYPE_COLORS,
} from '@/lib/utils';

interface Props {
  year: number;
  month: number; // 0-indexed
  days: Record<string, DayType>;
  isHidden: boolean;
  onDayClick: (dateStr: string) => void;
  onToggleHide: () => void;
}

/** Count day-types for a single month (used in collapsed summary) */
function getMonthSummary(year: number, month: number, days: Record<string, DayType>) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let office = 0, home = 0, vacation = 0, sick = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const t = days[dateStr];
    if (t === 'office') office++;
    else if (t === 'home') home++;
    else if (t === 'vacation') vacation++;
    else if (t === 'sick') sick++;
  }
  return { office, home, vacation, sick };
}

export default function MonthView({ year, month, days, isHidden, onDayClick, onToggleHide }: Props) {
  const cells = buildMonthGrid(year, month);
  const monthName = DANISH_MONTHS[month];

  // Collapsed view
  if (isHidden) {
    const { office, home, vacation, sick } = getMonthSummary(year, month, days);
    const hasData = office + home + vacation + sick > 0;

    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-800 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-bold tracking-wide shrink-0">{monthName}</h3>
            {hasData && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 overflow-hidden">
                {office > 0 && <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-blue-400 shrink-0" />{office}</span>}
                {home > 0  && <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-emerald-400 shrink-0" />{home}</span>}
                {vacation > 0 && <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-amber-400 shrink-0" />{vacation}</span>}
                {sick > 0  && <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-rose-400 shrink-0" />{sick}</span>}
              </div>
            )}
            {!hasData && <span className="text-[10px] text-slate-500">Ingen registreringer</span>}
          </div>
          <button
            onClick={onToggleHide}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-medium shrink-0 ml-2"
            aria-label="Vis måned"
          >
            Vis
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Month header */}
      <div className="bg-slate-800 text-white px-3 py-2.5 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wide">{monthName}</h3>
        <button
          onClick={onToggleHide}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-medium"
          aria-label="Skjul måned"
        >
          Skjul
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DANISH_DAY_SHORT.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-semibold py-1.5 ${
              i >= 5 ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const weekend = isWeekend(dateStr);
          const holiday = isHoliday(dateStr);
          const holidayName = getHolidayName(dateStr);
          const type = days[dateStr] ?? null;

          let bgClass = '';
          let textClass = '';
          let dotColor = '';

          if (type) {
            bgClass = DAY_TYPE_COLORS[type];
            textClass = 'text-white font-semibold';
          } else if (holiday) {
            bgClass = 'bg-purple-100';
            textClass = 'text-purple-700 font-medium';
          } else if (weekend) {
            bgClass = '';
            textClass = 'text-slate-300';
          } else {
            bgClass = '';
            textClass = 'text-slate-700 hover:bg-slate-50';
          }

          if (holiday && type) dotColor = 'bg-purple-400';

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              title={holidayName ?? undefined}
              className={`
                relative aspect-square flex items-center justify-center text-xs
                transition-all duration-150 rounded-sm m-[1px]
                ${bgClass} ${textClass}
                ${!type ? 'hover:scale-110' : ''}
                ${type ? 'shadow-sm' : ''}
                focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1
              `}
            >
              <span className="leading-none">{day}</span>
              {dotColor && (
                <span className={`absolute bottom-[2px] right-[2px] w-1 h-1 rounded-full ${dotColor}`} />
              )}
              {holiday && !type && (
                <span className="absolute bottom-[2px] right-[2px] w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
