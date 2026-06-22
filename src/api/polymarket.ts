import type { ApiGame, ApiTeam } from '../types';
import { getDateKey } from '../utils/dates';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const FETCH_TIMEOUT_MS = 8000;
const CONCURRENCY = 8;

export interface MatchWinChances {
  home?: number;
  away?: number;
}

interface PolymarketMarket {
  slug?: string;
  groupItemTitle?: string;
  outcomePrices?: string;
  closed?: boolean;
}

interface PolymarketEvent {
  markets?: PolymarketMarket[];
}

function isFinishedGame(game: ApiGame): boolean {
  return (game.finished ?? '').toUpperCase() === 'TRUE';
}

function buildEventSlug(
  game: ApiGame,
  teamMap: Map<string, ApiTeam>,
): string | null {
  const homeTeam = teamMap.get(game.home_team_id);
  const awayTeam = teamMap.get(game.away_team_id);
  if (!homeTeam?.fifa_code || !awayTeam?.fifa_code) return null;
  if (game.home_team_id === '0' || game.away_team_id === '0') return null;

  const dateKey = getDateKey(game.local_date);
  return `fifwc-${homeTeam.fifa_code.toLowerCase()}-${awayTeam.fifa_code.toLowerCase()}-${dateKey}`;
}

function parseWinChance(price: string | undefined): number | undefined {
  if (price === undefined) return undefined;
  const value = Number(price);
  if (!Number.isFinite(value)) return undefined;
  return Math.round(value * 1000) / 10;
}

function extractWinChances(
  event: PolymarketEvent,
  homeCode: string,
  awayCode: string,
): MatchWinChances {
  const chances: MatchWinChances = {};
  const homeSuffix = `-${homeCode.toLowerCase()}`;
  const awaySuffix = `-${awayCode.toLowerCase()}`;

  for (const market of event.markets ?? []) {
    const slug = market.slug ?? '';
    const title = (market.groupItemTitle ?? '').toLowerCase();
    if (title.includes('draw')) continue;

    const prices = JSON.parse(market.outcomePrices ?? '[]') as string[];
    const yesChance = parseWinChance(prices[0]);
    if (yesChance === undefined) continue;

    if (slug.endsWith(homeSuffix)) {
      chances.home = yesChance;
    } else if (slug.endsWith(awaySuffix)) {
      chances.away = yesChance;
    }
  }

  return chances;
}

async function fetchEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(`${GAMMA_API}/events/slug/${slug}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return (await response.json()) as PolymarketEvent;
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Fetch Polymarket moneyline win chances for upcoming and live matches. */
export async function fetchMatchWinChances(
  games: ApiGame[],
  teams: ApiTeam[],
): Promise<Record<string, MatchWinChances>> {
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const pending = games
    .filter((game) => !isFinishedGame(game))
    .map((game) => {
      const slug = buildEventSlug(game, teamMap);
      const homeTeam = teamMap.get(game.home_team_id);
      const awayTeam = teamMap.get(game.away_team_id);
      if (!slug || !homeTeam?.fifa_code || !awayTeam?.fifa_code) return null;
      return {
        gameId: game.id,
        slug,
        homeCode: homeTeam.fifa_code,
        awayCode: awayTeam.fifa_code,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (pending.length === 0) return {};

  const fetched = await mapWithConcurrency(pending, CONCURRENCY, async (entry) => {
    const event = await fetchEventBySlug(entry.slug);
    if (!event) return { gameId: entry.gameId, chances: {} as MatchWinChances };
    return {
      gameId: entry.gameId,
      chances: extractWinChances(event, entry.homeCode, entry.awayCode),
    };
  });

  const result: Record<string, MatchWinChances> = {};
  for (const { gameId, chances } of fetched) {
    if (chances.home !== undefined || chances.away !== undefined) {
      result[gameId] = chances;
    }
  }
  return result;
}
