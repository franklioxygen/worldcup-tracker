import type { ApiGame, MatchPhase } from '../types';

const FINISHED_ELAPSED =
  /^(finished|ft|full\s*time|fulltime|aet|ft_?pen|pen_?finished|after\s*extra\s*time|after\s*penalties)$/i;
const PENALTY_ELAPSED =
  /^(pen|pens|penalties|penalty|shootout|penalty\s*shootout|pen_?live|penalties_?live)$/i;
const ET_HALFTIME_ELAPSED =
  /^(et\s*ht|et\s*halftime|extra\s*time\s*ht|extra\s*time\s*halftime|et\s*break)$/i;
const ET_ELAPSED = /^(et|extra\s*time|extratime|et1|et2)$/i;
const HALFTIME_ELAPSED = /^(ht|half\s*time|halftime|half-time)$/i;

const KNOCKOUT_TYPES = new Set(['r32', 'r16', 'qf', 'sf', 'third', 'final']);

export function isKnockoutMatch(type: string): boolean {
  return KNOCKOUT_TYPES.has(type);
}

function readOptionalScore(game: ApiGame, keys: string[]): number | undefined {
  const record = game as ApiGame & Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value === undefined || value === null || value === '' || value === 'null') continue;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

export interface ParsedScore {
  homeScore: number;
  awayScore: number;
  homePenScore?: number;
  awayPenScore?: number;
}

/** Parse "1 (4)" style score strings from the API. */
function parseScorePart(raw: string | null | undefined): { full: number; pen?: number } {
  if (raw == null || raw === 'null') {
    return { full: 0 };
  }

  const trimmed = raw.trim();
  const withPen = trimmed.match(/^(\d+)\s*\((\d+)\)$/);
  if (withPen) {
    return { full: Number(withPen[1]), pen: Number(withPen[2]) };
  }
  const numeric = Number(trimmed);
  return { full: Number.isNaN(numeric) ? 0 : numeric };
}

export function parseGameScores(game: ApiGame): ParsedScore {
  const homeParsed = parseScorePart(game.home_score);
  const awayParsed = parseScorePart(game.away_score);

  const homePenScore =
    readOptionalScore(game, [
      'home_pen_score',
      'home_penalty_score',
      'home_score_penalties',
      'home_penalties',
    ]) ?? homeParsed.pen;
  const awayPenScore =
    readOptionalScore(game, [
      'away_pen_score',
      'away_penalty_score',
      'away_score_penalties',
      'away_penalties',
    ]) ?? awayParsed.pen;

  return {
    homeScore: homeParsed.full,
    awayScore: awayParsed.full,
    homePenScore,
    awayPenScore,
  };
}

export function parseMatchPhase(
  game: ApiGame,
  scores: ParsedScore,
): MatchPhase {
  const elapsed = game.time_elapsed?.trim() ?? '';
  const elapsedLower = elapsed.toLowerCase();
  const finishedFlag = (game.finished ?? '').toUpperCase() === 'TRUE';
  const knockout = isKnockoutMatch(game.type);

  const hasPenScores =
    scores.homePenScore !== undefined && scores.awayPenScore !== undefined;

  if (FINISHED_ELAPSED.test(elapsed)) {
    if (/pen/i.test(elapsed) || (hasPenScores && knockout)) {
      return 'finishedPenalties';
    }
    if (/aet/i.test(elapsed)) {
      return 'finishedAET';
    }
    return 'finished';
  }

  if (finishedFlag || elapsedLower === 'finished' || elapsedLower === 'ft') {
    if (hasPenScores && knockout) return 'finishedPenalties';
    return 'finished';
  }

  if (elapsedLower === 'notstarted' || elapsedLower === 'null' || elapsed === '') {
    return 'scheduled';
  }

  if (PENALTY_ELAPSED.test(elapsed)) {
    return 'penalties';
  }

  if (ET_HALFTIME_ELAPSED.test(elapsed)) {
    return 'extraTimeHalftime';
  }

  if (ET_ELAPSED.test(elapsed)) {
    return 'extraTime';
  }

  if (HALFTIME_ELAPSED.test(elapsed)) {
    return 'halftime';
  }

  const minuteMatch = elapsed.match(/^(\d+)/);
  if (minuteMatch) {
    const minute = Number(minuteMatch[1]);
    if (knockout && minute > 90) return 'extraTime';
    return 'live';
  }

  const stoppageMatch = elapsed.match(/^(\d+)\s*\+\s*(\d+)/);
  if (stoppageMatch) {
    const base = Number(stoppageMatch[1]);
    if (knockout && base >= 90) return 'extraTime';
    return 'live';
  }

  if (elapsedLower === 'live') {
    return 'live';
  }

  return 'live';
}

export function enrichScoresForPhase(
  game: ApiGame,
  scores: ParsedScore,
  _phase: MatchPhase,
): ParsedScore {
  const homeReg = readOptionalScore(game, [
    'home_score_regulation',
    'home_score_90',
    'home_score_et',
  ]);
  const awayReg = readOptionalScore(game, [
    'away_score_regulation',
    'away_score_90',
    'away_score_et',
  ]);

  if (homeReg !== undefined && awayReg !== undefined) {
    return {
      homeScore: homeReg,
      awayScore: awayReg,
      homePenScore: scores.homePenScore,
      awayPenScore: scores.awayPenScore,
    };
  }

  return scores;
}

export function shouldShowPenaltyScores(phase: MatchPhase, scores: ParsedScore): boolean {
  if (scores.homePenScore === undefined || scores.awayPenScore === undefined) {
    return false;
  }
  return phase === 'penalties' || phase === 'finishedPenalties';
}

export function isLivePhase(phase: MatchPhase): boolean {
  return (
    phase === 'live' ||
    phase === 'halftime' ||
    phase === 'extraTime' ||
    phase === 'extraTimeHalftime' ||
    phase === 'penalties'
  );
}

export function isFinishedPhase(phase: MatchPhase): boolean {
  return phase === 'finished' || phase === 'finishedAET' || phase === 'finishedPenalties';
}

export function getFinishedBadgeKey(
  phase: MatchPhase,
): 'finished' | 'finishedAET' | 'finishedPenalties' {
  if (phase === 'finishedAET') return 'finishedAET';
  if (phase === 'finishedPenalties') return 'finishedPenalties';
  return 'finished';
}
