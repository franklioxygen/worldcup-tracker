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

function isInvalidScore(score: string | undefined): boolean {
  return score == null || score === '' || score === 'null';
}

/** Scheduled placeholders use 0-0 before kickoff — not real results. */
function isPlaceholderScore(game: ApiGame): boolean {
  const elapsed = game.time_elapsed?.toLowerCase() ?? '';
  const notStarted = elapsed === 'notstarted' || elapsed === 'null' || elapsed === '';
  const finished = (game.finished ?? '').toUpperCase() === 'TRUE';
  if (!notStarted || finished) return false;

  const homeScore = Number(game.home_score);
  const awayScore = Number(game.away_score);
  return (
    !isInvalidScore(game.home_score) &&
    !isInvalidScore(game.away_score) &&
    !Number.isNaN(homeScore) &&
    !Number.isNaN(awayScore) &&
    homeScore === 0 &&
    awayScore === 0
  );
}

function hasTeamId(teamId: string | undefined): boolean {
  return !!teamId && teamId !== '0';
}

function gameFreshness(game: ApiGame): number {
  const elapsed = game.time_elapsed?.toLowerCase() ?? '';
  const finished =
    (game.finished ?? '').toUpperCase() === 'TRUE' ||
    elapsed === 'finished' ||
    elapsed === 'ft' ||
    elapsed === 'aet' ||
    /pen/.test(elapsed);

  const homeScore = Number(game.home_score);
  const awayScore = Number(game.away_score);
  const hasValidScores =
    !isInvalidScore(game.home_score) &&
    !isInvalidScore(game.away_score) &&
    !Number.isNaN(homeScore) &&
    !Number.isNaN(awayScore) &&
    !isPlaceholderScore(game);

  if (finished && hasValidScores) {
    return 1_000 + homeScore + awayScore;
  }

  if (elapsed !== 'notstarted' && elapsed !== 'null' && elapsed !== '') {
    const phaseBonus =
      /pen|shootout/.test(elapsed) ? 80 : /et|extra/.test(elapsed) ? 40 : 0;
    const scoreBonus = hasValidScores ? homeScore + awayScore : 0;
    return 500 + phaseBonus + scoreBonus;
  }

  // Prefer scheduled copies with real scores over sources that return "null".
  return hasValidScores ? 1 : 0;
}

/** Merge score/status from the fresher copy while keeping resolved team ids. */
function mergeTwoGames(a: ApiGame, b: ApiGame): ApiGame {
  const [fresher, other] = gameFreshness(a) >= gameFreshness(b) ? [a, b] : [b, a];
  const merged: ApiGame = { ...fresher };

  for (const side of ['home', 'away'] as const) {
    const idKey = `${side}_team_id` as const;
    const nameEnKey = `${side}_team_name_en` as const;
    const nameFaKey = `${side}_team_name_fa` as const;
    const labelKey = `${side}_team_label` as const;

    if (!hasTeamId(merged[idKey]) && hasTeamId(other[idKey])) {
      merged[idKey] = other[idKey];
      if (!merged[nameEnKey] && other[nameEnKey]) merged[nameEnKey] = other[nameEnKey];
      if (!merged[nameFaKey] && other[nameFaKey]) merged[nameFaKey] = other[nameFaKey];
      if (!merged[labelKey] && other[labelKey]) merged[labelKey] = other[labelKey];
    }
  }

  return merged;
}

/** Prefer the copy with the most up-to-date score/status per match id. */
export function mergeGames(...sources: ApiGame[][]): ApiGame[] {
  const map = new Map<string, ApiGame>();

  for (const games of sources) {
    for (const game of games) {
      const existing = map.get(game.id);
      map.set(game.id, existing ? mergeTwoGames(existing, game) : game);
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

/** Teams rarely change — prefer static/CDN sources to avoid live API rate limits. */
export async function fetchTeams(): Promise<ApiTeam[]> {
  const bust = `t=${Date.now()}`;
  const staticTeams = await tryFetchJson<ApiTeam[]>(
    `${JSDELIVR_CDN}/football.teams.json?${bust}`,
  );
  if (staticTeams?.length) return staticTeams;

  const synced = await fetchLiveData<{ teams: ApiTeam[] }>('teams.json');
  if (synced?.teams) return synced.teams;

  const live = await fetchLive<{ teams: ApiTeam[] }>('/get/teams');
  if (live?.teams) return live.teams;

  return fetchJsonFromSources<ApiTeam[]>('football.teams.json');
}

/** Stadiums rarely change — prefer static/CDN sources to avoid live API rate limits. */
export async function fetchStadiums(): Promise<ApiStadium[]> {
  const bust = `t=${Date.now()}`;
  const staticStadiums = await tryFetchJson<ApiStadium[]>(
    `${JSDELIVR_CDN}/football.stadiums.json?${bust}`,
  );
  if (staticStadiums?.length) return staticStadiums;

  const synced = await fetchLiveData<{ stadiums: ApiStadium[] }>('stadiums.json');
  if (synced?.stadiums) return synced.stadiums;

  const live = await fetchLive<{ stadiums: ApiStadium[] }>('/get/stadiums');
  if (live?.stadiums) return live.stadiums;

  return fetchJsonFromSources<ApiStadium[]>('football.stadiums.json');
}
