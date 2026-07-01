'use client';

import { useState, useRef } from 'react';
import { Stats, DateRange } from '@/types';
import { DANISH_MONTHS, parseDate } from '@/lib/utils';
import DateRangePicker from './DateRangePicker';
import { createClient } from '@/lib/supabase/client';

interface Props {
  stats: Stats;
  dateRange: DateRange;
  onVacationAllowanceChange: (n: number) => void;
  onDateRangeChange: (range: DateRange) => void;
}

function ProgressBar({ value, target = 60 }: { value: number; target?: number }) {
  const capped = Math.min(value, 100);
  const metTarget = value >= target;

  const color = value >= target
    ? 'bg-emerald-500'
    : value >= target * 0.8
    ? 'bg-amber-400'
    : 'bg-rose-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span>0%</span>
        <span className="font-medium text-slate-700">{value.toFixed(1)}% fremmøde</span>
        <span>100%</span>
      </div>
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${capped}%` }}
        />
        {/* 60% target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
          style={{ left: `${target}%` }}
        />
        <div
          className="absolute -top-0.5 text-[9px] text-slate-500 font-bold"
          style={{ left: `calc(${target}% + 4px)` }}
        >
          {target}%
        </div>
      </div>
      <p className={`text-xs font-medium ${metTarget ? 'text-emerald-600' : 'text-rose-500'}`}>
        {metTarget
          ? `✓ Mål opnået (+${(value - target).toFixed(1)}%)`
          : `${(target - value).toFixed(1)}% mangler for at nå målet`}
      </p>
    </div>
  );
}

function formatRangeLabel(range: DateRange): string {
  const s = parseDate(range.start);
  const e = parseDate(range.end);
  if (range.start === '2026-01-01' && range.end === '2026-12-31') {
    return 'Hele 2026';
  }
  const fmt = (d: Date) =>
    `${d.getDate()}. ${DANISH_MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function Dashboard({ stats, dateRange, onVacationAllowanceChange, onDateRangeChange }: Props) {
  const [editingVacation, setEditingVacation] = useState(false);
  const [vacationInput, setVacationInput] = useState(String(stats.vacationAllowance));
  const [showPicker, setShowPicker] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: rows }, { data: settings }] = await Promise.all([
        supabase.from('attendance_days').select('date, day_type').eq('user_id', user.id),
        supabase.from('user_settings')
          .select('vacation_allowance, date_range_start, date_range_end')
          .eq('user_id', user.id)
          .single(),
      ]);

      const payload = {
        days: Object.fromEntries((rows ?? []).map((r) => [r.date, r.day_type])),
        vacationAllowance: settings?.vacation_allowance ?? 25,
        dateRange: {
          start: settings?.date_range_start ?? '2026-01-01',
          end: settings?.date_range_end ?? '2026-12-31',
        },
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fremmøde-2026.json';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.days || typeof parsed.days !== 'object') throw new Error('Ugyldigt format');

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const validTypes = new Set(['office', 'home', 'vacation', 'sick']);
        const dayRows = Object.entries(parsed.days as Record<string, string>)
          .filter(([, type]) => validTypes.has(type))
          .map(([date, day_type]) => ({ user_id: user.id, date, day_type }));

        // Replace all attendance days
        await supabase.from('attendance_days').delete().eq('user_id', user.id);
        if (dayRows.length > 0) {
          await supabase.from('attendance_days').insert(dayRows);
        }

        // Update settings if present in the file
        await supabase.from('user_settings').update({
          ...(typeof parsed.vacationAllowance === 'number' && {
            vacation_allowance: parsed.vacationAllowance,
          }),
          ...(parsed.dateRange?.start && { date_range_start: parsed.dateRange.start }),
          ...(parsed.dateRange?.end && { date_range_end: parsed.dateRange.end }),
        }).eq('user_id', user.id);

        window.location.reload();
      } catch {
        alert('Ugyldig fil — kunne ikke importere data.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  const handleVacationSave = () => {
    const n = parseInt(vacationInput, 10);
    if (!isNaN(n) && n >= 0) {
      onVacationAllowanceChange(n);
    }
    setEditingVacation(false);
  };

  const vacationPercent = stats.vacationAllowance > 0
    ? Math.min((stats.vacationDaysUsed / stats.vacationAllowance) * 100, 100)
    : 0;

  const isFiltered = dateRange.start !== '2026-01-01' || dateRange.end !== '2026-12-31';

  return (
    <>
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Title */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-800">Fremmøde 2026</h1>
            <p className="text-xs text-slate-500">Arbejde · Pendling · Ferie</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Attendance progress */}
            <div className="sm:col-span-2 bg-slate-50 rounded-xl p-4 space-y-3">
              {/* Period button — sits above the icon row */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPicker(true)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isFiltered
                      ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatRangeLabel(dateRange)}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-base">🏢</div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Fysisk Fremmøde</p>
                  <p className="text-sm font-bold text-slate-700">
                    {stats.officeDays} kontor-dage ud af {stats.netWorkingDays} netto-arbejdsdage
                  </p>
                </div>
              </div>
              <ProgressBar value={stats.attendancePercent} />
            </div>

            {/* Vacation */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-base">🏖️</div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Ferie</p>
                  {editingVacation ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="number"
                        className="w-16 text-sm border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        value={vacationInput}
                        onChange={(e) => setVacationInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleVacationSave(); if (e.key === 'Escape') setEditingVacation(false); }}
                        autoFocus
                      />
                      <span className="text-xs text-slate-500">dage</span>
                      <button onClick={handleVacationSave} className="text-xs text-emerald-600 font-medium ml-1 hover:text-emerald-700">Gem</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setVacationInput(String(stats.vacationAllowance)); setEditingVacation(true); }}
                      className="text-sm font-bold text-slate-700 hover:text-amber-600 transition-colors group flex items-center gap-1"
                    >
                      {stats.vacationDaysUsed} / {stats.vacationAllowance} dage
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${vacationPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {stats.remainingVacation > 0
                  ? `${stats.remainingVacation} dage tilbage`
                  : 'Alle feriedage brugt'}
              </p>
            </div>

            {/* Commute */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 text-base">🚆</div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Pendling</p>
                  <p className="text-sm font-bold text-slate-700">{stats.commuteTrips} ture</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Svendborg ↔ København</p>
              <p className="text-xs text-slate-400 mt-1">{stats.officeDays} kontor-dage (skattemæssigt)</p>
              {isFiltered && (
                <p className="text-xs text-blue-500 mt-1">{formatRangeLabel(dateRange)}</p>
              )}
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-base font-bold text-emerald-600">{stats.homeDays}</p>
                  <p className="text-xs text-slate-400">Hjemme</p>
                </div>
                <div>
                  <p className="text-base font-bold text-rose-500">{stats.sickDays}</p>
                  <p className="text-xs text-slate-400">Sygdom</p>
                </div>
              </div>
            </div>

          </div>

          {/* Legend + export/import */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {[
                { color: 'bg-blue-500', label: 'Kontor' },
                { color: 'bg-emerald-500', label: 'Hjemmearbejde' },
                { color: 'bg-amber-400', label: 'Ferie' },
                { color: 'bg-rose-400', label: 'Sygdom/Andet' },
                { color: 'bg-purple-400', label: 'Helligdag' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm ${color}`} />
                  {label}
                </span>
              ))}
            </div>

            {/* Data backup buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 hover:border-slate-300 rounded-md px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download data som JSON-fil"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {exporting ? 'Henter…' : 'Eksporter'}
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 hover:border-slate-300 rounded-md px-2 py-1"
                title="Indlæs data fra JSON-fil"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Importér
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <DateRangePicker
          current={dateRange}
          onApply={onDateRangeChange}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
