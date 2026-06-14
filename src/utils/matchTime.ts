import { t } from '../i18n/translations';
import type { Language, MatchPhase } from '../types';
import { isKnockoutMatch } from './matchPhase';

const HALFTIME_PATTERN = /^(ht|half\s*time|halftime|half-time)$/i;
const ET_HALFTIME_PATTERN = /^(et\s*ht|et\s*halftime|extra\s*time\s*ht|extra\s*time\s*halftime|et\s*break)$/i;
const PENALTY_PATTERN = /^(pen|pens|penalties|penalty|shootout|penalty\s*shootout|pen_?live|penalties_?live)$/i;
const ET_PATTERN = /^(et|extra\s*time|extratime|et1|et2)$/i;

function formatMinuteLabel(minutes: number, lang: Language): string {
  if (lang === 'zh') return `${minutes}分钟`;
  return minutes === 1 ? '1 min' : `${minutes} mins`;
}

function formatStoppageLabel(base: number, extra: number, lang: Language): string {
  if (lang === 'zh') return `${base}+${extra}分钟`;
  return `${base}+${extra} mins`;
}

function formatExtraTimeMinute(minute: number, lang: Language): string {
  if (lang === 'zh') return `加时 ${minute}分钟`;
  return `ET ${minute}${minute === 1 ? ' min' : ' mins'}`;
}

function formatExtraTimeStoppage(base: number, extra: number, lang: Language): string {
  if (lang === 'zh') return `加时 ${base}+${extra}分钟`;
  return `ET ${base}+${extra} mins`;
}

/** Rough wall-clock phases when the API only returns "live" (no minute/HT value). */
const FIRST_HALF_WALL_MINS = 50;
const HALFTIME_BREAK_MINS = 15;
const HALFTIME_BUFFER_MINS = 5;
const SECOND_HALF_STOPPAGE_WALL_MINS = 5;
const EXTRA_TIME_BREAK_WALL_MINS = 5;
const EXTRA_TIME_HALF_WALL_MINS = 15;
const EXTRA_TIME_HALFTIME_WALL_MINS = 5;

function estimateElapsedFromKickoff(
  kickoff: Date,
  lang: Language,
  now: Date,
  matchType: string,
): string {
  const wallMins = Math.floor((now.getTime() - kickoff.getTime()) / 60_000);
  if (wallMins < 0) return '';

  if (wallMins <= 45) {
    return formatMinuteLabel(wallMins, lang);
  }

  if (wallMins <= FIRST_HALF_WALL_MINS) {
    return formatStoppageLabel(45, wallMins - 45, lang);
  }

  const halftimeEnd = FIRST_HALF_WALL_MINS + HALFTIME_BREAK_MINS + HALFTIME_BUFFER_MINS;
  if (wallMins <= halftimeEnd) {
    return t(lang, 'halfTime');
  }

  const secondHalfStart = halftimeEnd;
  const regulationEnd = secondHalfStart + 45 + SECOND_HALF_STOPPAGE_WALL_MINS;
  const secondHalfMins = wallMins - secondHalfStart;
  const matchMins = 45 + secondHalfMins;

  if (!isKnockoutMatch(matchType)) {
    if (matchMins > 90) {
      return formatStoppageLabel(90, matchMins - 90, lang);
    }
    return formatMinuteLabel(matchMins, lang);
  }

  if (wallMins <= regulationEnd) {
    if (matchMins > 90) {
      return formatStoppageLabel(90, matchMins - 90, lang);
    }
    return formatMinuteLabel(matchMins, lang);
  }

  let cursor = regulationEnd + EXTRA_TIME_BREAK_WALL_MINS;
  if (wallMins <= cursor) {
    return t(lang, 'extraTime');
  }

  const etFirstHalfEnd = cursor + EXTRA_TIME_HALF_WALL_MINS + SECOND_HALF_STOPPAGE_WALL_MINS;
  if (wallMins <= etFirstHalfEnd) {
    const etMinute = 90 + (wallMins - cursor);
    if (etMinute > 105) {
      return formatExtraTimeStoppage(105, etMinute - 105, lang);
    }
    return formatExtraTimeMinute(etMinute, lang);
  }

  cursor = etFirstHalfEnd + EXTRA_TIME_HALFTIME_WALL_MINS;
  if (wallMins <= cursor) {
    return t(lang, 'extraTimeHalfTime');
  }

  const etSecondHalfEnd = cursor + EXTRA_TIME_HALF_WALL_MINS + SECOND_HALF_STOPPAGE_WALL_MINS;
  if (wallMins <= etSecondHalfEnd) {
    const etMinute = 105 + (wallMins - cursor);
    if (etMinute > 120) {
      return formatExtraTimeStoppage(120, etMinute - 120, lang);
    }
    return formatExtraTimeMinute(etMinute, lang);
  }

  return t(lang, 'penalties');
}

function formatNumericMinute(minute: number, lang: Language, knockout: boolean): string {
  if (!knockout || minute <= 90) {
    return formatMinuteLabel(minute, lang);
  }
  return formatExtraTimeMinute(minute, lang);
}

function formatStoppageFromRaw(base: number, extra: number, lang: Language, knockout: boolean): string {
  if (knockout && base >= 90) {
    return formatExtraTimeStoppage(base, extra, lang);
  }
  return formatStoppageLabel(base, extra, lang);
}

export function formatMatchElapsedTime(
  timeElapsed: string,
  lang: Language,
  options: {
    kickoff?: Date;
    now?: Date;
    matchType?: string;
    phase?: MatchPhase;
  } = {},
): string | null {
  const { kickoff, now = new Date(), matchType = 'group', phase } = options;
  const raw = timeElapsed.trim();
  if (!raw || raw === 'notstarted' || raw === 'null') return null;

  if (phase === 'penalties' || PENALTY_PATTERN.test(raw)) {
    return t(lang, 'penalties');
  }

  if (phase === 'extraTimeHalftime' || ET_HALFTIME_PATTERN.test(raw)) {
    return t(lang, 'extraTimeHalfTime');
  }

  if (HALFTIME_PATTERN.test(raw)) {
    return t(lang, 'halfTime');
  }

  if (ET_PATTERN.test(raw)) {
    return t(lang, 'extraTime');
  }

  if (raw.toLowerCase() === 'live') {
    return kickoff
      ? estimateElapsedFromKickoff(kickoff, lang, now, matchType) || null
      : null;
  }

  const knockout = isKnockoutMatch(matchType);

  const stoppageMatch = raw.match(/^(\d+)\s*\+\s*(\d+)['']?$/);
  if (stoppageMatch) {
    return formatStoppageFromRaw(
      Number(stoppageMatch[1]),
      Number(stoppageMatch[2]),
      lang,
      knockout,
    );
  }

  const minuteMatch = raw.match(/^(\d+)['']?$/);
  if (minuteMatch) {
    return formatNumericMinute(Number(minuteMatch[1]), lang, knockout);
  }

  return raw;
}
