import type { Match } from '../types';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamFlag?: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface GroupStanding {
  group: string;
  teams: TeamStanding[];
}

export function computeGroupStandings(matches: Match[]): GroupStanding[] {
  const groupMatches = matches.filter((m) => m.type === 'group');
  const groupMap = new Map<string, Map<string, TeamStanding>>();

  function getOrCreate(group: string, teamId: string, teamName: string, teamFlag?: string): TeamStanding {
    if (!groupMap.has(group)) groupMap.set(group, new Map());
    const teamMap = groupMap.get(group)!;
    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, { teamId, teamName, teamFlag, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    }
    return teamMap.get(teamId)!;
  }

  for (const match of groupMatches) {
    const { group, homeTeamId, awayTeamId, homeTeam, awayTeam, homeFlag, awayFlag, finished, homeScore, awayScore } = match;

    if (homeTeamId) getOrCreate(group, homeTeamId, homeTeam, homeFlag);
    if (awayTeamId) getOrCreate(group, awayTeamId, awayTeam, awayFlag);

    if (!finished) continue;

    const home = homeTeamId ? groupMap.get(group)?.get(homeTeamId) : undefined;
    const away = awayTeamId ? groupMap.get(group)?.get(awayTeamId) : undefined;

    if (home) {
      home.mp++;
      home.gf += homeScore;
      home.ga += awayScore;
      home.gd = home.gf - home.ga;
      if (homeScore > awayScore) { home.w++; home.pts += 3; }
      else if (homeScore === awayScore) { home.d++; home.pts += 1; }
      else home.l++;
    }

    if (away) {
      away.mp++;
      away.gf += awayScore;
      away.ga += homeScore;
      away.gd = away.gf - away.ga;
      if (awayScore > homeScore) { away.w++; away.pts += 3; }
      else if (awayScore === homeScore) { away.d++; away.pts += 1; }
      else away.l++;
    }
  }

  const result: GroupStanding[] = [];
  for (const [group, teamMap] of groupMap.entries()) {
    const teams = [...teamMap.values()].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.teamName.localeCompare(b.teamName);
    });
    result.push({ group, teams });
  }

  return result.sort((a, b) => a.group.localeCompare(b.group));
}

export const KNOCKOUT_ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'third', 'final'] as const;
export type KnockoutRound = (typeof KNOCKOUT_ROUND_ORDER)[number];

export interface KnockoutRoundGroup {
  round: KnockoutRound;
  matches: Match[];
}

const ROUND_INDEX = new Map(KNOCKOUT_ROUND_ORDER.map((r, i) => [r, i]));

export function groupKnockoutMatches(matches: Match[]): KnockoutRoundGroup[] {
  const map = new Map<KnockoutRound, Match[]>();

  for (const match of matches) {
    const round = match.type as KnockoutRound;
    if (!ROUND_INDEX.has(round)) continue;
    if (!map.has(round)) map.set(round, []);
    map.get(round)!.push(match);
  }

  return [...map.entries()]
    .sort(([a], [b]) => (ROUND_INDEX.get(a) ?? 99) - (ROUND_INDEX.get(b) ?? 99))
    .map(([round, ms]) => ({
      round,
      matches: ms.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime()),
    }));
}
