import { fetchGames, fetchStadiums, fetchTeams } from '../api/worldcup';
import type { ApiGame, ApiStadium, ApiTeam } from '../types';
import { getDateKey, getTodayKey } from '../utils/dates';

const CACHE_KEY = 'wc2026-data-cache';
const CACHE_VERSION = 1;

export interface WcCache {
  version: number;
  games: ApiGame[];
  teams: ApiTeam[];
  stadiums: ApiStadium[];
  lastSyncedAt: string;
  syncedDateKeys: string[];
}

export function loadCache(): WcCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as WcCache;
    if (parsed.version !== CACHE_VERSION || !parsed.games?.length) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function saveCache(cache: WcCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable — app still works from memory
  }
}

function groupGamesByDate(games: ApiGame[]): Map<string, ApiGame[]> {
  const map = new Map<string, ApiGame[]>();
  for (const game of games) {
    const key = getDateKey(game.local_date);
    const list = map.get(key) ?? [];
    list.push(game);
    map.set(key, list);
  }
  return map;
}

function isDateFullyFinished(games: ApiGame[]): boolean {
  return games.every((g) => g.finished.toUpperCase() === 'TRUE');
}

function isSyncedToday(lastSyncedAt: string): boolean {
  return new Date(lastSyncedAt).toDateString() === new Date().toDateString();
}

/** Dates whose results are final and stored — no API needed for these again. */
export function computeSyncedDateKeys(games: ApiGame[]): string[] {
  const todayKey = getTodayKey();
  const synced: string[] = [];

  for (const [dateKey, dateGames] of groupGamesByDate(games)) {
    if (dateKey < todayKey && isDateFullyFinished(dateGames)) {
      synced.push(dateKey);
    }
  }

  return [...new Set(synced)].sort();
}

/**
 * Fetch from API only when a past match day needs archiving or today's data
 * hasn't been synced yet this calendar day.
 */
export function shouldSyncFromApi(cache: WcCache): boolean {
  const todayKey = getTodayKey();
  const byDate = groupGamesByDate(cache.games);

  for (const dateKey of [...byDate.keys()].sort()) {
    if (dateKey < todayKey && !cache.syncedDateKeys.includes(dateKey)) {
      return true;
    }
  }

  const todayGames = byDate.get(todayKey);
  if (!todayGames) return false;

  if (!isSyncedToday(cache.lastSyncedAt)) return true;

  // Keep syncing on match days while any game today is still in progress
  if (!isDateFullyFinished(todayGames)) return true;

  if (!cache.syncedDateKeys.includes(todayKey)) return true;

  return false;
}

export async function fetchAndBuildCache(): Promise<WcCache> {
  const [games, teams, stadiums] = await Promise.all([
    fetchGames(),
    fetchTeams(),
    fetchStadiums(),
  ]);

  const cache: WcCache = {
    version: CACHE_VERSION,
    games,
    teams,
    stadiums,
    lastSyncedAt: new Date().toISOString(),
    syncedDateKeys: computeSyncedDateKeys(games),
  };

  saveCache(cache);
  return cache;
}

export async function syncCacheIfNeeded(cache: WcCache): Promise<WcCache> {
  if (!shouldSyncFromApi(cache)) return cache;
  return fetchAndBuildCache();
}
