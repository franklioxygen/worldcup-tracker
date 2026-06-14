import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
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

export function MobileSchedule({
  dateGroups,
  initialDateKey,
  onTeamSelect,
  onStadiumSelect,
}: MobileScheduleProps) {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const initialIndex = Math.max(
    0,
    dateGroups.findIndex((g) => g.dateKey === initialDateKey),
  );

  const [startIndex, setStartIndex] = useState(() =>
    Math.max(0, initialIndex - 1),
  );
  const [endIndex, setEndIndex] = useState(() =>
    Math.min(dateGroups.length - 1, initialIndex + PAGE_SIZE),
  );
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [loadingLater, setLoadingLater] = useState(false);

  const visibleGroups = dateGroups.slice(startIndex, endIndex + 1);

  const loadEarlier = useCallback(() => {
    if (startIndex <= 0 || loadingEarlier) return;
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
  }, [startIndex, loadingEarlier]);

  const loadLater = useCallback(() => {
    if (endIndex >= dateGroups.length - 1 || loadingLater) return;
    setLoadingLater(true);
    setEndIndex((prev) => Math.min(dateGroups.length - 1, prev + PAGE_SIZE));
    setTimeout(() => setLoadingLater(false), 300);
  }, [endIndex, dateGroups.length, loadingLater]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

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
  }, [loadEarlier, loadLater, visibleGroups]);

  useEffect(() => {
    if (hasScrolledRef.current || !initialDateKey) return;

    const timer = setTimeout(() => {
      const container = containerRef.current;
      const el = document.getElementById(`date-${initialDateKey}`);
      if (container && el) {
        const top =
          el.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;
        container.scrollTo({ top, behavior: 'auto' });
        hasScrolledRef.current = true;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [initialDateKey, visibleGroups]);

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
