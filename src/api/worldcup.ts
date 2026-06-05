import type { ApiGame, ApiStadium, ApiTeam } from '../types';

const GITHUB_RAW =
  'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main';

const JSDELIVR_CDN =
  'https://cdn.jsdelivr.net/gh/rezarahiminia/worldcup2026@main';

const LIVE_API = import.meta.env.DEV ? '/api' : 'https://worldcup26.ir';

const FETCH_TIMEOUT_MS = 3000;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function tryFetchJson<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const data = await fetchJson<T>(url, controller.signal);
    clearTimeout(timeout);
    return data;
  } catch {
    return null;
  }
}

async function fetchJsonFromSources<T>(filename: string): Promise<T> {
  const sources = [`${GITHUB_RAW}/${filename}`, `${JSDELIVR_CDN}/${filename}`];

  for (const url of sources) {
    const data = await tryFetchJson<T>(url);
    if (data) return data;
  }

  throw new Error(`Failed to fetch ${filename}`);
}

async function fetchLive<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(`${LIVE_API}${path}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchGames(): Promise<ApiGame[]> {
  const live = await fetchLive<{ games: ApiGame[] }>('/get/games');
  if (live?.games) return live.games;

  return fetchJsonFromSources<ApiGame[]>('football.matches.json');
}

export async function fetchTeams(): Promise<ApiTeam[]> {
  const live = await fetchLive<{ teams: ApiTeam[] }>('/get/teams');
  if (live?.teams) return live.teams;

  return fetchJsonFromSources<ApiTeam[]>('football.teams.json');
}

export async function fetchStadiums(): Promise<ApiStadium[]> {
  const live = await fetchLive<{ stadiums: ApiStadium[] }>('/get/stadiums');
  if (live?.stadiums) return live.stadiums;

  return fetchJsonFromSources<ApiStadium[]>('football.stadiums.json');
}
