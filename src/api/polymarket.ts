import type { ApiGame, ApiTeam } from '../types';
import { getDateKey } from '../utils/dates';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const FETCH_TIMEOUT_MS = 8000;
const CONCURRENCY = 2;
const REQUEST_DELAY_MS = 200;
const MAX_RETRIES = 2;

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

interface SlugFetchEntry {
  slug: string;
  gameIds: string[];
  homeCode: string;
  awayCode: string;
}

/** Slugs confirmed absent on Polymarket — skip repeat requests (avoids console 404 noise). */
const missingSlugs = new Set<string>();

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  if (missingSlugs.has(slug)) return null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(`${GAMMA_API}/events/slug/${slug}`, {
        signal: controller.signal,
        cache: 'default',
      });
      clearTimeout(timeout);

      if (response.status === 404) {
        missingSlugs.add(slug);
        return null;
      }

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          await delay(500 * (attempt + 1));
          continue;
        }
        return null;
      }

      if (!response.ok) return null;
      return (await response.json()) as PolymarketEvent;
    } catch {
      if (attempt < MAX_RETRIES) {
        await delay(300 * (attempt + 1));
        continue;
      }
      return null;
    }
  }

  return null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      if (current > 0) await delay(REQUEST_DELAY_MS);
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function groupBySlug(
  games: ApiGame[],
  teamMap: Map<string, ApiTeam>,
): SlugFetchEntry[] {
  const map = new Map<string, SlugFetchEntry>();

  for (const game of games) {
    if (isFinishedGame(game)) continue;

    const slug = buildEventSlug(game, teamMap);
    const homeTeam = teamMap.get(game.home_team_id);
    const awayTeam = teamMap.get(game.away_team_id);
    if (!slug || !homeTeam?.fifa_code || !awayTeam?.fifa_code) continue;

    const existing = map.get(slug);
    if (existing) {
      existing.gameIds.push(game.id);
    } else {
      map.set(slug, {
        slug,
        gameIds: [game.id],
        homeCode: homeTeam.fifa_code,
        awayCode: awayTeam.fifa_code,
      });
    }
  }

  return [...map.values()];
}

/** Fetch Polymarket moneyline win chances for upcoming and live matches. */
export async function fetchMatchWinChances(
  games: ApiGame[],
  teams: ApiTeam[],
): Promise<Record<string, MatchWinChances>> {
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const slugEntries = groupBySlug(games, teamMap);
  if (slugEntries.length === 0) return {};

  const fetched = await mapWithConcurrency(slugEntries, CONCURRENCY, async (entry) => {
    const event = await fetchEventBySlug(entry.slug);
    const chances = event
      ? extractWinChances(event, entry.homeCode, entry.awayCode)
      : ({} as MatchWinChances);
    return { gameIds: entry.gameIds, chances };
  });

  const result: Record<string, MatchWinChances> = {};
  for (const { gameIds, chances } of fetched) {
    if (chances.home === undefined && chances.away === undefined) continue;
    for (const gameId of gameIds) {
      result[gameId] = chances;
    }
  }
  return result;
}
