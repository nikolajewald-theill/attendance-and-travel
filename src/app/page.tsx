'use client';

import { useAttendance } from '@/hooks/useAttendance';
import Dashboard from '@/components/Dashboard';
import Calendar from '@/components/Calendar';
import SignOutButton from '@/components/SignOutButton';

export default function Home() {
  const {
    days,
    stats,
    dateRange,
    hydrated,
    setDayType,
    setVacationAllowance,
    setDateRange,
  } = useAttendance();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm">Indlæser...</div>
      </div>
    );
  }

  return (
    <main>
      <div className="fixed top-2 right-3 z-50">
        <SignOutButton />
      </div>
      <div className="sticky top-0 z-40">
        <Dashboard
          stats={stats}
          dateRange={dateRange}
          onVacationAllowanceChange={setVacationAllowance}
          onDateRangeChange={setDateRange}
        />
      </div>
      <Calendar days={days} onDayType={setDayType} />
    </main>
  );
}
