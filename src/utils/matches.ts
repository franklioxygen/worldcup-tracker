import type { ApiGame, ApiStadium, ApiTeam, DateGroup, Language, Match } from '../types';
import { translateKnockoutLabel, translateTeamName } from '../i18n/translations';
import { formatUserLocalTime, getDateKey, stadiumLocalToDate } from './dates';
import {
  enrichScoresForPhase,
  isFinishedPhase,
  isLivePhase,
  parseGameScores,
  parseMatchPhase,
  shouldShowPenaltyScores,
} from './matchPhase';
import { getStadiumTimeZone } from './timezones';

export function buildTeamMap(teams: ApiTeam[]): Map<string, ApiTeam> {
  return new Map(teams.map((team) => [team.id, team]));
}

export function buildStadiumMap(stadiums: ApiStadium[]): Map<string, ApiStadium> {
  return new Map(stadiums.map((stadium) => [stadium.id, stadium]));
}

function resolveTeamName(
  game: ApiGame,
  side: 'home' | 'away',
  teamMap: Map<string, ApiTeam>,
  lang: Language,
): string {
  const label = side === 'home' ? game.home_team_label : game.away_team_label;
  const nameEn = side === 'home' ? game.home_team_name_en : game.away_team_name_en;
  const teamId = side === 'home' ? game.home_team_id : game.away_team_id;

  if (label) {
    return translateKnockoutLabel(label, lang);
  }

  const resolvedName = nameEn || teamMap.get(teamId)?.name_en;
  if (resolvedName) {
    return translateTeamName(resolvedName, lang);
  }

  return 'TBD';
}

function resolveFlag(
  game: ApiGame,
  side: 'home' | 'away',
  teamMap: Map<string, ApiTeam>,
): string | undefined {
  const teamId = side === 'home' ? game.home_team_id : game.away_team_id;
  if (!teamId || teamId === '0') return undefined;
  return teamMap.get(teamId)?.flag;
}

export function transformGame(
  game: ApiGame,
  teamMap: Map<string, ApiTeam>,
  stadiumMap: Map<string, ApiStadium>,
  lang: Language,
): Match {
  const stadium = stadiumMap.get(game.stadium_id);
  const parsedScores = parseGameScores(game);
  const phase = parseMatchPhase(game, parsedScores);
  const scores = enrichScoresForPhase(game, parsedScores, phase);
  const finished = isFinishedPhase(phase);
  const live = isLivePhase(phase);
  const timeZone = getStadiumTimeZone(game.stadium_id);
  const kickoff = stadiumLocalToDate(game.local_date, timeZone);

  const homeTeamId = game.home_team_id && game.home_team_id !== '0' ? game.home_team_id : undefined;
  const awayTeamId = game.away_team_id && game.away_team_id !== '0' ? game.away_team_id : undefined;

  return {
    id: game.id,
    homeTeam: resolveTeamName(game, 'home', teamMap, lang),
    awayTeam: resolveTeamName(game, 'away', teamMap, lang),
    homeTeamId,
    awayTeamId,
    homeScore: scores.homeScore,
    awayScore: scores.awayScore,
    homePenScore: scores.homePenScore,
    awayPenScore: scores.awayPenScore,
    showPenaltyScores: shouldShowPenaltyScores(phase, scores),
    homeFlag: resolveFlag(game, 'home', teamMap),
    awayFlag: resolveFlag(game, 'away', teamMap),
    dateKey: getDateKey(game.local_date),
    time: formatUserLocalTime(kickoff, lang),
    kickoff,
    group: game.group,
    type: game.type,
    stadium: stadium?.name_en ?? '',
    city: stadium?.city_en ?? '',
    finished,
    live,
    phase,
    timeElapsed: game.time_elapsed,
  };
}

export function filterMatchesByTeam(matches: Match[], teamId: string): Match[] {
  return matches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
  );
}

export function groupMatchesByDate(matches: Match[]): DateGroup[] {
  const map = new Map<string, Match[]>();

  for (const match of matches) {
    const existing = map.get(match.dateKey) ?? [];
    existing.push(match);
    map.set(match.dateKey, existing);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dateMatches]) => ({
      dateKey,
      matches: dateMatches.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime()),
    }));
}
