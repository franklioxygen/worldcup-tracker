import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMatchWinChances, type MatchWinChances } from '../api/polymarket';
import type { ApiGame, ApiTeam } from '../types';
import { getDateKey, getTodayKey } from '../utils/dates';

function isFinishedGame(game: ApiGame): boolean {
  return (game.finished ?? '').toUpperCase() === 'TRUE';
}

function eligibleDateKeys(dateKeys: string[]): string[] {
  const todayKey = getTodayKey();
  return [...new Set(dateKeys)].filter((key) => key >= todayKey);
}

function gamesForDateKeys(games: ApiGame[], dateKeys: string[]): ApiGame[] {
  const dateSet = new Set(eligibleDateKeys(dateKeys));
  if (dateSet.size === 0) return [];

  return games.filter((game) => {
    const dateKey = getDateKey(game.local_date);
    return dateSet.has(dateKey) && !isFinishedGame(game);
  });
}

export function useWinChances(games: ApiGame[], teams: ApiTeam[]) {
  const [winChances, setWinChances] = useState<Record<string, MatchWinChances>>({});
  const [loadingGameIds, setLoadingGameIds] = useState<Set<string>>(() => new Set());
  const fetchedDateKeysRef = useRef<Set<string>>(new Set());
  const pendingDateKeysRef = useRef<Set<string>>(new Set());
  const lastRequestedDateKeysRef = useRef<string[]>([]);
  const fetchGenerationRef = useRef(0);

  const fetchForDateKeys = useCallback(
    async (dateKeys: string[], options?: { force?: boolean }) => {
      const eligible = eligibleDateKeys(dateKeys);
      lastRequestedDateKeysRef.current = eligible;
      if (eligible.length === 0) return;

      const toFetch = options?.force
        ? eligible
        : eligible.filter(
            (key) =>
              !fetchedDateKeysRef.current.has(key) && !pendingDateKeysRef.current.has(key),
          );

      if (toFetch.length === 0) return;

      const targetGames = gamesForDateKeys(games, toFetch);
      if (targetGames.length === 0) {
        for (const key of toFetch) fetchedDateKeysRef.current.add(key);
        return;
      }

      const generation = ++fetchGenerationRef.current;
      const gameIds = targetGames.map((game) => game.id);

      for (const key of toFetch) pendingDateKeysRef.current.add(key);
      setLoadingGameIds((prev) => new Set([...prev, ...gameIds]));

      try {
        const results = await fetchMatchWinChances(targetGames, teams);
        if (generation !== fetchGenerationRef.current) return;

        setWinChances((prev) => ({ ...prev, ...results }));
        for (const key of toFetch) fetchedDateKeysRef.current.add(key);
      } finally {
        if (generation !== fetchGenerationRef.current) return;

        for (const key of toFetch) pendingDateKeysRef.current.delete(key);
        setLoadingGameIds((prev) => {
          const next = new Set(prev);
          for (const id of gameIds) next.delete(id);
          return next;
        });
      }
    },
    [games, teams],
  );

  const refetchRequested = useCallback(() => {
    const keys = lastRequestedDateKeysRef.current;
    if (keys.length === 0) return;

    for (const key of keys) fetchedDateKeysRef.current.delete(key);
    return fetchForDateKeys(keys, { force: true });
  }, [fetchForDateKeys]);

  useEffect(() => {
    const finishedIds = new Set(
      games.filter(isFinishedGame).map((game) => game.id),
    );
    if (finishedIds.size === 0) return;

    setWinChances((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of finishedIds) {
        if (id in next) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [games]);

  return {
    winChances,
    loadingGameIds,
    fetchForDateKeys,
    refetchRequested,
  };
}
