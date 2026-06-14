import type { ApiGame, ApiStadium, ApiTeam } from '../types';

const GITHUB_RAW =
  'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main';

const JSDELIVR_CDN =
  'https://cdn.jsdelivr.net/gh/rezarahiminia/worldcup2026@main';

const LIVE_DATA_BASE =
  'https://raw.githubusercontent.com/franklioxygen/worldcup-tracker/live-data';

const LIVE_API = import.meta.env.DEV ? '/api' : 'https://worldcup26.ir';

const FAST_FETCH_TIMEOUT_MS = 8000;
/** worldcup26.ir often responds in 10–15s from browsers; 8s was aborting every live fetch. */
const LIVE_FETCH_TIMEOUT_MS = 30_000;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function tryFetchJson<T>(url: string, timeoutMs = FAST_FETCH_TIMEOUT_MS): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const data = await fetchJson<T>(url, controller.signal);
    clearTimeout(timeout);
    return data;
  } catch {
    return null;
  }
}

async function fetchJsonFromSources<T>(filename: string): Promise<T> {
  const bust = `t=${Date.now()}`;
  const sources = [
    `${GITHUB_RAW}/${filename}?${bust}`,
    `${JSDELIVR_CDN}/${filename}?${bust}`,
  ];

  for (const url of sources) {
    const data = await tryFetchJson<T>(url);
    if (data) return data;
  }

  throw new Error(`Failed to fetch ${filename}`);
}

async function fetchLive<T>(path: string): Promise<T | null> {
  return tryFetchJson<T>(`${LIVE_API}${path}`, LIVE_FETCH_TIMEOUT_MS);
}

/** Fallback when the live API is unavailable (synced by GitHub Actions). */
async function fetchLiveData<T>(filename: string): Promise<T | null> {
  if (import.meta.env.DEV) return null;
  return tryFetchJson<T>(`${LIVE_DATA_BASE}/${filename}?t=${Date.now()}`);
}

function gameFreshness(game: ApiGame): number {
  const elapsed = game.time_elapsed?.toLowerCase() ?? '';
  const finished =
    game.finished.toUpperCase() === 'TRUE' ||
    elapsed === 'finished' ||
    elapsed === 'ft' ||
    elapsed === 'aet' ||
    /pen/.test(elapsed);

  if (finished) {
    return 1_000 + (Number(game.home_score) || 0) + (Number(game.away_score) || 0);
  }

  if (elapsed !== 'notstarted' && elapsed !== 'null' && elapsed !== '') {
    const phaseBonus =
      /pen|shootout/.test(elapsed) ? 80 : /et|extra/.test(elapsed) ? 40 : 0;
    return 500 + phaseBonus + (Number(game.home_score) || 0) + (Number(game.away_score) || 0);
  }

  return 0;
}

/** Prefer the copy with the most up-to-date score/status per match id. */
export function mergeGames(...sources: ApiGame[][]): ApiGame[] {
  const map = new Map<string, ApiGame>();

  for (const games of sources) {
    for (const game of games) {
      const existing = map.get(game.id);
      if (!existing || gameFreshness(game) >= gameFreshness(existing)) {
        map.set(game.id, game);
      }
    }
  }

  return [...map.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

export async function fetchGames(): Promise<ApiGame[]> {
  const [live, synced, staticGames] = await Promise.all([
    fetchLive<{ games: ApiGame[] }>('/get/games'),
    fetchLiveData<{ games: ApiGame[] }>('games.json'),
    tryFetchJson<ApiGame[]>(`${GITHUB_RAW}/football.matches.json?t=${Date.now()}`),
  ]);

  const merged = mergeGames(
    staticGames ?? [],
    synced?.games ?? [],
    live?.games ?? [],
  );

  if (merged.length > 0) return merged;

  return fetchJsonFromSources<ApiGame[]>('football.matches.json');
}

export async function fetchTeams(): Promise<ApiTeam[]> {
  const live = await fetchLive<{ teams: ApiTeam[] }>('/get/teams');
  if (live?.teams) return live.teams;

  const synced = await fetchLiveData<{ teams: ApiTeam[] }>('teams.json');
  if (synced?.teams) return synced.teams;

  return fetchJsonFromSources<ApiTeam[]>('football.teams.json');
}

export async function fetchStadiums(): Promise<ApiStadium[]> {
  const live = await fetchLive<{ stadiums: ApiStadium[] }>('/get/stadiums');
  if (live?.stadiums) return live.stadiums;

  const synced = await fetchLiveData<{ stadiums: ApiStadium[] }>('stadiums.json');
  if (synced?.stadiums) return synced.stadiums;

  return fetchJsonFromSources<ApiStadium[]>('football.stadiums.json');
}
