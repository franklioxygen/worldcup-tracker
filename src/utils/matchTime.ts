import { t } from '../i18n/translations';
import type { Language } from '../types';

const HALFTIME_PATTERN = /^(ht|half\s*time|halftime|half-time)$/i;

function formatMinuteLabel(minutes: number, lang: Language): string {
  if (lang === 'zh') return `${minutes}分钟`;
  return minutes === 1 ? '1 min' : `${minutes} mins`;
}

/** Rough wall-clock phases when the API only returns "live" (no minute/HT value). */
const FIRST_HALF_WALL_MINS = 50;
const HALFTIME_BREAK_MINS = 15;
const HALFTIME_BUFFER_MINS = 5;

function estimateElapsedFromKickoff(kickoff: Date, lang: Language, now: Date): string {
  const wallMins = Math.floor((now.getTime() - kickoff.getTime()) / 60_000);
  if (wallMins < 0) return '';

  if (wallMins <= 45) {
    return formatMinuteLabel(wallMins, lang);
  }

  if (wallMins <= FIRST_HALF_WALL_MINS) {
    const stoppage = wallMins - 45;
    if (lang === 'zh') return `45+${stoppage}分钟`;
    return `45+${stoppage} mins`;
  }

  const halftimeEnd = FIRST_HALF_WALL_MINS + HALFTIME_BREAK_MINS + HALFTIME_BUFFER_MINS;
  if (wallMins <= halftimeEnd) {
    return t(lang, 'halfTime');
  }

  const secondHalfMins = wallMins - halftimeEnd;
  const matchMins = 45 + secondHalfMins;
  if (matchMins > 90) {
    const extra = matchMins - 90;
    if (lang === 'zh') return `90+${extra}分钟`;
    return `90+${extra} mins`;
  }
  return formatMinuteLabel(matchMins, lang);
}

export function formatMatchElapsedTime(
  timeElapsed: string,
  lang: Language,
  kickoff?: Date,
  now: Date = new Date(),
): string | null {
  const raw = timeElapsed.trim();
  if (!raw || raw === 'notstarted' || raw === 'null') return null;

  if (HALFTIME_PATTERN.test(raw)) {
    return t(lang, 'halfTime');
  }

  if (raw.toLowerCase() === 'live') {
    return kickoff ? estimateElapsedFromKickoff(kickoff, lang, now) || null : null;
  }

  const stoppageMatch = raw.match(/^(\d+)\s*\+\s*(\d+)['']?$/);
  if (stoppageMatch) {
    const base = Number(stoppageMatch[1]);
    const extra = Number(stoppageMatch[2]);
    if (lang === 'zh') return `${base}+${extra}分钟`;
    return `${base}+${extra} mins`;
  }

  const minuteMatch = raw.match(/^(\d+)['']?$/);
  if (minuteMatch) {
    return formatMinuteLabel(Number(minuteMatch[1]), lang);
  }

  return raw;
}
