export function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function monthCellDays(year: number, month: number) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = daysInMonth(year, month);
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function dateISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function monthRange(year: number, month: number) {
  return {
    start: dateISO(year, month, 1),
    end: dateISO(year, month, daysInMonth(year, month)),
  };
}

export function weekdayLabels(language: string) {
  const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, 1 + index)));
}

export function monthTitle(year: number, month: number, language: string) {
  return new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
}

export function formatLongDate(iso: string, language: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(new Date(year, (month ?? 1) - 1, day ?? 1));
}

export function addDaysISO(iso: string, days: number) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, (day ?? 1) + days);
  return localDateISO(date);
}

export function currentStreak(completedDates: string[], today = localDateISO()) {
  const set = new Set(completedDates);
  if (set.has(today)) {
    let length = 0;
    let cursor = today;
    while (set.has(cursor)) {
      length += 1;
      cursor = addDaysISO(cursor, -1);
    }
    return length;
  }

  let length = 0;
  let cursor = addDaysISO(today, -1);
  while (set.has(cursor)) {
    length += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return length;
}
