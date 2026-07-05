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

function orderRoundFromFeeders(roundIds: string[], byId: Map<string, Match>): Match[] {
  const ordered: Match[] = [];

  for (const matchId of roundIds) {
    const feeders = KNOCKOUT_FEEDERS[matchId];
    if (!feeders) continue;

    const match = byId.get(matchId);
    if (match) ordered.push(match);
  }

  return ordered;
}

function buildR32Order(byId: Map<string, Match>): Match[] {
  const ordered: Match[] = [];

  for (const r16Id of ['89', '90', '91', '92', '93', '94', '95', '96']) {
    const feeders = KNOCKOUT_FEEDERS[r16Id];
    if (!feeders) continue;

    for (const feederId of feeders) {
      const match = byId.get(feederId);
      if (match) ordered.push(match);
    }
  }

  return ordered;
}

/** Order knockout matches for the visual bracket tree (not kickoff time). */
export function buildBracketRoundMatches(allMatches: Match[]): Map<string, Match[]> {
  const byId = new Map(allMatches.map((match) => [match.id, match]));
  const map = new Map<string, Match[]>();

  map.set('r32', buildR32Order(byId));
  map.set('r16', orderRoundFromFeeders(['89', '90', '91', '92', '93', '94', '95', '96'], byId));
  map.set('qf', orderRoundFromFeeders(['97', '98', '99', '100'], byId));
  map.set('sf', orderRoundFromFeeders(['101', '102'], byId));
  map.set('final', orderRoundFromFeeders(['104'], byId));

  const third = byId.get('103');
  if (third) map.set('third', [third]);

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
