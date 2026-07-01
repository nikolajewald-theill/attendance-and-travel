'use client';

import { useState, useEffect } from 'react';
import { DayType } from '@/types';
import MonthView from './MonthView';
import DayModal from './DayModal';

const hiddenKeyForYear = (year: number) => `hidden-months-${year}`;

interface Props {
  year: number;
  days: Record<string, DayType>;
  onDayType: (dateStr: string, type: DayType) => void;
}

export default function Calendar({ year, days, onDayType }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hiddenMonths, setHiddenMonths] = useState<Set<number>>(new Set());

  // Load hidden months from localStorage whenever the year changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(hiddenKeyForYear(year));
      setHiddenMonths(raw ? new Set(JSON.parse(raw) as number[]) : new Set());
    } catch {
      setHiddenMonths(new Set());
    }
  }, [year]);

  const toggleHiddenMonth = (month: number) => {
    setHiddenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      localStorage.setItem(hiddenKeyForYear(year), JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleModalClose = () => setSelectedDate(null);

  const handleModalSelect = (type: DayType) => {
    if (selectedDate) onDayType(selectedDate, type);
    setSelectedDate(null);
  };

  const hiddenCount = hiddenMonths.size;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {hiddenCount > 0 && (
          <div className="flex justify-end mb-3">
            <button
              onClick={() => {
                setHiddenMonths(new Set());
                localStorage.removeItem(hiddenKeyForYear(year));
              }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Vis alle måneder ({hiddenCount} skjult)
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <MonthView
              key={i}
              year={year}
              month={i}
              days={days}
              isHidden={hiddenMonths.has(i)}
              onDayClick={setSelectedDate}
              onToggleHide={() => toggleHiddenMonth(i)}
            />
          ))}
        </div>
      </div>

      {selectedDate && (
        <DayModal
          dateStr={selectedDate}
          currentType={days[selectedDate] ?? null}
          onSelect={handleModalSelect}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
