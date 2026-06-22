import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMatchesContext } from '../context/MatchesContext';
import { t } from '../i18n/translations';
import type { DateGroup, SelectedStadium, SelectedTeam } from '../types';
import { DateSection } from './DateSection';

const PAGE_SIZE = 3;

interface MobileScheduleProps {
  dateGroups: DateGroup[];
  initialDateKey: string;
  onTeamSelect?: (team: SelectedTeam) => void;
  onStadiumSelect?: (stadium: SelectedStadium) => void;
}

function getWindowForIndex(index: number, length: number) {
  if (length === 0 || index < 0) {
    return { start: 0, end: 0 };
  }

  return {
    start: Math.max(0, index - 1),
    end: Math.min(length - 1, index + PAGE_SIZE),
  };
}

export function MobileSchedule({
  dateGroups,
  initialDateKey,
  onTeamSelect,
  onStadiumSelect,
}: MobileScheduleProps) {
  const { language } = useLanguage();
  const { fetchWinChancesForDates } = useMatchesContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const initialWindowSetRef = useRef(false);
  const [paginationEnabled, setPaginationEnabled] = useState(false);

  const getTargetIndex = useCallback(
    () => Math.max(0, dateGroups.findIndex((g) => g.dateKey === initialDateKey)),
    [dateGroups, initialDateKey],
  );

  const [startIndex, setStartIndex] = useState(() => {
    const targetIndex = Math.max(
      0,
      dateGroups.findIndex((g) => g.dateKey === initialDateKey),
    );
    return getWindowForIndex(targetIndex, dateGroups.length).start;
  });
  const [endIndex, setEndIndex] = useState(() => {
    const targetIndex = Math.max(
      0,
      dateGroups.findIndex((g) => g.dateKey === initialDateKey),
    );
    return getWindowForIndex(targetIndex, dateGroups.length).end;
  });
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [loadingLater, setLoadingLater] = useState(false);

  const visibleGroups = dateGroups.slice(startIndex, endIndex + 1);

  useEffect(() => {
    const keys = dateGroups.slice(startIndex, endIndex + 1).map((group) => group.dateKey);
    fetchWinChancesForDates(keys);
  }, [startIndex, endIndex, dateGroups, fetchWinChancesForDates]);

  useEffect(() => {
    if (!initialDateKey || dateGroups.length === 0 || initialWindowSetRef.current) return;

    const targetIndex = getTargetIndex();
    if (targetIndex < 0) return;

    const { start, end } = getWindowForIndex(targetIndex, dateGroups.length);
    setStartIndex(start);
    setEndIndex(end);
    initialWindowSetRef.current = true;
    hasScrolledRef.current = false;
    setPaginationEnabled(false);
  }, [initialDateKey, dateGroups, getTargetIndex]);

  const loadEarlier = useCallback(() => {
    if (!paginationEnabled || startIndex <= 0 || loadingEarlier) return;
    setLoadingEarlier(true);
    const prevScrollHeight = containerRef.current?.scrollHeight ?? 0;
    setStartIndex((prev) => Math.max(0, prev - PAGE_SIZE));
    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) {
        el.scrollTop += el.scrollHeight - prevScrollHeight;
      }
      setLoadingEarlier(false);
    });
  }, [paginationEnabled, startIndex, loadingEarlier]);

  const loadLater = useCallback(() => {
    if (!paginationEnabled || endIndex >= dateGroups.length - 1 || loadingLater) {
      return;
    }
    setLoadingLater(true);
    setEndIndex((prev) => Math.min(dateGroups.length - 1, prev + PAGE_SIZE));
    setTimeout(() => setLoadingLater(false), 300);
  }, [paginationEnabled, endIndex, dateGroups.length, loadingLater]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !paginationEnabled) return;

    const topObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadEarlier();
      },
      { root, rootMargin: '100px' },
    );

    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadLater();
      },
      { root, rootMargin: '100px' },
    );

    const topEl = topSentinelRef.current;
    const bottomEl = bottomSentinelRef.current;

    if (topEl) topObserver.observe(topEl);
    if (bottomEl) bottomObserver.observe(bottomEl);

    return () => {
      if (topEl) topObserver.unobserve(topEl);
      if (bottomEl) bottomObserver.unobserve(bottomEl);
    };
  }, [loadEarlier, loadLater, paginationEnabled, visibleGroups]);

  useEffect(() => {
    if (hasScrolledRef.current || !initialDateKey) return;

    const targetIndex = getTargetIndex();
    if (targetIndex < 0 || targetIndex < startIndex || targetIndex > endIndex) return;

    let cancelled = false;

    const scrollToTarget = () => {
      if (cancelled || hasScrolledRef.current) return;

      const container = containerRef.current;
      const el = document.getElementById(`date-${initialDateKey}`);
      if (!container || !el) return;

      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;
      container.scrollTo({ top, behavior: 'auto' });
      hasScrolledRef.current = true;
      setPaginationEnabled(true);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToTarget);
    });

    return () => {
      cancelled = true;
    };
  }, [initialDateKey, startIndex, endIndex, getTargetIndex]);

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-lg px-4 py-4">
        <div ref={topSentinelRef} className="h-1" />
        {loadingEarlier && startIndex > 0 && (
          <p className="py-4 text-center text-xs text-slate-400">
            {t(language, 'loadEarlier')}
          </p>
        )}

        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <DateSection
              key={group.dateKey}
              id={`date-${group.dateKey}`}
              dateKey={group.dateKey}
              matches={group.matches}
              columns={1}
              onTeamSelect={onTeamSelect}
              onStadiumSelect={onStadiumSelect}
            />
          ))}
        </div>

        {loadingLater && endIndex < dateGroups.length - 1 && (
          <p className="py-4 text-center text-xs text-slate-400">
            {t(language, 'loadLater')}
          </p>
        )}
        <div ref={bottomSentinelRef} className="h-1" />
      </div>
    </div>
  );
}
