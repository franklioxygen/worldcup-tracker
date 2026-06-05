import type { ApiGame, ApiStadium, ApiTeam } from '../types';

const GITHUB_RAW =
  'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main';

const LIVE_API = import.meta.env.DEV ? '/api' : null;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchLive<T>(path: string): Promise<T | null> {
  if (!LIVE_API) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
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

  const data = await fetchJson<ApiGame[]>(`${GITHUB_RAW}/football.matches.json`);
  return data;
}

export async function fetchTeams(): Promise<ApiTeam[]> {
  const live = await fetchLive<{ teams: ApiTeam[] }>('/get/teams');
  if (live?.teams) return live.teams;

  return fetchJson<ApiTeam[]>(`${GITHUB_RAW}/football.teams.json`);
}

export async function fetchStadiums(): Promise<ApiStadium[]> {
  const live = await fetchLive<{ stadiums: ApiStadium[] }>('/get/stadiums');
  if (live?.stadiums) return live.stadiums;

  return fetchJson<ApiStadium[]>(`${GITHUB_RAW}/football.stadiums.json`);
}
