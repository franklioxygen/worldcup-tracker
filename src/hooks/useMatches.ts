import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiGame, ApiStadium, ApiTeam, DateGroup, Language, Match } from '../types';
import {
  fetchAndBuildCache,
  loadCache,
  syncCacheIfNeeded,
  type WcCache,
} from '../storage/cache';
import { getCurrentOrNextDateKey } from '../utils/dates';
import {
  buildStadiumMap,
  buildTeamMap,
  groupMatchesByDate,
  transformGame,
} from '../utils/matches';

interface UseMatchesResult {
  dateGroups: DateGroup[];
  allMatches: Match[];
  dateKeys: string[];
  activeDateKey: string;
  setActiveDateKey: (key: string) => void;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  retry: () => void;
  refresh: (options?: { silent?: boolean }) => void;
}

function applyCache(
  cache: WcCache,
  setGames: (g: ApiGame[]) => void,
  setTeams: (t: ApiTeam[]) => void,
  setStadiums: (s: ApiStadium[]) => void,
) {
  setGames(cache.games);
  setTeams(cache.teams);
  setStadiums(cache.stadiums);
}

export function useMatches(language: Language): UseMatchesResult {
  const [games, setGames] = useState<ApiGame[]>([]);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [stadiums, setStadiums] = useState<ApiStadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDateKey, setActiveDateKey] = useState('');
  const [initialized, setInitialized] = useState(false);
  const syncingRef = useRef(false);
  const refreshingRef = useRef(false);

  const load = useCallback(async (force = false) => {
    setError(null);

    const cached = loadCache();

    if (cached && !force) {
      applyCache(cached, setGames, setTeams, setStadiums);
      setLoading(false);

      if (!syncingRef.current) {
        syncingRef.current = true;
        syncCacheIfNeeded(cached)
          .then((updated) => applyCache(updated, setGames, setTeams, setStadiums))
          .catch(() => {})
          .finally(() => {
            syncingRef.current = false;
          });
      }
      return;
    }

    setLoading(true);
    try {
      const cache = await fetchAndBuildCache();
      applyCache(cache, setGames, setTeams, setStadiums);
    } catch {
      if (cached) {
        applyCache(cached, setGames, setTeams, setStadiums);
      } else {
        setError('fetch_failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setError(null);
    if (!options?.silent) {
      setRefreshing(true);
    }

    const cached = loadCache();

    try {
      const cache = await fetchAndBuildCache();
      applyCache(cache, setGames, setTeams, setStadiums);
    } catch {
      if (cached) {
        applyCache(cached, setGames, setTeams, setStadiums);
      } else if (games.length === 0) {
        setError('fetch_failed');
      }
    } finally {
      refreshingRef.current = false;
      if (!options?.silent) {
        setRefreshing(false);
      }
    }
  }, [games.length]);

  const allMatches = useMemo(() => {
    if (games.length === 0) return [];

    const teamMap = buildTeamMap(teams);
    const stadiumMap = buildStadiumMap(stadiums);
    return games
      .map((game) => transformGame(game, teamMap, stadiumMap, language))
      .sort((a, b) => {
        const dateCompare = a.dateKey.localeCompare(b.dateKey);
        return dateCompare !== 0 ? dateCompare : a.kickoff.getTime() - b.kickoff.getTime();
      });
  }, [games, teams, stadiums, language]);

  const dateGroups = useMemo(() => groupMatchesByDate(allMatches), [allMatches]);
  const dateKeys = useMemo(() => dateGroups.map((g) => g.dateKey), [dateGroups]);

  useEffect(() => {
    if (dateKeys.length > 0 && !initialized) {
      setActiveDateKey(getCurrentOrNextDateKey(dateKeys));
      setInitialized(true);
    }
  }, [dateKeys, initialized]);

  const hasLiveMatches = useMemo(
    () => allMatches.some((match) => match.live),
    [allMatches],
  );

  useEffect(() => {
    if (!hasLiveMatches) return;

    const id = setInterval(() => {
      refresh({ silent: true });
    }, 60_000);

    return () => clearInterval(id);
  }, [hasLiveMatches, refresh]);

  return {
    dateGroups,
    allMatches,
    dateKeys,
    activeDateKey,
    setActiveDateKey,
    loading,
    refreshing,
    error,
    retry: () => load(true),
    refresh,
  };
}
