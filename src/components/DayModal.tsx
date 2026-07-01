'use client';

import { useEffect, useRef } from 'react';
import { DayType } from '@/types';
import {
  DAY_TYPE_LABELS,
  DAY_TYPE_COLORS,
  DANISH_MONTHS,
  isWeekend,
  isHoliday,
  getHolidayName,
  parseDate,
} from '@/lib/utils';

interface Props {
  dateStr: string;
  currentType: DayType;
  onSelect: (type: DayType) => void;
  onClose: () => void;
}

const DAY_TYPES: DayType[] = ['office', 'home', 'vacation', 'sick'];

const TYPE_ICONS: Record<string, string> = {
  office: '🏢',
  home: '🏠',
  vacation: '🏖️',
  sick: '🤒',
};

export default function DayModal({ dateStr, currentType, onSelect, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const date = parseDate(dateStr);
  const day = date.getDate();
  const month = DANISH_MONTHS[date.getMonth()];
  const weekday = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'][date.getDay()];
  const holiday = getHolidayName(dateStr);
  const weekend = isWeekend(dateStr);
  const isPublicHoliday = isHoliday(dateStr);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest">{weekday}</p>
              <h2 className="text-2xl font-bold mt-0.5">
                {day}. {month} 2026
              </h2>
              {holiday && (
                <span className="inline-block mt-1 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                  {holiday}
                </span>
              )}
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
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          {(weekend || isPublicHoliday) && (
            <p className="text-xs text-slate-500 text-center pb-1">
              {isPublicHoliday ? 'Helligdag — du kan stadig registrere fremmøde' : 'Weekend — kun registrering af undtagelser'}
            </p>
          )}

          {DAY_TYPES.map((type) => {
            const isActive = currentType === type;
            return (
              <button
                key={type}
                onClick={() => { onSelect(isActive ? null : type); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
                  ${isActive
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
              >
                <span className="text-xl">{TYPE_ICONS[type!]}</span>
                <div className="flex-1">
                  <span className="font-medium">{DAY_TYPE_LABELS[type!]}</span>
                  {type === 'office' && (
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      Svendborg → København
                    </p>
                  )}
                </div>
                {isActive && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${DAY_TYPE_COLORS[type!]}`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}

          {currentType !== null && (
            <button
              onClick={() => { onSelect(null); onClose(); }}
              className="w-full text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              Fjern markering
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
