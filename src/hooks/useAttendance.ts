'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DayType, Stats, DateRange } from '@/types';
import { computeStats, DEFAULT_DATE_RANGE } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export function useAttendance() {
  const [days, setDays] = useState<Record<string, DayType>>({});
  const [vacationAllowance, setVacationAllowanceState] = useState(25);
  const [dateRange, setDateRangeState] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      // Load user settings; insert defaults on first login
      const { data: settings } = await supabase
        .from('user_settings')
        .select('vacation_allowance, date_range_start, date_range_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings) {
        setVacationAllowanceState(settings.vacation_allowance);
        setDateRangeState({
          start: settings.date_range_start,
          end: settings.date_range_end,
        });
      } else {
        await supabase.from('user_settings').insert({
          user_id: user.id,
          vacation_allowance: 25,
          date_range_start: DEFAULT_DATE_RANGE.start,
          date_range_end: DEFAULT_DATE_RANGE.end,
        });
      }

      // Load all attendance days for this user
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
  }, []);

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
    const userId = userIdRef.current;
    if (!userId) return;
    createClient()
      .from('user_settings')
      .update({ vacation_allowance: n })
      .eq('user_id', userId)
      .then();
  }, []);

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
    const userId = userIdRef.current;
    if (!userId) return;
    createClient()
      .from('user_settings')
      .update({ date_range_start: range.start, date_range_end: range.end })
      .eq('user_id', userId)
      .then();
  }, []);

  const stats: Stats = computeStats(days, vacationAllowance, dateRange);

  return {
    days,
    vacationAllowance,
    dateRange,
    stats,
    hydrated,
    setDayType,
    setVacationAllowance,
    setDateRange,
  };
}
