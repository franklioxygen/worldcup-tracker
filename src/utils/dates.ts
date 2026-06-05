import type { Language } from '../types';

export function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(localDate: string): Date {
  const [datePart, timePart] = localDate.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function getDateKey(localDate: string): string {
  const [datePart] = localDate.split(' ');
  const [month, day, year] = datePart.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hours: get('hour') % 24,
    minutes: get('minute'),
  };
}

/** Converts a stadium-local datetime (MM/DD/YYYY HH:mm) to a UTC instant. */
export function stadiumLocalToDate(localDate: string, timeZone: string): Date {
  const [datePart, timePart] = localDate.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  let utc = Date.UTC(year, month - 1, day, hours, minutes);

  for (let i = 0; i < 8; i++) {
    const zoned = getZonedParts(new Date(utc), timeZone);
    const diffMin =
      minutes - zoned.minutes +
      (hours - zoned.hours) * 60 +
      (day - zoned.day) * 1440 +
      (month - zoned.month) * 43200 +
      (year - zoned.year) * 525600;
    if (diffMin === 0) break;
    utc += diffMin * 60_000;
  }

  return new Date(utc);
}

export function formatUserLocalTime(date: Date, lang: Language): string {
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function formatDateLabel(dateKey: string, lang: Language): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (lang === 'zh') {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

export function formatShortDate(dateKey: string, lang: Language): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (lang === 'zh') {
    return `${month}月${day}日`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isToday(dateKey: string): boolean {
  return dateKey === getTodayKey();
}

export function getCurrentOrNextDateKey(dateKeys: string[]): string {
  if (dateKeys.length === 0) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...dateKeys].sort();

  for (const key of sorted) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date >= today) return key;
  }

  return sorted[sorted.length - 1];
}
