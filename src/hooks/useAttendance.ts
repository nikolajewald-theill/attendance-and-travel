'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DayType, Stats, DateRange } from '@/types';
import { computeStats, getDefaultDateRange, reanchorDateRangeToYear } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface YearSettingsRow {
  year: number;
  vacation_allowance: number;
  date_range_start: string;
  date_range_end: string;
}

export const CURRENT_CALENDAR_YEAR = new Date().getFullYear();

export function useAttendance() {
  const [days, setDays] = useState<Record<string, DayType>>({});
  const [year, setYearState] = useState<number>(CURRENT_CALENDAR_YEAR);
  const [vacationAllowance, setVacationAllowanceState] = useState(25);
  const [dateRange, setDateRangeState] = useState<DateRange>(getDefaultDateRange(CURRENT_CALENDAR_YEAR));
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const yearRowsRef = useRef<Map<number, YearSettingsRow>>(new Map());

  // Load settings for a year, creating a row (carrying over defaults) if none exists yet
  const loadYear = useCallback(async (targetYear: number, userId: string) => {
    let row = yearRowsRef.current.get(targetYear);

    if (!row) {
      const priorYears = Array.from(yearRowsRef.current.keys()).sort((a, b) => b - a);
      const priorRow = priorYears.length > 0 ? yearRowsRef.current.get(priorYears[0]) : undefined;

      const newRange = priorRow
        ? reanchorDateRangeToYear({ start: priorRow.date_range_start, end: priorRow.date_range_end }, targetYear)
        : getDefaultDateRange(targetYear);

      row = {
        year: targetYear,
        vacation_allowance: priorRow?.vacation_allowance ?? 25,
        date_range_start: newRange.start,
        date_range_end: newRange.end,
      };

      yearRowsRef.current.set(targetYear, row);
      await createClient().from('year_settings').insert({
        user_id: userId,
        year: row.year,
        vacation_allowance: row.vacation_allowance,
        date_range_start: row.date_range_start,
        date_range_end: row.date_range_end,
      });
    }

    setVacationAllowanceState(row.vacation_allowance);
    setDateRangeState({ start: row.date_range_start, end: row.date_range_end });
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('last_year')
        .eq('user_id', user.id)
        .maybeSingle();

      const initialYear = userSettings?.last_year && userSettings.last_year >= CURRENT_CALENDAR_YEAR
        ? userSettings.last_year
        : CURRENT_CALENDAR_YEAR;

      const { data: yearRows } = await supabase
        .from('year_settings')
        .select('year, vacation_allowance, date_range_start, date_range_end')
        .eq('user_id', user.id);

      if (yearRows) {
        for (const row of yearRows) yearRowsRef.current.set(row.year, row);
      }

      if (!userSettings) {
        await supabase.from('user_settings').insert({
          user_id: user.id,
          vacation_allowance: 25,
          date_range_start: getDefaultDateRange(initialYear).start,
          date_range_end: getDefaultDateRange(initialYear).end,
          last_year: initialYear,
        });
      }

      setYearState(initialYear);
      await loadYear(initialYear, user.id);

      // Load all attendance days for this user (dates already encode the year)
      const { data: rows } = await supabase
        .from('attendance_days')
        .select('date, day_type')
        .eq('user_id', user.id);

      if (rows) {
        const map: Record<string, DayType> = {};
        for (const row of rows) map[row.date] = row.day_type as DayType;
        setDays(map);
      }

      setHydrated(true);
    }

    load();
  }, [loadYear]);

  const setYear = useCallback((newYear: number) => {
    setYearState(newYear);
    const userId = userIdRef.current;
    if (!userId) return;
    loadYear(newYear, userId);
    createClient()
      .from('user_settings')
      .update({ last_year: newYear })
      .eq('user_id', userId)
      .then();
  }, [loadYear]);

  const setDayType = useCallback((dateStr: string, type: DayType) => {
    // Optimistic update
    setDays((prev) => {
      const next = { ...prev };
      if (type === null) delete next[dateStr];
      else next[dateStr] = type;
      return next;
    });

    const userId = userIdRef.current;
    if (!userId) return;
    const supabase = createClient();

    if (type === null) {
      supabase
        .from('attendance_days')
        .delete()
        .eq('user_id', userId)
        .eq('date', dateStr)
        .then();
    } else {
      supabase
        .from('attendance_days')
        .upsert(
          { user_id: userId, date: dateStr, day_type: type },
          { onConflict: 'user_id,date' }
        )
        .then();
    }
  }, []);

  const setVacationAllowance = useCallback((n: number) => {
    setVacationAllowanceState(n);
    const row = yearRowsRef.current.get(year);
    if (row) row.vacation_allowance = n;

    const userId = userIdRef.current;
    if (!userId) return;
    createClient()
      .from('year_settings')
      .update({ vacation_allowance: n })
      .eq('user_id', userId)
      .eq('year', year)
      .then();
  }, [year]);

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
    const row = yearRowsRef.current.get(year);
    if (row) {
      row.date_range_start = range.start;
      row.date_range_end = range.end;
    }

    const userId = userIdRef.current;
    if (!userId) return;
    createClient()
      .from('year_settings')
      .update({ date_range_start: range.start, date_range_end: range.end })
      .eq('user_id', userId)
      .eq('year', year)
      .then();
  }, [year]);

  const stats: Stats = computeStats(days, vacationAllowance, dateRange, year);

  return {
    days,
    year,
    vacationAllowance,
    dateRange,
    stats,
    hydrated,
    setDayType,
    setYear,
    setVacationAllowance,
    setDateRange,
  };
}
