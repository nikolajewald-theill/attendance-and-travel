'use client';

import { useState, useEffect, useRef } from 'react';
import { DateRange } from '@/types';
import {
  DANISH_MONTHS,
  DANISH_DAY_SHORT,
  buildMonthGrid,
  isWeekend,
  isHoliday,
  getHolidayName,
  parseDate,
} from '@/lib/utils';

interface Props {
  current: DateRange;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}

function formatShort(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()}. ${DANISH_MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;
}

type PickStep = 'start' | 'end';

export default function DateRangePicker({ current, onApply, onClose }: Props) {
  // Which month pair is shown (0 = Jan/Feb, 1 = Mar/Apr, …)
  const [viewIndex, setViewIndex] = useState(0);

  // Temporary selection while user is picking
  const [tempStart, setTempStart] = useState<string | null>(current.start);
  const [tempEnd, setTempEnd] = useState<string | null>(current.end);
  const [step, setStep] = useState<PickStep>('start');
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Months shown: always 2, capped at 0-11
  const monthA = viewIndex * 2;
  const monthB = monthA + 1;
  const canPrev = viewIndex > 0;
  const canNext = monthB < 11;

  // During 'end' picking, show a preview range with hover
  const previewEnd = step === 'end' && hoverDate ? hoverDate : tempEnd;
  const rangeStart = tempStart;
  const rangeEnd = step === 'end' ? previewEnd : tempEnd;

  const sortedStart = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd)
    : rangeStart;
  const sortedEnd = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart)
    : rangeEnd;

  const handleDayClick = (dateStr: string) => {
    if (step === 'start') {
      setTempStart(dateStr);
      setTempEnd(null);
      setStep('end');
    } else {
      // end step — sort automatically
      if (tempStart && dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
      setStep('start'); // done picking, ready for new cycle
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      const s = tempStart <= tempEnd ? tempStart : tempEnd;
      const e = tempStart <= tempEnd ? tempEnd : tempStart;
      onApply({ start: s, end: e });
    } else if (tempStart) {
      onApply({ start: tempStart, end: tempStart });
    }
    onClose();
  };

  const handleReset = () => {
    setTempStart('2026-01-01');
    setTempEnd('2026-12-31');
    setStep('start');
  };

  const getDayClasses = (dateStr: string): string => {
    const isStart = dateStr === sortedStart;
    const isEnd = dateStr === sortedEnd;
    const inRange = sortedStart && sortedEnd
      ? dateStr > sortedStart && dateStr < sortedEnd
      : false;
    const isHover = step === 'end' && dateStr === hoverDate;

    let base = 'relative flex items-center justify-center text-xs transition-colors';

    if (isStart && isEnd) {
      return `${base} rounded-full bg-blue-600 text-white font-bold`;
    }
    if (isStart) {
      return `${base} rounded-l-full bg-blue-600 text-white font-bold`;
    }
    if (isEnd) {
      return `${base} rounded-r-full bg-blue-600 text-white font-bold`;
    }
    if (inRange) {
      return `${base} bg-blue-100 text-blue-800`;
    }
    if (isHover && step === 'end') {
      return `${base} rounded-full bg-blue-200 text-blue-700`;
    }
    return base;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base">Vælg beregningsperiode</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {step === 'start' ? 'Klik på en startdato' : 'Klik nu på en slutdato'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Luk"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected range display */}
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <button
            onClick={() => setStep('start')}
            className={`flex-1 text-center rounded-lg px-3 py-2 text-sm transition-colors border-2 ${
              step === 'start'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                : 'border-transparent hover:border-slate-200 text-slate-600'
            }`}
          >
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Fra</span>
            <span className="font-medium">{tempStart ? formatShort(tempStart) : '—'}</span>
          </button>

          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          <button
            onClick={() => { if (tempStart) setStep('end'); }}
            className={`flex-1 text-center rounded-lg px-3 py-2 text-sm transition-colors border-2 ${
              step === 'end'
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                : 'border-transparent hover:border-slate-200 text-slate-600'
            }`}
          >
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Til</span>
            <span className="font-medium">{tempEnd ? formatShort(tempEnd) : '—'}</span>
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button
            onClick={() => setViewIndex((v) => v - 1)}
            disabled={!canPrev}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Forrige"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {DANISH_MONTHS[monthA]}
            {monthB <= 11 ? ` · ${DANISH_MONTHS[monthB]}` : ''}
          </span>
          <button
            onClick={() => setViewIndex((v) => v + 1)}
            disabled={!canNext}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Næste"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Two months side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-4">
          {[monthA, monthB].map((month) => {
            if (month > 11) return null;
            const cells = buildMonthGrid(2026, month);

            return (
              <div key={month}>
                <p className="text-center text-xs font-semibold text-slate-600 mb-2">
                  {DANISH_MONTHS[month]}
                </p>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DANISH_DAY_SHORT.map((d, i) => (
                    <div
                      key={d}
                      className={`text-center text-[9px] font-semibold ${i >= 5 ? 'text-slate-300' : 'text-slate-400'}`}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-y-0.5">
                  {cells.map((day, idx) => {
                    if (day === null) return <div key={`e-${idx}`} className="h-7" />;

                    const dateStr = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const weekend = isWeekend(dateStr);
                    const holiday = isHoliday(dateStr);
                    const holidayName = getHolidayName(dateStr);

                    const dayClasses = getDayClasses(dateStr);
                    const baseText = weekend ? 'text-slate-300' : holiday ? 'text-purple-600' : 'text-slate-700';
                    // Only apply baseText if no special selection class applied
                    const hasSelection = dayClasses.includes('bg-blue');

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(dateStr)}
                        onMouseEnter={() => setHoverDate(dateStr)}
                        onMouseLeave={() => setHoverDate(null)}
                        title={holidayName ?? undefined}
                        className={`h-7 ${getDayClasses(dateStr)} ${hasSelection ? '' : baseText} hover:bg-slate-100 focus:outline-none`}
                      >
                        {day}
                        {holiday && !hasSelection && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Hele 2026
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuller
            </button>
            <button
              onClick={handleApply}
              disabled={!tempStart}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anvend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
