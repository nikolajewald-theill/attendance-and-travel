import { Holiday } from '@/types';

// Danish public holidays for 2026.
// Easter 2026 = April 5 (computed via Butcher's algorithm).
// Note: Store Bededag was abolished in 2023 and is NOT included.
export const DANISH_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: 'Nytårsdag' },           // Thursday
  { date: '2026-04-02', name: 'Skærtorsdag' },          // Thursday
  { date: '2026-04-03', name: 'Langfredag' },            // Friday
  { date: '2026-04-05', name: 'Påskedag' },              // Sunday
  { date: '2026-04-06', name: '2. Påskedag' },           // Monday
  { date: '2026-05-14', name: 'Kristi Himmelfartsdag' }, // Thursday (Easter+39)
  { date: '2026-05-24', name: 'Pinsedag' },              // Sunday  (Easter+49)
  { date: '2026-05-25', name: '2. Pinsedag' },           // Monday  (Easter+50)
  { date: '2026-06-05', name: 'Grundlovsdag' },          // Friday
  { date: '2026-12-24', name: 'Juleaften' },             // Thursday
  { date: '2026-12-25', name: '1. Juledag' },            // Friday
  { date: '2026-12-26', name: '2. Juledag' },            // Saturday
];

export const holidayMap = new Map<string, string>(
  DANISH_HOLIDAYS_2026.map((h) => [h.date, h.name])
);
