import type { Match } from '../types';

/** Official WC2026 knockout feeder pairs (home feeder, away feeder). */
const KNOCKOUT_FEEDERS: Record<string, readonly [string, string]> = {
  '89': ['74', '77'],
  '90': ['73', '75'],
  '91': ['76', '78'],
  '92': ['79', '80'],
  '93': ['83', '84'],
  '94': ['81', '82'],
  '95': ['86', '88'],
  '96': ['85', '87'],
  '97': ['89', '90'],
  '98': ['93', '94'],
  '99': ['91', '92'],
  '100': ['95', '96'],
  '101': ['97', '98'],
  '102': ['99', '100'],
  '104': ['101', '102'],
};

const BRACKET_ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'] as const;

/** Official WC2026 feeder pair for a knockout match (home feeder, away feeder). */
export function getBracketFeeders(matchId: string): readonly [string, string] | undefined {
  return KNOCKOUT_FEEDERS[matchId];
}

const WINNER_MATCH_RE = /Winner Match (\d+)/i;

export function parseFeederMatchId(label: string): string | null {
  const match = label.match(WINNER_MATCH_RE);
  return match ? match[1] : null;
}

export function getMatchWinnerSide(match: Match): 'home' | 'away' | null {
  if (!match.finished) return null;

  if (
    match.showPenaltyScores &&
    match.homePenScore !== undefined &&
    match.awayPenScore !== undefined
  ) {
    if (match.homePenScore > match.awayPenScore) return 'home';
    if (match.awayPenScore > match.homePenScore) return 'away';
  }

  if (match.homeScore > match.awayScore) return 'home';
  if (match.awayScore > match.homeScore) return 'away';
  return null;
}

export interface BracketTeamSlot {
  name: string;
  code?: string;
  flag?: string;
  teamId?: string;
}

function isTbdSlot(slot: BracketTeamSlot): boolean {
  return !slot.teamId && slot.name === 'TBD';
}

function directTeamSlot(match: Match, side: 'home' | 'away'): BracketTeamSlot | null {
  const teamId = side === 'home' ? match.homeTeamId : match.awayTeamId;
  const teamName = side === 'home' ? match.homeTeam : match.awayTeam;
  const teamCode = side === 'home' ? match.homeCode : match.awayCode;
  const flag = side === 'home' ? match.homeFlag : match.awayFlag;

  if (teamId) {
    return { name: teamCode ?? teamName, code: teamCode, flag, teamId };
  }

  const feederId = parseFeederMatchId(teamName);
  if (feederId) {
    return null;
  }

  if (teamName && teamName !== 'TBD') {
    return { name: teamName, code: teamCode, flag };
  }

  return null;
}

function winnerSlotFromSide(match: Match, side: 'home' | 'away'): BracketTeamSlot {
  return directTeamSlot(match, side) ?? {
    name: (side === 'home' ? match.homeCode : match.awayCode) ??
      (side === 'home' ? match.homeTeam : match.awayTeam),
    code: side === 'home' ? match.homeCode : match.awayCode,
    flag: side === 'home' ? match.homeFlag : match.awayFlag,
    teamId: side === 'home' ? match.homeTeamId : match.awayTeamId,
  };
}

function bothDirectParticipants(match: Match): boolean {
  return Boolean(match.homeTeamId && match.awayTeamId);
}

/** Winner of a completed feeder match, using resolved participants + scores. */
function resolveFeederMatchWinner(
  matchId: string,
  byId: Map<string, Match>,
): BracketTeamSlot | null {
  const match = byId.get(matchId);
  if (!match?.finished) return null;

  // API confirmed both teams — trust this match's scores, not upstream R32 feeders.
  if (bothDirectParticipants(match)) {
    const home = directTeamSlot(match, 'home');
    const away = directTeamSlot(match, 'away');
    if (home && away) {
      if (match.homeScore > match.awayScore) return home;
      if (match.awayScore > match.homeScore) return away;

      const winnerSide = getMatchWinnerSide(match);
      if (winnerSide === 'home') return home;
      if (winnerSide === 'away') return away;
    }
    return null;
  }

  const home = resolveBracketTeamSlot(match, 'home', byId);
  const away = resolveBracketTeamSlot(match, 'away', byId);

  if (!isTbdSlot(home) && !isTbdSlot(away)) {
    if (match.homeScore > match.awayScore) return home;
    if (match.awayScore > match.homeScore) return away;

    const winnerSide = getMatchWinnerSide(match);
    if (winnerSide === 'home') return home;
    if (winnerSide === 'away') return away;
    return null;
  }

  const winnerSide = getMatchWinnerSide(match);
  if (!winnerSide) return null;
  return winnerSlotFromSide(match, winnerSide);
}

/** Resolve a knockout slot from the feeder tree or direct API assignment. */
export function resolveBracketTeamSlot(
  match: Match,
  side: 'home' | 'away',
  byId: Map<string, Match>,
): BracketTeamSlot {
  const direct = directTeamSlot(match, side);

  // When the API has assigned a real team to this slot, prefer it over upstream feeders.
  if (direct?.teamId) return direct;

  const feeders = KNOCKOUT_FEEDERS[match.id];
  const childFeederId = side === 'home' ? feeders?.[0] : feeders?.[1];

  if (childFeederId) {
    const winner = resolveFeederMatchWinner(childFeederId, byId);
    if (winner) return winner;
  }

  if (direct) return direct;

  return { name: 'TBD' };
}

const FINAL_MATCH_ID = '104';
const ROUND_BY_DEPTH = ['final', 'sf', 'qf', 'r16', 'r32'] as const;

/**
 * In-order traversal of the feeder tree from the final.
 * A parent match is visited between its two feeders, so each round's list comes
 * out top-to-bottom with feeders physically adjacent — no crossing branches.
 */
function collectBracketOrder(
  matchId: string,
  depth: number,
  byId: Map<string, Match>,
  out: Record<string, Match[]>,
): void {
  const feeders = KNOCKOUT_FEEDERS[matchId];

  if (feeders) collectBracketOrder(feeders[0], depth + 1, byId, out);

  const round = ROUND_BY_DEPTH[depth];
  const match = byId.get(matchId);
  if (round && match) out[round].push(match);

  if (feeders) collectBracketOrder(feeders[1], depth + 1, byId, out);
}

/** Order knockout matches for the visual bracket tree (not kickoff time). */
export function buildBracketRoundMatches(allMatches: Match[]): Map<string, Match[]> {
  const byId = new Map(allMatches.map((match) => [match.id, match]));
  const ordered: Record<string, Match[]> = {
    r32: [],
    r16: [],
    qf: [],
    sf: [],
    final: [],
  };

  collectBracketOrder(FINAL_MATCH_ID, 0, byId, ordered);

  const map = new Map<string, Match[]>();
  for (const round of BRACKET_ROUNDS) {
    map.set(round, ordered[round]);
  }

  const third = byId.get('103');
  if (third) map.set('third', [third]);

  // Fallback to type + id order if the feeder tree yielded nothing for a round.
  for (const round of BRACKET_ROUNDS) {
    if ((map.get(round)?.length ?? 0) === 0) {
      map.set(
        round,
        allMatches
          .filter((match) => match.type === round)
          .sort((a, b) => Number(a.id) - Number(b.id)),
      );
    }
  }

  return map;
}
